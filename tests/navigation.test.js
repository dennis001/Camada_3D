import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { mkdir, writeFile, unlink } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { podeAdministrar } from '../src/lib/acesso.js'

test('vitrine e navegação escondem administração para visitantes e contas comuns', async () => {
  const compiled = await build({ stdin: { contents: "export { default as Navbar } from './src/components/Navbar.jsx'; export { default as App } from './src/App.jsx'; export { default as Login } from './src/components/Login.jsx';", resolveDir: process.cwd(), loader: 'jsx' }, bundle: true, write: false, platform: 'node', format: 'esm', packages: 'external', jsx: 'automatic' })
  await mkdir('.local', { recursive: true })
  const file = path.resolve('.local', `ui-check-${randomUUID()}.mjs`)
  await writeFile(file, compiled.outputFiles[0].text)
  const previousWindow = globalThis.window
  try {
    const { Navbar, App, Login } = await import(pathToFileURL(file).href)
    const loginPage = renderToStaticMarkup(React.createElement(Login, { session: null, onSession: () => {} }))
    assert.ok(loginPage.includes('Novo por aqui? Criar conta'))
    assert.ok(loginPage.includes('E-mail ou usuário'))
    const account = renderToStaticMarkup(React.createElement(Login, { session: { user: { name: 'Cliente', role: 'customer' } }, onSession: () => {} }))
    assert.equal(account.includes('href="/admin"'), false)
    for (const user of [null, { role: 'customer' }, { role: 'unknown' }, { name: 'Sem perfil' }]) {
      const html = renderToStaticMarkup(React.createElement(Navbar, { user }))
      assert.equal(html.includes('href="/admin"'), false)
      assert.equal(html.includes('Administração'), false)
    }
    for (const role of ['admin', 'developer']) {
      const html = renderToStaticMarkup(React.createElement(Navbar, { user: { role } }))
      assert.ok(html.includes('href="/admin"'))
    }
    assert.ok(renderToStaticMarkup(React.createElement(Navbar)).includes('href="/login"'))
    globalThis.window = { location: { pathname: '/' }, localStorage: { getItem: () => null } }
    const home = renderToStaticMarkup(React.createElement(App))
    assert.equal(home.includes('id="gestao"'), false)
    assert.equal(home.includes('Administração'), false)
    globalThis.window.location.pathname = '/admin'
    const protectedPage = renderToStaticMarkup(React.createElement(App))
    assert.equal(protectedPage.includes('Gestão de produtos'), false)
    assert.ok(protectedPage.includes('Verificando acesso'))
  } finally {
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
    await unlink(file)
  }
})

test('permissão depende de perfil reconhecido, nunca de nome ou texto enviado pelo usuário', () => {
  assert.equal(podeAdministrar({ name: 'Dennis' }), false)
  assert.equal(podeAdministrar({ role: 'admin' }), true)
  assert.equal(podeAdministrar({ role: 'developer' }), true)
  assert.equal(podeAdministrar({ role: 'customer', admin: true }), false)
})
