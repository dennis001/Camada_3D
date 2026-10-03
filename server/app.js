import { criarConsultaViaCep } from './cep.js'
import { registerCheckout } from './checkout.js'
import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import rateLimit from '@fastify/rate-limit'
import { hashPassword, verifyPassword, token, digest, sameToken, validPassword } from './security.js'
import { transaction } from './db.js'
import { audit, fail, publicCatalog, readCatalog, saveCatalog } from './catalog.js'
import { podeAdministrar } from '../src/lib/acesso.js'
import { randomUUID } from 'node:crypto'
import { REGRAS_SENHA } from '../src/lib/senha.js'

const userView = row => ({ id: row.id, username: row.username, name: row.name, role: row.role, mustChangePassword: row.must_change_password })
const credentials = {
  type: 'object', additionalProperties: false, required: ['username', 'password'],
  properties: { username: { type: 'string', minLength: 1, maxLength: 254 }, password: { type: 'string', minLength: 1, maxLength: 128 } },
}

export async function buildApp({ pool, origin = 'http://127.0.0.1:3000', production = false, environment = production ? 'production' : 'development', logger = false, loginMax = 10, catalogPreviewIds = [], consultarCep = criarConsultaViaCep() }) {
  if (!['development', 'production'].includes(environment)) throw new Error('APP_ENV deve ser development ou production.')
  if (new URL(origin).origin !== origin || (production && !origin.startsWith('https://'))) throw new Error('APP_ORIGIN deve ser uma origem exata; produção exige HTTPS.')
  if (catalogPreviewIds.length && (production || environment !== 'development' || !['127.0.0.1', 'localhost', '[::1]'].includes(new URL(origin).hostname))) throw new Error('Prévia de rascunhos é exclusiva do ambiente local de desenvolvimento.')
  const app = Fastify({ logger, bodyLimit: 5 * 1024 * 1024, trustProxy: false, ajv: { customOptions: { removeAdditional: false } } })
  await app.register(cookie)
  await app.register(rateLimit, { global: false, errorResponseBuilder: () => ({ statusCode: 429, error: 'Muitas tentativas. Aguarde um minuto antes de tentar novamente.' }) })
  const secure = origin.startsWith('https://')
  const cookieName = `${secure ? '__Host-' : ''}camada_${environment}_session`
  const audience = `${environment}:${origin}`
  const cookieOptions = { path: '/', httpOnly: true, secure, sameSite: 'strict', maxAge: 8 * 60 * 60 }
  const dummyHash = await hashPassword(token())

  app.addHook('onRequest', async (request, reply) => {
    reply.header('Cache-Control', 'no-store').header('X-Content-Type-Options', 'nosniff')
    if (environment === 'development') reply.header('X-Robots-Tag', 'noindex, nofollow')
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && request.headers.origin !== origin) throw fail(403, 'Origem da solicitação não permitida.')
  })
  app.setErrorHandler((error, request, reply) => {
    if (error.code === '23505') return reply.code(409).send({ error: 'Identificador ou SKU já utilizado. Recarregue o cadastro.' })
    const status = error.validation ? 400 : (error.statusCode >= 400 && error.statusCode < 500 ? error.statusCode : 500)
    if (status === 500) request.log.error({ code: error.code, requestId: request.id }, 'Falha interna na operação')
    reply.code(status).send({ error: status === 500 ? 'Não foi possível concluir a operação. Tente novamente.' : error.validation ? 'Dados da solicitação inválidos.' : error.message })
  })

  async function authenticated(request) {
    const value = request.cookies[cookieName]
    if (!value || !/^[A-Za-z0-9_-]{43}$/.test(value)) throw fail(401, 'Entre novamente para acessar a administração.')
    const result = await pool.query('SELECT a.*, s.csrf_token, s.token_hash FROM sessions s JOIN admins a ON a.id=s.admin_id WHERE s.token_hash=$1 AND s.audience=$2 AND s.expires_at>now() AND a.active=true', [digest(value), audience])
    if (!result.rowCount) throw fail(401, 'Sessão encerrada. Entre novamente.')
    request.admin = result.rows[0]
    if (!['GET', 'HEAD'].includes(request.method) && !sameToken(request.headers['x-csrf-token'], request.admin.csrf_token)) throw fail(403, 'Solicitação expirada ou inválida. Recarregue a página.')
  }
  async function administrator(request) {
    await authenticated(request)
    if (!podeAdministrar(request.admin)) throw fail(403, 'Esta conta não tem acesso à administração.')
    if (request.admin.must_change_password) throw fail(403, 'Defina sua senha pessoal antes de acessar os cadastros.')
  }

  app.get('/api/health', async () => { await pool.query('SELECT 1'); return { status: 'ok' } })
  app.get('/api/catalogo', async () => ({ produtos: await publicCatalog(pool, catalogPreviewIds) }))
  app.post('/api/auth/register', {
    config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    schema: { body: {
      type: 'object', additionalProperties: false, required: ['name', 'email', 'password'],
      properties: {
        name: { type: 'string', minLength: 2, maxLength: 120 },
        email: { type: 'string', minLength: 3, maxLength: 254 },
        password: { type: 'string', maxLength: 128 },
      },
    } },
  }, async (request, reply) => {
    const name = request.body.name.trim()
    const email = request.body.email.trim().toLowerCase()
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw fail(400, 'Informe nome e e-mail válido.')
    }
    if (!validPassword(request.body.password)) throw fail(400, REGRAS_SENHA)
    const passwordHash = await hashPassword(request.body.password)
    await transaction(pool, async client => {
      // A tabela de identidades mantém seu nome original. O perfil nunca vem do cliente.
      const created = await client.query("INSERT INTO admins(id,username,name,password_hash,role,must_change_password) VALUES($1,$2,$3,$4,'customer',false) ON CONFLICT(username) DO NOTHING RETURNING id", [randomUUID(), email, name, passwordHash])
      if (!created.rowCount) throw fail(409, 'Não foi possível criar a conta com esse e-mail. Tente entrar ou solicite ajuda para recuperar o acesso.')
      await audit(client, created.rows[0].id, 'auth.customer_registered')
    })
    return reply.code(201).send({ ok: true })
  })
  app.post('/api/auth/login', { schema: { body: credentials }, config: { rateLimit: { max: loginMax, timeWindow: '1 minute' } } }, async (request, reply) => {
    const username = request.body.username.trim().toLowerCase()
    const result = await transaction(pool, async client => {
      const users = await client.query('SELECT * FROM admins WHERE username=$1 FOR UPDATE', [username])
      const user = users.rows[0]
      const correct = await verifyPassword(request.body.password, user?.password_hash || dummyHash)
      if (!user?.active || !correct) throw fail(401, 'Usuário ou senha inválidos.')
      const session = token()
      const csrfToken = token()
      // Troca de identidade no mesmo navegador também revoga o cookie anterior.
      if (request.cookies[cookieName]) await client.query('DELETE FROM sessions WHERE token_hash=$1', [digest(request.cookies[cookieName])])
      await client.query('DELETE FROM sessions WHERE expires_at<=now()')
      await client.query("INSERT INTO sessions(token_hash,admin_id,csrf_token,expires_at,audience) VALUES($1,$2,$3,now()+interval '8 hours',$4)", [digest(session), user.id, csrfToken, audience])
      await audit(client, user.id, 'auth.login')
      return { user: userView(user), csrfToken, session }
    })
    reply.setCookie(cookieName, result.session, cookieOptions)
    return { user: result.user, csrfToken: result.csrfToken }
  })
  app.get('/api/auth/me', { onRequest: authenticated }, async request => ({ user: userView(request.admin), csrfToken: request.admin.csrf_token }))
  app.post('/api/auth/logout', { onRequest: authenticated }, async (request, reply) => {
    await transaction(pool, async client => {
      await client.query('DELETE FROM sessions WHERE token_hash=$1', [request.admin.token_hash])
      await audit(client, request.admin.id, 'auth.logout')
    })
    reply.clearCookie(cookieName, { ...cookieOptions, maxAge: undefined })
    return { ok: true }
  })
  app.post('/api/auth/password', {
    onRequest: authenticated,
    config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    schema: { body: { type: 'object', additionalProperties: false, required: ['currentPassword', 'newPassword'], properties: { currentPassword: { type: 'string', maxLength: 128 }, newPassword: { type: 'string', maxLength: 128 } } } },
  }, async (request, reply) => {
    const { currentPassword, newPassword } = request.body
    if (!validPassword(newPassword)) throw fail(400, REGRAS_SENHA)
    if (currentPassword === newPassword) throw fail(400, 'Escolha uma senha diferente da atual.')
    await transaction(pool, async client => {
      const result = await client.query('SELECT password_hash FROM admins WHERE id=$1 FOR UPDATE', [request.admin.id])
      if (!await verifyPassword(currentPassword, result.rows[0].password_hash)) throw fail(400, 'Senha atual incorreta.')
      await client.query('UPDATE admins SET password_hash=$1,must_change_password=false WHERE id=$2', [await hashPassword(newPassword), request.admin.id])
      await client.query('DELETE FROM sessions WHERE admin_id=$1', [request.admin.id])
      await audit(client, request.admin.id, 'auth.password_changed')
    })
    reply.clearCookie(cookieName, { ...cookieOptions, maxAge: undefined })
    return { ok: true }
  })

  app.get('/api/admin/produtos', { onRequest: administrator }, async () => readCatalog(pool))
  const revision = { type: 'integer', minimum: 0, maximum: 2147483646 }
  app.put('/api/admin/produtos/:id', {
    onRequest: administrator,
    schema: { body: { type: 'object', additionalProperties: false, required: ['produto', 'revision'], properties: { produto: { type: 'object' }, revision } } },
  }, async request => {
    if (request.params.id !== request.body.produto.id) throw fail(400, 'Identificador do produto não corresponde ao endereço.')
    return saveCatalog(pool, [request.body.produto], request.body.revision, request.admin.id)
  })
  app.post('/api/admin/produtos/importar', {
    onRequest: administrator,
    schema: { body: { type: 'object', additionalProperties: false, required: ['produtos', 'revision'], properties: { produtos: { type: 'array', maxItems: 2000, items: { type: 'object' } }, revision } } },
  }, async request => saveCatalog(pool, request.body.produtos, request.body.revision, request.admin.id, true))
  app.get('/api/admin/historico', { onRequest: administrator }, async () => {
    const result = await pool.query('SELECT e.id,e.action,e.product_id,e.created_at,a.name AS actor_name FROM audit_events e LEFT JOIN admins a ON a.id=e.actor_id ORDER BY e.created_at DESC,e.id LIMIT 100')
    return { eventos: result.rows }
  })
  app.get('/api/cep/:cep', {
    config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    schema: { params: { type: 'object', required: ['cep'], properties: { cep: { type: 'string', pattern: '^[0-9]{8}$' } } } },
  }, async request => ({ endereco: await consultarCep(request.params.cep) }))
  registerCheckout(app, { pool, authenticated, cookieName, cookieOptions, environment, catalogPreviewIds, enabled: !production && environment === 'development' && ['127.0.0.1', 'localhost', '[::1]'].includes(new URL(origin).hostname) })
  return app
}
