import { transaction } from './db.js'
import { validateProducts } from './catalog.js'
import { normalizarTexto } from '../src/lib/produtos.js'

// Exportação administrativa do banco: contém hashes de senha, nunca sessões ativas.
export async function exportDatabase(pool) {
  return transaction(pool, async client => {
    await client.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY')
    const data = { aplicativo: 'studio-camadas-database', versao: 1, exportadoEm: new Date().toISOString() }
    for (const table of ['schema_migrations', 'admins', 'catalog_state', 'products', 'product_revisions', 'audit_events']) data[table] = (await client.query(`SELECT * FROM ${table}`)).rows
    return data
  })
}

export async function restoreDatabase(pool, data) {
  if (data?.aplicativo !== 'studio-camadas-database' || data.versao !== 1) throw new Error('Backup de banco inválido ou versão não suportada.')
  const tables = {
    admins: ['id', 'username', 'name', 'role', 'password_hash', 'must_change_password', 'active', 'created_at'],
    products: ['id', 'data', 'updated_by', 'updated_at'],
    product_revisions: ['product_id', 'revision', 'data', 'actor_id', 'created_at'],
    audit_events: ['id', 'actor_id', 'action', 'product_id', 'created_at'],
  }
  for (const table of [...Object.keys(tables), 'schema_migrations', 'catalog_state']) if (!Array.isArray(data[table])) throw new Error('Backup incompleto.')
  validateProducts(data.products.map(row => row.data))
  if (data.catalog_state.length !== 1 || data.catalog_state[0].id !== 1 || !Number.isInteger(data.catalog_state[0].revision)) throw new Error('Revisão do backup inválida.')
  await transaction(pool, async client => {
    await client.query('SELECT pg_advisory_xact_lock(31803001)')
    await client.query('LOCK TABLE admins, products, catalog_state, product_revisions, audit_events, sessions IN ACCESS EXCLUSIVE MODE')
    const count = await client.query('SELECT (SELECT count(*) FROM admins)+(SELECT count(*) FROM products)+(SELECT count(*) FROM audit_events) AS total')
    if (Number(count.rows[0].total) !== 0) throw new Error('Restauração permitida somente em banco vazio. Use um banco novo para conferir o backup.')
    const schema = (await client.query('SELECT name,checksum FROM schema_migrations ORDER BY name')).rows
    const backupSchema = data.schema_migrations.map(({ name, checksum }) => ({ name, checksum })).sort((a, b) => a.name.localeCompare(b.name))
    if (JSON.stringify(schema) !== JSON.stringify(backupSchema)) throw new Error('As migrações do backup diferem do banco de destino.')
    for (const [table, columns] of Object.entries(tables)) {
      for (const row of data[table]) {
        if (columns.some(column => row[column] === undefined)) throw new Error('Registro incompleto no backup.')
        await client.query(`INSERT INTO ${table}(${columns.join(',')}) VALUES(${columns.map((_, index) => `$${index + 1}`).join(',')})`, columns.map(column => row[column]))
      }
    }
    for (const row of data.products) for (const variant of row.data.cores) {
      await client.query('INSERT INTO variants(product_id,id,sku_key,stock_site) VALUES($1,$2,$3,$4)', [row.id, variant.id, normalizarTexto(variant.sku) || null, variant.estoqueSite])
    }
    await client.query('UPDATE catalog_state SET revision=$1 WHERE id=1', [data.catalog_state[0].revision])
  })
}
