import React, { useState } from 'react'
import { api } from '../lib/api'
import { podeAdministrar } from '../lib/acesso'
import Logo from './Logo'

const field = 'mt-1 w-full rounded-lg border border-gray-300 p-3 text-gray-900'
export default function Login({ session, onSession }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [register, setRegister] = useState(false)
  const [email, setEmail] = useState('')
  async function submit(event) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    setBusy(true); setError('')
    try {
      if (session?.user.mustChangePassword) {
        if (fields.get('newPassword') !== fields.get('confirmation')) throw new Error('A confirmação da senha não confere.')
        await api('/auth/password', { method: 'POST', csrfToken: session.csrfToken, body: { currentPassword: fields.get('password'), newPassword: fields.get('newPassword') } })
        onSession(null)
        setNotice('Senha definida. Entre novamente com sua senha pessoal.')
      } else if (register) {
        if (fields.get('password') !== fields.get('confirmation')) throw new Error('A confirmação da senha não confere.')
        await api('/auth/register', { method: 'POST', body: { name: fields.get('name'), email: fields.get('email'), password: fields.get('password') } })
        setEmail(String(fields.get('email')).trim())
        setRegister(false)
        setNotice('Conta criada. Entre com seu e-mail e senha.')
      } else {
        const result = await api('/auth/login', { method: 'POST', body: { username: fields.get('username'), password: fields.get('password') } })
        onSession(result)
        if (!result.user.mustChangePassword) window.location.replace(podeAdministrar(result.user) ? '/admin' : '/')
      }
    } catch (error) { setError(error.message) }
    finally { setBusy(false) }
  }
  async function logout() {
    setBusy(true)
    try { await api('/auth/logout', { method: 'POST', csrfToken: session.csrfToken }); onSession(null) }
    catch (error) { if (error.status === 401) onSession(null); else setError(error.message) }
    finally { setBusy(false) }
  }
  return <main className="min-h-screen bg-gray-50 px-4 py-12">
    <div className="mx-auto max-w-md">
      <a href="/" aria-label="Voltar à loja"><Logo size="md" showText variant="dark" /></a>
      <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">{session?.user.mustChangePassword ? 'Defina sua senha pessoal' : session ? 'Sua conta' : register ? 'Criar conta' : 'Entrar'}</h1>
        {error && <p role="alert" className="my-4 text-red-700">{error}</p>}
        {notice && <p role="status" className="my-4 text-camada-teal-700">{notice}</p>}
        {(!session || session.user.mustChangePassword) && <form key={session ? 'password' : register ? 'register' : 'login'} onSubmit={submit} className="mt-6 space-y-4">
          {!session && (register ? <>
            <label className="block">Nome<input name="name" autoComplete="name" required minLength={2} maxLength={120} className={field} /></label>
            <label className="block">E-mail<input name="email" type="email" autoComplete="email" required maxLength={254} className={field} /></label>
            <p className="text-sm text-gray-600">Escolha uma senha com 12 a 128 caracteres.</p>
          </> : <label className="block">E-mail ou usuário<input name="username" defaultValue={email} autoComplete="username" required maxLength={254} className={field} /></label>)}
          <label className="block">{session ? 'Senha temporária' : 'Senha'}<input name="password" type="password" autoComplete={!session && register ? 'new-password' : 'current-password'} required minLength={!session && register ? 12 : undefined} maxLength={128} className={field} /></label>
          {!session && register && <label className="block">Confirmar senha<input name="confirmation" type="password" autoComplete="new-password" required minLength={12} maxLength={128} className={field} /></label>}
          {session && <>
            <p className="text-sm text-gray-600">Escolha uma senha com 12 a 128 caracteres.</p>
            <label className="block">Nova senha<input name="newPassword" type="password" autoComplete="new-password" required minLength={12} maxLength={128} className={field} /></label>
            <label className="block">Confirmar nova senha<input name="confirmation" type="password" autoComplete="new-password" required minLength={12} maxLength={128} className={field} /></label>
          </>}
          <button disabled={busy} className="btn-primary w-full disabled:opacity-50">{busy ? 'Aguarde…' : session ? 'Salvar senha' : register ? 'Criar conta' : 'Entrar'}</button>
          <p className="text-sm text-gray-500">Para recuperar o acesso, entre em contato com o responsável pelo sistema.</p>
        </form>}
        {!session && <button type="button" disabled={busy} onClick={() => { setRegister(value => !value); setError(''); setNotice('') }} className="mt-5 text-camada-teal-700 underline disabled:opacity-50">{register ? 'Já tenho conta — entrar' : 'Novo por aqui? Criar conta'}</button>}
        {session && <div className="mt-6 space-y-4"><p>Conectado como {session.user.name}.</p>{podeAdministrar(session.user) && !session.user.mustChangePassword && <a href="/admin" className="block font-medium text-camada-teal-700 underline">Ir para Administração</a>}<button disabled={busy} onClick={logout} className="rounded-lg border px-4 py-2">Sair</button></div>}
      </div>
      <a href="/" className="mt-6 inline-block text-camada-teal-700 underline">← Voltar à loja</a>
    </div>
  </main>
}
