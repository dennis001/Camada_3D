import { randomBytes, randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { hashPassword } from '../server/security.js'
import { transaction } from '../server/db.js'
import { audit } from '../server/catalog.js'

export async function provisionAdmins(pool, resetUsername = null) {
  if (resetUsername && !['dennis', 'talissa'].includes(resetUsername)) throw new Error('Escolha dennis ou talissa para recuperar o acesso.')
  const credentials = []
  const file = `.local/acessos-${Date.now()}.txt`
  await mkdir('.local', { recursive: true })
  await transaction(pool, async client => {
    await client.query('SELECT pg_advisory_xact_lock(31803002)')
    for (const [username, name] of [['dennis', 'Dennis'], ['talissa', 'Talissa']]) {
      if (resetUsername && username !== resetUsername) continue
      const existing = await client.query('SELECT id FROM admins WHERE username=$1 FOR UPDATE', [username])
      if (existing.rowCount && !resetUsername) continue
      const password = randomBytes(24).toString('base64url')
      const hash = await hashPassword(password)
      const id = existing.rows[0]?.id || randomUUID()
      await client.query('INSERT INTO admins(id,username,name,password_hash) VALUES($1,$2,$3,$4) ON CONFLICT(username) DO UPDATE SET password_hash=$4,must_change_password=true,active=true', [id, username, name, hash])
      await client.query('DELETE FROM sessions WHERE admin_id=$1', [id])
      await audit(client, id, resetUsername ? 'auth.password_reset_locally' : 'auth.account_created')
      credentials.push(`${name}\nUsuário: ${username}\nSenha temporária: ${password}\n`)
    }
    if (credentials.length) await writeFile(file, `Studio Camadas — acessos iniciais\nTroque a senha no primeiro acesso. Apague este arquivo após a troca.\nNão publique nem compartilhe este arquivo.\n\n${credentials.join('\n')}`, { mode: 0o600, flag: 'wx' })
  })
  return credentials.length ? file : null
}
