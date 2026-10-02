import { randomBytes } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import pg from 'pg'
import { exists, localPostgres } from './local-postgres.mjs'
import { loadConfig } from '../server/config.js'
import { createPool, migrate } from '../server/db.js'
import { provisionAdmins } from './admin.mjs'

if (!await exists('.env')) {
  const password = randomBytes(32).toString('hex')
  await writeFile('.env', `DATABASE_URL=postgresql://camada:${password}@127.0.0.1:55432/camada\nAPP_ORIGIN=http://127.0.0.1:3000\nHOST=127.0.0.1\nPORT=3001\nNODE_ENV=development\n`, { mode: 0o600, flag: 'wx' })
}
const config = loadConfig()
const url = new URL(config.connectionString)
if (url.hostname !== '127.0.0.1' || url.port !== '55432' || url.pathname !== '/camada' || config.production) throw new Error('Setup portátil requer a conexão local na porta 55432 e banco camada. Para banco externo, use db:migrate e admin:setup.')
const db = await localPostgres({ directory: '.local/postgres', port: 55432, user: decodeURIComponent(url.username), password: decodeURIComponent(url.password) })
let pool
try {
  await db.start()
  const adminUrl = new URL(url)
  adminUrl.pathname = '/postgres'
  const client = new pg.Client({ connectionString: adminUrl.toString() })
  await client.connect()
  try {
    if (!(await client.query("SELECT 1 FROM pg_database WHERE datname='camada'")).rowCount) await client.query('CREATE DATABASE camada')
  } finally { await client.end() }
  pool = createPool(config.connectionString)
  await migrate(pool)
  const file = await provisionAdmins(pool)
  console.log('Banco PostgreSQL local preparado. Dados preservados em .local/postgres.')
  console.log(file ? `Acessos individuais criados. Consulte ${file}; a troca de senha é obrigatória.` : 'Contas existentes preservadas.')
  console.log('Inicie banco, API e frontend com npm run dev:full.')
} finally { await pool?.end(); await db.stop() }
