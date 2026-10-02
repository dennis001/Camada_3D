import { spawn } from 'node:child_process'
import { access, mkdir, writeFile, unlink, realpath } from 'node:fs/promises'
import path from 'node:path'
import { randomBytes } from 'node:crypto'

export async function exists(file) { try { await access(file); return true } catch { return false } }
export function run(executable, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { windowsHide: true, shell: false, ...options })
    let output = ''
    child.stdout?.on('data', chunk => { output += chunk.toString() })
    child.stderr?.on('data', chunk => { output += chunk.toString() })
    child.on('error', reject)
    child.on('exit', code => code === 0 ? resolve(output) : reject(new Error(`Processo terminou com código ${code}: ${output}`)))
  })
}

export async function localPostgres({ directory, port, password, user = 'camada' }) {
  const platform = process.platform === 'win32' ? 'windows' : process.platform
  const binary = await import(`@embedded-postgres/${platform}-${process.arch}`)
  const root = path.resolve(directory)
  await mkdir(root, { recursive: true })
  // PostgreSQL Windows interpreta alguns caminhos pelo codepage local. Usar o
  // alias 8.3 da mesma pasta evita falha de UTF-8 em "Impressão 3D", sem mover dados.
  let working = process.cwd()
  if (process.platform === 'win32' && /[^\x00-\x7f]/.test(working)) {
    const short = (await run('cmd.exe', ['/d', '/c', 'for %I in (.) do @echo %~sI'])).trim()
    if (await realpath(short) !== await realpath(working) || /[^\x00-\x7f]/.test(short)) throw new Error('PostgreSQL portátil precisa de um caminho ASCII ou alias 8.3 no Windows.')
    working = short
  }
  const nativePath = file => {
    const relative = path.relative(process.cwd(), file)
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('O PostgreSQL portátil deve permanecer dentro do projeto.')
    return path.join(working, relative)
  }
  const nativeRoot = nativePath(root)
  if (!await exists(path.join(root, 'PG_VERSION'))) {
    const passwordFile = `${root}-password-${randomBytes(8).toString('hex')}.tmp`
    await writeFile(passwordFile, password, { mode: 0o600, flag: 'wx' })
    try {
      await run(nativePath(binary.initdb), ['-D', nativeRoot, '-U', user, '--auth=scram-sha-256', '--encoding=UTF8', '--locale=C', `--pwfile=${nativePath(passwordFile)}`], { cwd: working })
    } finally { await unlink(passwordFile).catch(() => {}) }
  }
  let started = false
  return {
    directory: root,
    async start() {
      // Fora do diretório de dados: no Windows, a recuperação tenta sincronizar
      // todos os arquivos, mas o log aberto pelo pg_ctl tem bloqueio de escrita.
      await run(nativePath(binary.pg_ctl), ['-D', nativeRoot, '-l', `${nativeRoot}.log`, '-o', `-h 127.0.0.1 -p ${port}`, '-w', '-t', '60', 'start'], { cwd: working })
      started = true
    },
    async stop() {
      if (!started) return
      await run(nativePath(binary.pg_ctl), ['-D', nativeRoot, '-m', 'fast', '-w', '-t', '20', 'stop'], { cwd: working })
      started = false
    },
  }
}
