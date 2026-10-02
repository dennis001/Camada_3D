import { REGRAS_SENHA, validarFormularioAcesso } from '../lib/senha'
import React, { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { api, downloadJson } from '../lib/api'
import { carregarProdutos, criarBackup, lerBackup, LIMITE_BACKUP_BYTES } from '../lib/persistencia'

const Gestao = lazy(() => import('./Gestao'))
const inputClass = 'w-full rounded-lg border border-gray-300 p-3 text-gray-900'

export default function Administracao({ session, setSession }) {
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [catalog, setCatalog] = useState(null)
  const catalogRef = useRef(null)
  const [events, setEvents] = useState(null)
  const [dirty, setDirty] = useState(false)
  const [editorKey, setEditorKey] = useState(0)

  useEffect(() => {
    if (!dirty) return
    const beforeLeave = event => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', beforeLeave)
    return () => window.removeEventListener('beforeunload', beforeLeave)
  }, [dirty])

  useEffect(() => {
    let active = true
    if (session && !session.user.mustChangePassword) {
      api('/admin/produtos').then(data => {
        if (active) { catalogRef.current = data; setCatalog(data); setError('') }
      }).catch(error => { if (active) setError(error.message) })
    }
    return () => { active = false }
  }, [session.user.id])

  function applyCatalog(data) {
    catalogRef.current = data
    setCatalog(data)
    setEvents(null)
  }
  async function mutate(path, method, body) {
    try {
      const data = await api(path, { method, body, csrfToken: session.csrfToken })
      applyCatalog(data)
      return { ok: true }
    } catch (error) {
      // Não desmontar o formulário: uma sessão expirada não deve apagar edição em andamento.
      return { ok: false, erro: error.status === 401 ? `${error.message} Guarde o rascunho antes de sair e entrar novamente.` : error.message }
    }
  }
  async function logout() {
    setBusy(true); setError('')
    try {
      await api('/auth/logout', { method: 'POST', csrfToken: session.csrfToken })
      setSession(null); setCatalog(null); catalogRef.current = null; setEvents(null); setChangingPassword(false)
    } catch (error) {
      if (error.status === 401) { setSession(null); setCatalog(null); catalogRef.current = null; setEvents(null) }
      else setError(error.message)
    } finally { setBusy(false) }
  }
  async function changePassword(event) {
    event.preventDefault()
    if (dirty) { setError('Salve ou descarte as alterações do produto antes de trocar a senha.'); return }
    try { validarFormularioAcesso(event.currentTarget) } catch (error) { setError(error.message); return }
    const fields = new FormData(event.currentTarget)
    if (fields.get('newPassword') !== fields.get('confirmPassword')) { setError('A confirmação da nova senha não confere.'); return }
    setBusy(true); setError('')
    try {
      await api('/auth/password', { method: 'POST', csrfToken: session.csrfToken, body: { currentPassword: fields.get('currentPassword'), newPassword: fields.get('newPassword') } })
      setSession(null); setCatalog(null); catalogRef.current = null; setChangingPassword(false); setEvents(null)
      setNotice('Senha alterada. Entre novamente com sua senha pessoal.')
    } catch (error) { setError(error.message) }
    finally { setBusy(false) }
  }
  async function importFile(file) {
    try {
      if (file.size > LIMITE_BACKUP_BYTES) throw new Error('O backup excede 5 MB.')
      return await mutate('/admin/produtos/importar', 'POST', { produtos: lerBackup(await file.text()), revision: catalogRef.current.revision })
    } catch (error) { return { ok: false, erro: error.message } }
  }
  async function importLocal() {
    setBusy(true); setError(''); setNotice('')
    try {
      const local = carregarProdutos(window.localStorage)
      if (local.erro) throw new Error(local.erro)
      if (!local.produtos.length) throw new Error('Não há cadastros antigos neste navegador e endereço.')
      const result = await mutate('/admin/produtos/importar', 'POST', { produtos: local.produtos, revision: catalogRef.current.revision })
      if (!result.ok) throw new Error(result.erro)
      setEditorKey(key => key + 1)
      setNotice('Cadastros importados. A cópia antiga deste navegador foi preservada.')
    } catch (error) { setError(error.message) }
    finally { setBusy(false) }
  }

  return <section id="gestao" className="scroll-mt-24 border-t border-gray-200 bg-gray-50 py-12" aria-labelledby="admin-title">
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <a href="/" className="mb-6 inline-block text-camada-teal-700 underline">← Voltar à loja</a>
      <h1 id="admin-title" className="text-3xl font-bold text-gray-900">Administração</h1>
      <p className="mt-2 text-gray-600">Produtos, fichas e licenças em um cadastro compartilhado.</p>
      {error && <p role="alert" className="my-4 rounded-lg bg-red-50 p-4 text-red-800">{error}</p>}
      {notice && <p role="status" className="my-4 rounded-lg bg-camada-teal-50 p-4 text-camada-teal-800">{notice}</p>}
      <>
        <div className="my-6 flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4">
          <p className="mr-auto"><strong>{session.user.name}</strong> · {session.user.role === 'developer' ? 'Desenvolvedor' : 'Administrador'}</p>
          <button className="rounded-lg border px-4 py-2 disabled:opacity-50" disabled={busy || dirty} onClick={() => setChangingPassword(!changingPassword)}>Alterar senha</button>
          <button className="rounded-lg border px-4 py-2 disabled:opacity-50" disabled={busy || dirty} onClick={logout}>Sair</button>
          {dirty && <p className="w-full text-sm text-gray-600">Salve, ou baixe o rascunho e descarte as alterações, antes de sair.</p>}
        </div>
        {(session.user.mustChangePassword || changingPassword) && <form noValidate onSubmit={changePassword} className="mb-6 max-w-lg space-y-4 rounded-xl border bg-white p-6">
          <h3 className="text-xl font-semibold">{session.user.mustChangePassword ? 'Defina sua senha pessoal' : 'Alterar senha'}</h3>
          <p className="text-sm text-gray-600">{REGRAS_SENHA} A alteração encerra suas sessões anteriores.</p>
          <label className="block">Senha atual<input name="currentPassword" type="password" autoComplete="current-password" required maxLength={128} className={inputClass} /></label>
          <label className="block">Nova senha<input name="newPassword" type="password" autoComplete="new-password" required minLength={8} maxLength={128} className={inputClass} /></label>
          <label className="block">Confirmar nova senha<input name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} maxLength={128} className={inputClass} /></label>
          <button disabled={busy} className="btn-primary disabled:opacity-50">Salvar nova senha</button>
        </form>}
        {!session.user.mustChangePassword && <>
          {!catalog ? <button className="my-4 rounded-lg border px-4 py-2" onClick={async () => { try { const data = await api('/admin/produtos'); catalogRef.current = data; setCatalog(data); setError('') } catch (error) { setError(error.message) } }}>Carregar cadastro</button> : <>
            <details className="my-4 rounded-xl border bg-white p-4"><summary className="cursor-pointer font-medium">Trazer cadastros da versão anterior</summary><p className="my-3 text-sm text-gray-600">Importa os produtos salvos neste navegador. Produtos com o mesmo identificador serão atualizados; os demais serão mantidos. Salve seu formulário e exporte um backup antes de importar.</p><button disabled={busy || dirty} onClick={importLocal} className="rounded-lg border px-4 py-2 disabled:opacity-50">Importar cadastros deste navegador</button></details>
            <Suspense fallback={<p>Carregando painel…</p>}><Gestao key={editorKey} produtos={catalog.produtos} fonte="servidor" onAlterado={setDirty} onSalvar={produto => mutate(`/admin/produtos/${encodeURIComponent(produto.id)}`, 'PUT', { produto, revision: catalogRef.current.revision })} onExportar={() => downloadJson(criarBackup(catalogRef.current.produtos), `studio-camadas-catalogo-${Date.now()}.json`)} onImportar={importFile} erroPersistencia="" /></Suspense>
            <details className="mt-6 rounded-xl border bg-white p-4"><summary className="cursor-pointer font-medium">Histórico de alterações</summary>
              <button className="my-3 rounded-lg border px-4 py-2" onClick={async () => { try { setEvents((await api('/admin/historico')).eventos) } catch (error) { setError(error.message) } }}>Consultar últimas alterações</button>
              {events && <ul className="space-y-2 text-sm">{events.map(event => <li key={event.id} className="border-t py-2">{new Date(event.created_at).toLocaleString('pt-BR')} · {event.actor_name || 'Administração local'} · {({ 'product.saved': 'Produto salvo', 'product.imported': 'Produto importado', 'auth.login': 'Entrada', 'auth.logout': 'Saída', 'auth.password_changed': 'Senha alterada', 'auth.password_reset_locally': 'Acesso recuperado', 'auth.account_created': 'Conta criada' })[event.action] || event.action}{event.product_id && ` · ${catalog.produtos.find(p => p.id === event.product_id)?.nome || event.product_id}`}</li>)}</ul>}
            </details>
          </>}
        </>}
      </>
    </div>
  </section>
}
