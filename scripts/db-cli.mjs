import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { loadConfig } from '../server/config.js'
import { createPool, migrate } from '../server/db.js'
import { exportDatabase, restoreDatabase } from '../server/backup.js'
import { provisionAdmins } from './admin.mjs'
const [command, argument] = process.argv.slice(2)
const pool = createPool(loadConfig().connectionString)
try {
  await migrate(pool)
  if (command === 'migrate') console.log('Migrações aplicadas.')
  else if (command === 'admins' || command === 'reset') {
    if (command === 'reset' && !argument) throw new Error('Informe dennis ou talissa.')
    const file = await provisionAdmins(pool, command === 'reset' ? argument : null)
    console.log(file ? `Credenciais temporárias em ${file}.` : 'Contas existentes preservadas.')
  } else if (command === 'backup') {
    await mkdir('.local/backups', { recursive: true })
    const file = argument || `.local/backups/banco-${Date.now()}.json`
    await writeFile(file, JSON.stringify(await exportDatabase(pool), null, 2), { mode: 0o600, flag: 'wx' })
    console.log(`Backup gravado em ${file}. Contém dados privados e hashes de acesso; guarde fora do computador.`)
  } else if (command === 'restore' && argument) {
    await restoreDatabase(pool, JSON.parse(await readFile(argument, 'utf8')))
    console.log('Backup restaurado no banco vazio. Sessões anteriores não foram restauradas.')
  } else throw new Error('Comando inválido: migrate, admins, reset <usuario>, backup [arquivo] ou restore <arquivo>.')
} finally { await pool.end() }
