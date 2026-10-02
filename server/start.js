import { buildApp } from './app.js'
import { createPool, migrate } from './db.js'
import { loadConfig } from './config.js'
const config = loadConfig()
const pool = createPool(config.connectionString)
let app
try {
  await migrate(pool)
  app = await buildApp({ pool, ...config, logger: { redact: ['req.headers.cookie', 'req.headers.authorization', 'req.headers["x-csrf-token"]'] } })
  await app.listen({ host: config.host, port: config.port })
} catch (error) {
  console.error('Backend não iniciado:', error.code || error.message)
  await pool.end()
  process.exitCode = 1
}
let stopping = false
async function stop() {
  if (stopping) return
  stopping = true
  await app?.close()
  await pool.end()
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
