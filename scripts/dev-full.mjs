import { createServer } from 'vite'
import { localPostgres } from './local-postgres.mjs'
import { createPool, migrate } from '../server/db.js'
import { loadConfig } from '../server/config.js'
import { buildApp } from '../server/app.js'
const config = loadConfig()
if (config.production) throw new Error('dev:full é exclusivo do ambiente de desenvolvimento.')
const url = new URL(config.connectionString)
if (url.hostname !== '127.0.0.1' || url.port !== '55432' || url.pathname !== '/camada') throw new Error('Para PostgreSQL externo, inicie api:dev e dev separadamente.')
const db = await localPostgres({ directory: '.local/postgres', port: 55432, user: decodeURIComponent(url.username), password: decodeURIComponent(url.password) })
let pool, app, frontend, closing = false
async function close() {
  if (closing) return
  closing = true
  await frontend?.close()
  await app?.close()
  await pool?.end()
  await db.stop()
}
try {
  await db.start()
  pool = createPool(config.connectionString)
  await migrate(pool)
  app = await buildApp({ pool, ...config })
  await app.listen({ host: config.host, port: config.port })
  frontend = await createServer({ server: { open: false, strictPort: true } })
  await frontend.listen()
  console.log('Studio Camadas: http://127.0.0.1:3000 — login em /login e administração em /admin. Ctrl+C encerra os serviços.')
} catch (error) { await close(); throw error }
process.on('SIGINT', close)
process.on('SIGTERM', close)
