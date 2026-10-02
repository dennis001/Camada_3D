import pg from 'pg'
import { readdir, readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

export function createPool(connectionString) {
  if (!connectionString) throw new Error('Configure DATABASE_URL antes de iniciar o backend.')
  const pool = new pg.Pool({ connectionString, max: 5, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000 })
  pool.on('error', () => console.error('Conexão ociosa com o banco interrompida.'))
  return pool
}

export async function transaction(pool, action) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await action(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally { client.release() }
}

export async function migrate(pool) {
  const directory = new URL('./migrations/', import.meta.url)
  await transaction(pool, async client => {
    await client.query('SELECT pg_advisory_xact_lock(31803001)')
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())')
    for (const name of (await readdir(directory)).filter(name => name.endsWith('.sql')).sort()) {
      const sql = await readFile(new URL(name, directory), 'utf8')
      const checksum = createHash('sha256').update(sql).digest('hex')
      const previous = await client.query('SELECT checksum FROM schema_migrations WHERE name=$1', [name])
      if (previous.rowCount) {
        if (previous.rows[0].checksum !== checksum) throw new Error(`A migração aplicada ${name} foi modificada.`)
        continue
      }
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations (name, checksum) VALUES ($1,$2)', [name, checksum])
    }
  })
}
