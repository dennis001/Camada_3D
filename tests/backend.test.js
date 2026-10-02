import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createServer } from 'node:net'
import { mkdtemp, mkdir, rm, readFile, unlink } from 'node:fs/promises'
import path from 'node:path'
import pg from 'pg'
import { localPostgres } from '../scripts/local-postgres.mjs'
import { provisionAdmins } from '../scripts/admin.mjs'
import { createPool, migrate } from '../server/db.js'
import { buildApp } from '../server/app.js'
import { hashPassword, token, digest } from '../server/security.js'
import { readCatalog } from '../server/catalog.js'
import { exportDatabase, restoreDatabase } from '../server/backup.js'
import { criarProduto } from '../src/lib/produtos.js'

const origin = 'http://127.0.0.1:3000'
function fixture() {
  return {
    ...criarProduto(), nome: 'Produto de teste automatizado', categoriaId: 'natal', descricao: 'Somente teste', material: 'PLA', medidas: '5 cm', precoCentavos: 129990,
    imagens: ['/foto-teste.jpg'], cores: [{ id: randomUUID(), nome: 'Verde', sku: `SKU-${randomUUID()}`, estoqueSite: 3 }],
    origem: { plataforma: 'Autoral', autor: 'Teste', url: '', licenca: 'Teste', usoComercial: 'permitido', evidencia: 'Evidência fictícia exclusiva da massa de testes' },
  }
}
async function freePort() {
  const server = createServer()
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const port = server.address().port
  await new Promise(resolve => server.close(resolve))
  return port
}

test('Backend integrado a PostgreSQL real', { timeout: 120000 }, async t => {
  const localRoot = path.resolve('.local')
  await mkdir(localRoot, { recursive: true })
  const directory = await mkdtemp(path.join(localRoot, 'test-db-'))
  const port = await freePort()
  const dbPassword = token()
  const database = await localPostgres({ directory, port, password: dbPassword })
  let pool, restored, app
  const credentials = { dennis: token(), talissa: token() }
  const newPassword = 'Abcdef!g'
  let dennis, talissa, product
  function headers(session) { return { origin, cookie: session.cookie, 'x-csrf-token': session.csrfToken } }
  async function login(username, password, instance = app, loginOrigin = origin) {
    const response = await instance.inject({ method: 'POST', url: '/api/auth/login', headers: { origin: loginOrigin }, payload: { username, password } })
    assert.equal(response.statusCode, 200, response.body)
    return { ...response.json(), cookie: `${response.cookies[0].name}=${response.cookies[0].value}`, response }
  }
  async function save(session, produto, revision) {
    return app.inject({ method: 'PUT', url: `/api/admin/produtos/${encodeURIComponent(produto.id)}`, headers: headers(session), payload: { produto, revision } })
  }
  try {
    await database.start()
    const connectionString = `postgresql://camada:${dbPassword}@127.0.0.1:${port}/postgres`
    pool = createPool(connectionString)
    await migrate(pool)
    await migrate(pool)
    for (const username of ['dennis', 'talissa']) await pool.query('INSERT INTO admins(id,username,name,password_hash,must_change_password) VALUES($1,$2,$3,$4,$5)', [randomUUID(), username, username === 'dennis' ? 'Dennis' : 'Talissa', await hashPassword(credentials[username]), username === 'dennis'])
    app = await buildApp({ pool, origin, loginMax: 100 })

    await t.test('migrações são repetíveis, área privada e origem externa são bloqueadas', async () => {
      assert.equal((await pool.query('SELECT * FROM schema_migrations')).rowCount, 2)
      for (const url of ['/api/admin/produtos', '/api/admin/historico', '/api/auth/me']) assert.equal((await app.inject(url)).statusCode, 401)
      assert.equal((await app.inject({ method: 'POST', url: '/api/auth/login', headers: { origin: 'https://intruso.invalid' }, payload: { username: 'dennis', password: credentials.dennis } })).statusCode, 403)
      assert.equal((await app.inject({ method: 'PUT', url: '/api/admin/produtos/p', headers: { origin }, payload: { produto: fixture(), revision: 0 } })).statusCode, 401)
      assert.equal((await app.inject({ method: 'POST', url: '/api/auth/login', headers: { origin }, payload: { username: "' OR 1=1 --", password: 'invalida' } })).statusCode, 401)
    })
    await t.test('contas individuais, cookie protegido e senha temporária obrigatória', async () => {
      const initial = await login('dennis', credentials.dennis)
      assert.ok(initial.response.headers['set-cookie'].includes('HttpOnly'))
      assert.ok(initial.response.headers['set-cookie'].includes('SameSite=Strict'))
      assert.equal((await app.inject({ url: '/api/admin/produtos', headers: headers(initial) })).statusCode, 403)
      assert.equal((await app.inject({ method: 'POST', url: '/api/auth/password', headers: { origin, cookie: initial.cookie }, payload: { currentPassword: credentials.dennis, newPassword } })).statusCode, 403)
      const weak = await app.inject({ method: 'POST', url: '/api/auth/password', headers: headers(initial), payload: { currentPassword: credentials.dennis, newPassword: 'abcdefgh' } })
      assert.equal(weak.statusCode, 400)
      assert.match(weak.json().error, /maiúscula/)
      const changed = await app.inject({ method: 'POST', url: '/api/auth/password', headers: headers(initial), payload: { currentPassword: credentials.dennis, newPassword } })
      assert.equal(changed.statusCode, 200, changed.body)
      assert.equal((await app.inject({ url: '/api/auth/me', headers: headers(initial) })).statusCode, 401)
      assert.equal((await app.inject({ method: 'POST', url: '/api/auth/login', headers: { origin }, payload: { username: 'dennis', password: credentials.dennis } })).statusCode, 401)
      dennis = await login('dennis', newPassword)
      talissa = await login('talissa', credentials.talissa)
      assert.notEqual(dennis.user.id, talissa.user.id)
      assert.equal(dennis.user.mustChangePassword, false)
      const sessions = (await pool.query('SELECT token_hash FROM sessions')).rows
      assert.ok(sessions.every(s => !dennis.cookie.includes(s.token_hash)))
    })
    await t.test('somente perfis admin e developer acessam a administração', async () => {
      assert.equal(dennis.user.role, 'admin')
      await pool.query("UPDATE admins SET role='developer' WHERE username='talissa'")
      talissa = await login('talissa', credentials.talissa)
      assert.equal(talissa.user.role, 'developer')
      assert.equal((await app.inject({ url: '/api/admin/produtos', headers: headers(talissa) })).statusCode, 200)
      await pool.query("UPDATE admins SET role='customer' WHERE username='dennis'")
      try {
        const common = await login('dennis', newPassword)
        assert.equal(common.user.role, 'customer')
        const forged = { ...headers(common), 'x-user-role': 'admin' }
        assert.equal((await app.inject({ url: '/api/admin/produtos', headers: forged })).statusCode, 403)
        assert.equal((await app.inject({ url: '/api/admin/historico', headers: forged })).statusCode, 403)
        assert.equal((await save(common, fixture(), 0)).statusCode, 403)
        assert.equal((await app.inject('/api/catalogo')).statusCode, 200)
      } finally { await pool.query("UPDATE admins SET role='admin' WHERE username='dennis'") }
    })
    await t.test('cadastro público cria cliente persistente sem acesso administrativo', async () => {
      const payload = { name: 'Cliente Teste', email: ' CLIENTE@example.test ', password: 'Abcdef!g' }
      const register = body => app.inject({ method: 'POST', url: '/api/auth/register', headers: { origin }, payload: body })
      assert.equal((await register({ ...payload, role: 'admin' })).statusCode, 400)
      assert.equal((await register({ ...payload, email: 'dennis' })).statusCode, 400)
      assert.equal((await app.inject({ method: 'POST', url: '/api/auth/register', headers: { origin: 'https://intruso.invalid' }, payload })).statusCode, 403)
      const response = await register(payload)
      assert.equal(response.statusCode, 201, response.body)
      assert.equal(response.body.includes(payload.password), false)
      const customer = await login('cliente@EXAMPLE.test', payload.password)
      assert.equal(customer.user.role, 'customer')
      assert.equal(customer.user.mustChangePassword, false)
      for (const url of ['/api/admin/produtos', '/api/admin/historico']) assert.equal((await app.inject({ url, headers: headers(customer) })).statusCode, 403)
      assert.equal((await save(customer, fixture(), 0)).statusCode, 403)
      assert.equal((await register({ ...payload, email: 'cliente@example.test' })).statusCode, 409)
      const weak = await register({ ...payload, email: 'outra@example.test', password: 'ABCDEFG!' })
      assert.equal(weak.statusCode, 400)
      assert.match(weak.json().error, /minúscula/)
      const stored = (await pool.query("SELECT * FROM admins WHERE username='cliente@example.test'")).rows[0]
      assert.notEqual(stored.password_hash, payload.password)
      assert.equal((await pool.query("SELECT count(*)::int AS count FROM admins WHERE username='cliente@example.test'")).rows[0].count, 1)
      assert.equal((await app.inject({ method: 'POST', url: '/api/auth/logout', headers: headers(customer) })).statusCode, 200)
      assert.equal((await app.inject({ url: '/api/auth/me', headers: headers(customer) })).statusCode, 401)
    })
    await t.test('cadastro rejeita dados inválidos e limita tentativas', async () => {
      const limited = await buildApp({ pool, origin })
      try {
        const payload = { name: '  ', email: 'invalido', password: token() }
        for (let i = 0; i < 5; i++) assert.equal((await limited.inject({ method: 'POST', url: '/api/auth/register', headers: { origin }, payload })).statusCode, 400)
        assert.equal((await limited.inject({ method: 'POST', url: '/api/auth/register', headers: { origin }, payload })).statusCode, 429)
      } finally { await limited.close() }
    })
    await t.test('sessões e origens de desenvolvimento não são aceitas em produção', async () => {
      const prod = await buildApp({ pool, origin: 'https://studiocamadas.com.br', production: true, environment: 'production' })
      try {
        const copiedCookie = `__Host-camada_production_session=${dennis.cookie.split('=')[1]}`
        assert.equal((await prod.inject({ url: '/api/auth/me', headers: { cookie: copiedCookie } })).statusCode, 401)
        const legitimate = await login('dennis', newPassword, prod, 'https://studiocamadas.com.br')
        assert.equal(legitimate.response.headers['set-cookie'].includes('Domain='), false)
        assert.ok(legitimate.cookie.startsWith('__Host-camada_production_session='))
        assert.equal((await prod.inject({ method: 'POST', url: '/api/auth/logout', headers: { ...headers(legitimate), origin: 'https://dev.studiocamadas.com.br' } })).statusCode, 403)
        assert.equal((await prod.inject({ url: '/api/auth/me', headers: { cookie: legitimate.cookie } })).statusCode, 200)
      } finally { await prod.close() }
    })
    await t.test('salvar rascunho persiste no banco compartilhado e exige CSRF', async () => {
      product = fixture()
      product.cores[0].imagem = '/produtos/teste/verde.png'
      const denied = await app.inject({ method: 'PUT', url: `/api/admin/produtos/${product.id}`, headers: { origin, cookie: dennis.cookie }, payload: { produto: product, revision: 0 } })
      assert.equal(denied.statusCode, 403)
      const saved = await save(dennis, product, 0)
      assert.equal(saved.statusCode, 200, saved.body)
      assert.equal(saved.json().revision, 1)
      const shared = await app.inject({ url: '/api/admin/produtos', headers: headers(talissa) })
      assert.equal(shared.json().produtos[0].id, product.id)
      assert.equal(shared.json().produtos[0].cores[0].imagem, '/produtos/teste/verde.png')
      assert.deepEqual((await app.inject('/api/catalogo')).json().produtos, [])
    })
    await t.test('prévia local mostra apenas rascunhos selecionados sem liberar produção ou dados privados', async () => {
      const preview = await buildApp({ pool, origin, catalogPreviewIds: [product.id] })
      try {
        const items = (await preview.inject('/api/catalogo')).json().produtos
        assert.equal(items.length, 1)
        assert.equal(items[0].id, product.id)
        assert.equal(items[0].emTeste, true)
        assert.equal(items[0].ficha, undefined)
        assert.equal(items[0].origem, undefined)
        assert.deepEqual((await app.inject('/api/catalogo')).json().produtos, [])
        assert.equal((await readCatalog(pool)).produtos[0].publicado, false)
      } finally { await preview.close() }
      for (const options of [{ production: true, origin: 'https://studiocamadas.com.br' }, { environment: 'production' }, { origin: 'https://dev.studiocamadas.com.br' }]) {
        await assert.rejects(buildApp({ pool, origin, catalogPreviewIds: [product.id], ...options }), /exclusiva do ambiente local/)
      }
    })
    await t.test('publicação expõe só dados comerciais e guarda revisão e responsável', async () => {
      product.publicado = true
      const response = await save(talissa, product, 1)
      assert.equal(response.statusCode, 200, response.body)
      const publicProduct = (await app.inject('/api/catalogo')).json().produtos[0]
      assert.equal(publicProduct.precoCentavos, 129990)
      assert.equal(publicProduct.ficha, undefined)
      assert.equal(publicProduct.origem, undefined)
      assert.equal(publicProduct.cores[0].imagem, '/produtos/teste/verde.png')
      const history = (await app.inject({ url: '/api/admin/historico', headers: headers(dennis) })).json().eventos
      assert.ok(history.some(e => e.actor_name === 'Talissa' && e.product_id === product.id))
      assert.equal(JSON.stringify(history).includes('password_hash'), false)
      assert.equal((await pool.query('SELECT * FROM product_revisions WHERE product_id=$1', [product.id])).rowCount, 2)
    })
    await t.test('edições simultâneas não sobrescrevem a versão vencedora', async () => {
      const revision = (await readCatalog(pool)).revision
      const responses = await Promise.all([save(dennis, { ...product, nome: 'Edição Dennis' }, revision), save(talissa, { ...product, nome: 'Edição Talissa' }, revision)])
      assert.deepEqual(responses.map(r => r.statusCode).sort(), [200, 409])
      const current = await readCatalog(pool)
      assert.equal(current.revision, revision + 1)
      assert.equal(current.produtos[0].nome, responses.find(r => r.statusCode === 200).json().produtos[0].nome)
    })
    await t.test('SKU único, validação e importação inválida mantêm o banco intacto', async () => {
      const before = await readCatalog(pool)
      const duplicate = fixture()
      duplicate.cores[0].sku = product.cores[0].sku.toLowerCase()
      assert.equal((await save(dennis, duplicate, before.revision)).statusCode, 400)
      const invalid = { ...fixture(), precoCentavos: -100 }
      const imported = await app.inject({ method: 'POST', url: '/api/admin/produtos/importar', headers: headers(dennis), payload: { produtos: [fixture(), invalid], revision: before.revision } })
      assert.equal(imported.statusCode, 400)
      assert.deepEqual(await readCatalog(pool), before)
      assert.equal((await save(dennis, { ...fixture(), imagens: ['javascript:alert(1)'] }, before.revision)).statusCode, 400)
      const invalidImage = fixture()
      invalidImage.cores[0].imagem = 'javascript:alert(1)'
      assert.equal((await save(dennis, invalidImage, before.revision)).statusCode, 400)
      assert.equal((await save(dennis, { ...fixture(), cores: null }, before.revision)).statusCode, 400)
      const existing = (await pool.query('SELECT * FROM variants LIMIT 1')).rows[0]
      await assert.rejects(pool.query('INSERT INTO variants(product_id,id,sku_key,stock_site) VALUES($1,$2,$3,$4)', [existing.product_id, randomUUID(), existing.sku_key, 0]), { code: '23505' })
    })
    await t.test('importação válida mescla IDs e preserva registros não enviados', async () => {
      const before = await readCatalog(pool)
      const extra = fixture()
      const result = await app.inject({ method: 'POST', url: '/api/admin/produtos/importar', headers: headers(talissa), payload: { produtos: [extra], revision: before.revision } })
      assert.equal(result.statusCode, 200, result.body)
      assert.equal(result.json().produtos.length, 2)
      assert.ok(result.json().produtos.some(p => p.id === product.id))
    })
    await t.test('reinício da API mantém dados e sessões válidas', async () => {
      const before = await readCatalog(pool)
      await app.close()
      app = await buildApp({ pool, origin, loginMax: 100 })
      assert.deepEqual((await app.inject({ url: '/api/admin/produtos', headers: headers(dennis) })).json(), before)
    })
    await t.test('logout, expiração e recuperação local revogam acesso', async () => {
      const temporary = await login('dennis', newPassword)
      assert.equal((await app.inject({ method: 'POST', url: '/api/auth/logout', headers: headers(temporary) })).statusCode, 200)
      assert.equal((await app.inject({ url: '/api/auth/me', headers: headers(temporary) })).statusCode, 401)
      await pool.query("UPDATE sessions SET expires_at=now()-interval '1 minute' WHERE token_hash=$1", [digest(dennis.cookie.split('=')[1])])
      assert.equal((await app.inject({ url: '/api/auth/me', headers: headers(dennis) })).statusCode, 401)
      const file = await provisionAdmins(pool, 'talissa')
      try {
        assert.equal((await app.inject({ url: '/api/auth/me', headers: headers(talissa) })).statusCode, 401)
        const password = (await readFile(file, 'utf8')).match(/Senha temporária: ([^\n]+)/)[1]
        const recovered = await login('talissa', password)
        assert.equal(recovered.user.mustChangePassword, true)
        assert.equal((await app.inject({ url: '/api/admin/produtos', headers: headers(recovered) })).statusCode, 403)
      } finally { await unlink(file) }
    })
    await t.test('limita tentativas e marca cookie Secure em produção', async () => {
      const limited = await buildApp({ pool, origin, loginMax: 2 })
      try {
        for (let i = 0; i < 2; i++) assert.equal((await limited.inject({ method: 'POST', url: '/api/auth/login', headers: { origin }, payload: { username: 'dennis', password: 'incorreta' } })).statusCode, 401)
        assert.equal((await limited.inject({ method: 'POST', url: '/api/auth/login', headers: { origin }, payload: { username: 'dennis', password: 'incorreta' } })).statusCode, 429)
      } finally { await limited.close() }
      const secure = await buildApp({ pool, origin: 'https://studiocamadas.test', production: true })
      try {
        const result = await login('dennis', newPassword, secure, 'https://studiocamadas.test')
        assert.ok(result.response.headers['set-cookie'].includes('Secure'))
        assert.ok(result.cookie.startsWith('__Host-'))
      } finally { await secure.close() }
    })
    await t.test('backup restaura cadastros, contas e histórico em banco vazio sem sessões', async () => {
      const snapshot = await exportDatabase(pool)
      assert.equal(snapshot.sessions, undefined)
      await pool.query('CREATE DATABASE restore_test')
      restored = createPool(connectionString.replace('/postgres', '/restore_test'))
      await migrate(restored)
      await restoreDatabase(restored, JSON.parse(JSON.stringify(snapshot)))
      assert.deepEqual(await readCatalog(restored), await readCatalog(pool))
      assert.equal((await restored.query('SELECT * FROM admins')).rowCount, 3)
      assert.equal((await restored.query("SELECT role FROM admins WHERE username='cliente@example.test'")).rows[0].role, 'customer')
      assert.equal((await restored.query('SELECT * FROM sessions')).rowCount, 0)
      assert.equal((await restored.query('SELECT * FROM product_revisions')).rowCount, (await pool.query('SELECT * FROM product_revisions')).rowCount)
      await assert.rejects(restoreDatabase(restored, snapshot), /banco vazio/)
      await restored.end(); restored = null
    })
    await t.test('reinício do PostgreSQL mantém o catálogo e o histórico', async () => {
      const before = await readCatalog(pool)
      await app.close(); app = null
      await pool.end(); pool = null
      await database.stop()
      await database.start()
      pool = createPool(connectionString)
      assert.deepEqual(await readCatalog(pool), before)
      assert.ok((await pool.query('SELECT * FROM audit_events')).rowCount > 0)
    })
  } finally {
    await app?.close()
    await restored?.end()
    await pool?.end()
    await database.stop()
    const relative = path.relative(localRoot, directory)
    if (!relative.startsWith('test-db-') || relative.includes(path.sep) || path.isAbsolute(relative)) throw new Error('Diretório temporário fora do escopo de limpeza.')
    await rm(directory, { recursive: true, force: true })
  }
})
