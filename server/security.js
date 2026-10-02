import { randomBytes, scrypt as callbackScrypt, timingSafeEqual, createHash } from 'node:crypto'
import { promisify } from 'node:util'
const scrypt = promisify(callbackScrypt)
export const token = () => randomBytes(32).toString('base64url')
export const digest = value => createHash('sha256').update(value).digest('hex')
export function validPassword(password) { return typeof password === 'string' && password.length >= 12 && password.length <= 128 }
export async function hashPassword(password) {
  if (!validPassword(password)) throw new Error('A senha deve ter entre 12 e 128 caracteres.')
  const salt = randomBytes(16).toString('hex')
  const key = await scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 })
  return `scrypt:${salt}:${key.toString('hex')}`
}
export async function verifyPassword(password, encoded) {
  if (typeof password !== 'string' || password.length > 128) return false
  const [algorithm, salt, hex] = encoded.split(':')
  if (algorithm !== 'scrypt' || !/^[a-f0-9]{32}$/.test(salt) || !/^[a-f0-9]{128}$/.test(hex)) return false
  const key = await scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 })
  return timingSafeEqual(key, Buffer.from(hex, 'hex'))
}
export function sameToken(a, b) {
  return typeof a === 'string' && typeof b === 'string' && Buffer.byteLength(a) === Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a), Buffer.from(b))
}
