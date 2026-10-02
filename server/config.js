import { loadEnvFile } from 'node:process'
export function loadConfig() {
  try { loadEnvFile(process.env.ENV_FILE || '.env') } catch (error) { if (error.code !== 'ENOENT' || process.env.ENV_FILE) throw error }
  const production = process.env.NODE_ENV === 'production'
  if (production && !process.env.APP_ORIGIN) throw new Error('Configure APP_ORIGIN com o endereço HTTPS da aplicação.')
  const environment = process.env.APP_ENV || (production ? 'production' : 'development')
  if (!['development', 'production'].includes(environment)) throw new Error('APP_ENV deve ser development ou production.')
  return { connectionString: process.env.DATABASE_URL, origin: process.env.APP_ORIGIN || 'http://127.0.0.1:3000', host: process.env.HOST || '127.0.0.1', port: Number(process.env.PORT || 3001), production, environment, catalogPreviewIds: (process.env.CATALOG_PREVIEW_IDS || '').split(',').map(id => id.trim()).filter(Boolean) }
}
