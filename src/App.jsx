import React, { lazy, Suspense, useEffect, useRef, useState } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Catalogo from './components/Catalogo'
import Carrinho from './components/Carrinho'
import Checkout from './components/Checkout'
import Sobre from './components/Sobre'
import Footer from './components/Footer'
import { podeAdministrar } from './lib/acesso'
const Administracao = lazy(() => import('./components/Administracao'))
const Login = lazy(() => import('./components/Login'))
import { api } from './lib/api'
import { alterarQuantidade, chaveItem, detalharCarrinho, validarCarrinho } from './lib/carrinho'
import { CHAVE_CARRINHO } from './lib/persistencia'

function Loja({ session, route }) {
  const [produtos, setProdutos] = useState([])
  const [erroCatalogo, setErroCatalogo] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [catalogVersion, setCatalogVersion] = useState(0)
  useEffect(() => {
    let active = true
    api('/catalogo').then(data => {
      if (active) { setProdutos(data.produtos); setErroCatalogo('') }
    }).catch(error => { if (active) setErroCatalogo(error.message) }).finally(() => { if (active) setCarregando(false) })
    return () => { active = false }
  }, [catalogVersion])
  const chaveCarrinho = `${CHAVE_CARRINHO}:publico`
  const [inicial] = useState(() => {
    try {
      const salvo = window.localStorage.getItem(chaveCarrinho)
      return { itens: salvo === null ? [] : validarCarrinho(JSON.parse(salvo)), erro: '' }
    } catch { return { itens: [], erro: 'Não foi possível recuperar o carrinho salvo.' } }
  })
  const [carrinho, setCarrinho] = useState(inicial.itens)
  const carrinhoRef = useRef(carrinho)
  const [erroCarrinho, setErroCarrinho] = useState(inicial.erro)
  const itens = detalharCarrinho(carrinho, produtos)

  function atualizarCarrinho(proximos) {
    try {
      window.localStorage.setItem(chaveCarrinho, JSON.stringify(proximos))
      carrinhoRef.current = proximos
      setCarrinho(proximos)
      setErroCarrinho('')
      return { ok: true }
    } catch {
      const erro = 'Não foi possível salvar o carrinho neste navegador.'
      setErroCarrinho(erro)
      return { ok: false, erro }
    }
  }
  function adicionar(produtoId, corId, quantidade) {
    try {
      if (erroCatalogo || carregando) throw new Error('Aguarde o catálogo ser atualizado antes de adicionar itens.')
      const atual = carrinhoRef.current.find(item => item.produtoId === produtoId && item.corId === corId)?.quantidade || 0
      return atualizarCarrinho(alterarQuantidade(carrinhoRef.current, produtos, produtoId, corId, atual + quantidade))
    } catch (erro) { return { ok: false, erro: erro.message } }
  }
  function mudarQuantidade(chave, quantidade) {
    try {
      if (erroCatalogo || carregando) throw new Error('Atualize o catálogo para conferir a disponibilidade.')
      const item = carrinhoRef.current.find(item => chaveItem(item.produtoId, item.corId) === chave)
      if (!item) throw new Error('Item não encontrado.')
      return atualizarCarrinho(alterarQuantidade(carrinhoRef.current, produtos, item.produtoId, item.corId, quantidade))
    } catch (erro) { return { ok: false, erro: erro.message } }
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar quantidadeCarrinho={carrinho.reduce((total, item) => total + item.quantidade, 0)} user={session?.user} />
      <main className={route === '/' ? '' : 'pt-24'}>
        {route === '/' && <Hero />}
        <div className="border-y border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-900">Loja em preparação. Compras neste ambiente são testes, sem cobrança.</div>
        {carregando && <p role="status" className="p-6 text-center">Carregando catálogo…</p>}
        {erroCatalogo && <div role="alert" className="p-6 text-center text-red-700">{erroCatalogo} <button onClick={() => { setCarregando(true); setCatalogVersion(v => v + 1) }} className="underline">Tentar novamente</button></div>}
        {route === '/' && <Catalogo produtos={produtos} onAdicionar={adicionar} />}
        {erroCarrinho && <p role="alert" className="mx-auto max-w-7xl px-4 text-red-700">{erroCarrinho}</p>}
        {route === '/carrinho' && <Carrinho bloqueado={carregando || Boolean(erroCatalogo)} itens={itens} onQuantidade={mudarQuantidade} onRemover={chave => atualizarCarrinho(carrinhoRef.current.filter(item => chaveItem(item.produtoId, item.corId) !== chave))} />}
        {route === '/checkout' && <Checkout session={session} itens={itens} carregando={carregando || Boolean(erroCatalogo)} onLimpar={() => atualizarCarrinho([])} />}
        {route === '/' && <Sobre />}
      </main>
      <Footer />
    </div>
  )
}
function Redirecionar({ destino }) {
  useEffect(() => { window.location.replace(destino) }, [destino])
  return <p className="p-8" role="status">Redirecionando…</p>
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const route = window.location.pathname.replace(/\/$/, '') || '/'
  useEffect(() => {
    let active = true
    async function check() {
      try {
        const result = await api('/auth/me')
        if (active) { setSession(result); setError('') }
      } catch (error) {
        if (active) {
          setSession(null)
          setError(error.status === 401 ? '' : error.message)
        }
      } finally { if (active) setLoading(false) }
    }
    check()
    window.addEventListener('focus', check)
    const timer = setInterval(check, 60000)
    return () => { active = false; clearInterval(timer); window.removeEventListener('focus', check) }
  }, [attempt])
  if (['/', '/carrinho', '/checkout'].includes(route)) return <Loja session={session} route={route} />
  if (!['/admin', '/login'].includes(route)) return <main className="p-8"><h1>Página não encontrada</h1><a href="/" className="underline">Voltar à loja</a></main>
  if (loading) return <p role="status" className="p-8">Verificando acesso…</p>
  if (error) return <main className="p-8"><p role="alert">{error}</p><button onClick={() => { setLoading(true); setAttempt(n => n + 1) }} className="btn-primary mt-4">Tentar novamente</button><a href="/" className="ml-4 underline">Voltar à loja</a></main>
  if (route === '/admin') {
    if (!session) return <Redirecionar destino="/login" />
    if (!podeAdministrar(session.user)) return <main className="p-8"><h1>Acesso restrito</h1><p>Esta conta não tem permissão para acessar esta página.</p><a href="/" className="underline">Voltar à loja</a></main>
    if (session.user.mustChangePassword) return <Redirecionar destino="/login" />
    return <main className="min-h-screen bg-gray-50"><Suspense fallback={<p className="p-8">Carregando painel…</p>}><Administracao session={session} setSession={setSession} /></Suspense></main>
  }
  return <Suspense fallback={<p className="p-8">Carregando acesso…</p>}><Login session={session} onSession={setSession} /></Suspense>
}
