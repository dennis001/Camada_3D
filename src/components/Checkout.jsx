import EnderecoCheckout from './EnderecoCheckout'
import React, { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import { formatarMoeda } from '../lib/produtos'


export default function Checkout({ session, itens, carregando, onLimpar }) {
  const [guestCsrf, setGuestCsrf] = useState('')
  const [teste, setTeste] = useState(null)
  const [etapa, setEtapa] = useState(0)
  const [endereco, setEndereco] = useState({})
  const [pagamento, setPagamento] = useState('pix')
  const [pedido, setPedido] = useState(null)
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const requestId = useRef(null)
  const titulo = useRef(null)
  const id = new URLSearchParams(window.location.search).get('pedido')
  useEffect(() => {
    let active = true
    async function iniciar() {
      try {
        const config = await api('/checkout/config')
        if (!active) return
        setTeste(config.teste)
        if (config.teste) {
          const guest = await api('/checkout/sessao', { method: 'POST' })
          if (active) setGuestCsrf(guest.csrfToken)
        }
      } catch (error) { if (active) setErro(error.message) }
    }
    iniciar()
    return () => { active = false }
  }, [])
  useEffect(() => {
    let active = true
    setPedido(null)
    setErro('')
    if (id && guestCsrf) api(`/checkout/teste/${encodeURIComponent(id)}`).then(data => { if (active) setPedido(data.pedido) }).catch(error => { if (active) setErro(error.message) })
    return () => { active = false }
  }, [id, guestCsrf, session?.user.id])
  useEffect(() => { titulo.current?.focus() }, [etapa, pedido?.status])
  const total = itens.reduce((sum, item) => sum + item.precoCentavos * item.quantidade, 0)
  const valido = itens.length > 0 && !itens.some(item => item.indisponivel) && Number.isSafeInteger(total)

  async function criarPedido() {
    setOcupado(true); setErro('')
    try {
      requestId.current ||= crypto.randomUUID()
      const data = await api('/checkout/teste', { method: 'POST', csrfToken: session?.csrfToken || guestCsrf, body: { requestId: requestId.current, endereco, pagamento, itens: itens.map(({ produtoId, corId, quantidade }) => ({ produtoId, corId, quantidade })) } })
      window.history.replaceState(null, '', `/checkout?pedido=${data.pedido.id}`)
      setPedido(data.pedido)
    } catch (error) { setErro(error.message) }
    finally { setOcupado(false) }
  }
  async function confirmar() {
    setOcupado(true); setErro('')
    try {
      const data = await api(`/checkout/teste/${pedido.id}/confirmar`, { method: 'POST', csrfToken: session?.csrfToken || guestCsrf })
      setPedido(data.pedido)
      const result = onLimpar()
      if (!result.ok) setErro('Pagamento de teste confirmado, mas não foi possível limpar o carrinho. Remova os itens manualmente.')
    } catch (error) { setErro(error.message) }
    finally { setOcupado(false) }
  }
  return <section className="mx-auto max-w-3xl px-4 py-10">
    <h1 ref={titulo} tabIndex={-1} className="text-3xl font-bold mb-5">{pedido?.status === 'confirmed' ? 'Pagamento de teste confirmado' : 'Finalizar compra'}</h1>
    {erro && <p role="alert" className="my-4 text-red-700">{erro}</p>}
    {teste === null ? <p role="status">Verificando disponibilidade do checkout…</p> : !teste ? <p>O checkout ainda não está disponível neste ambiente.</p> : <>
      <p className="rounded-lg bg-amber-50 border border-amber-200 p-4 mb-6 text-amber-900">Modo de teste: entrega e pagamento simulados. Nenhuma cobrança, postagem ou produção será iniciada. Use um endereço fictício.</p>
      {!guestCsrf ? <p>Preparando compra… Se não continuar, recarregue a página.</p> : pedido ? <div className="rounded-xl border bg-white p-6 space-y-5">
        <p className="break-all">Pedido de teste: <strong>{pedido.id}</strong></p>
        <ul className="space-y-2">{pedido.details.itens.map(item => <li key={item.chave}>{item.quantidade} × {item.nome} — {item.cor}: {formatarMoeda(item.precoCentavos * item.quantidade)}</li>)}</ul>
        <p>Total registrado: <strong>{formatarMoeda(pedido.details.total)}</strong> · Frete simulado: {formatarMoeda(pedido.details.frete)}</p>
        <p>Pagamento: {pedido.details.pagamento === 'pix' ? 'Pix' : 'Cartão de crédito'} (simulado)</p>
        <p>Entrega para {pedido.details.endereco.nome}, {pedido.details.endereco.rua}, {pedido.details.endereco.numero} — {pedido.details.endereco.cidade}/{pedido.details.endereco.uf}.</p>
        {pedido.status === 'confirmed' ? <><p role="status">Seu teste foi concluído. O pedido e a confirmação simulada ficaram registrados. Guarde o número do pedido; esta página pode ser consultada neste navegador.</p><a href="/#catalogo" className="btn-primary inline-block">Voltar à loja</a></> : <><p>Aguardando confirmação simulada. Não há QR Code, cobrança Pix ou processamento de cartão real.</p><button disabled={ocupado} onClick={confirmar} className="btn-primary disabled:opacity-50">{ocupado ? 'Confirmando…' : 'Simular pagamento aprovado'}</button></>}
      </div> : id ? <p>Carregando pedido. Se houver erro, <a href="/carrinho" className="underline">volte ao carrinho</a>.</p> : carregando ? <p>Carregando carrinho…</p> : !valido ? <p>Revise os itens no <a href="/carrinho" className="underline">carrinho</a> antes de continuar.</p> : <>
        <ol aria-label="Etapas da compra" className="flex flex-wrap gap-4 mb-6">{['Endereço', 'Entrega', 'Pagamento', 'Revisão'].map((label, index) => <li key={label} aria-current={etapa === index ? 'step' : undefined} className={etapa === index ? 'font-bold text-camada-teal-700' : 'text-gray-500'}>{index + 1}. {label}</li>)}</ol>
        <div className="rounded-xl border bg-white p-6">
          {etapa === 0 && <><p className="mb-5 text-sm text-gray-600">{session ? `Conectado como ${session.user.name}.` : <>Compra sem cadastro. Já tem conta? <a href="/login?retorno=/checkout" className="underline">Entrar (opcional)</a></>}</p><EnderecoCheckout endereco={endereco} onChange={setEndereco} onContinuar={() => { setErro(''); setEtapa(1) }} /></>}
          {etapa === 1 && <div className="space-y-5"><h2 className="text-xl font-semibold">Forma de entrega</h2><label className="block border rounded-lg p-4"><input type="radio" checked readOnly name="entrega" /> Entrega simulada — R$ 0,00</label><p>Sem cotação ou prazo real nesta simulação.</p><button onClick={() => setEtapa(2)} className="btn-primary">Continuar para pagamento</button></div>}
          {etapa === 2 && <div className="space-y-5"><h2 className="text-xl font-semibold">Forma de pagamento</h2>{[['pix', 'Pix'], ['credito', 'Cartão de crédito']].map(([value, label]) => <label key={value} className="block border rounded-lg p-4"><input type="radio" name="pagamento" value={value} checked={pagamento === value} onChange={() => setPagamento(value)} /> {label} — simulado</label>)}<p>O teste não solicita número de cartão, validade ou código de segurança.</p><button className="btn-primary" onClick={() => setEtapa(3)}>Revisar compra</button></div>}
          {etapa === 3 && <div className="space-y-5"><h2 className="text-xl font-semibold">Revise sua compra</h2><ul>{itens.map(item => <li className="py-2" key={item.chave}>{item.quantidade} × {item.nome} — {item.cor}: {formatarMoeda(item.precoCentavos * item.quantidade)}</li>)}</ul><p>{endereco.nome} · {endereco.rua}, {endereco.numero}, {endereco.complemento} · {endereco.bairro}, {endereco.cidade}/{endereco.uf} · CEP {endereco.cep}</p><p>Frete simulado: R$ 0,00 · {pagamento === 'pix' ? 'Pix' : 'Crédito'} simulado</p><p className="text-xl font-bold">Total: {formatarMoeda(total)}</p><p className="text-sm text-gray-600">Os preços serão conferidos no servidor ao registrar o pedido. Confira o total registrado antes de simular o pagamento.</p><button disabled={ocupado} onClick={criarPedido} className="btn-primary disabled:opacity-50">{ocupado ? 'Registrando…' : 'Criar pedido de teste'}</button></div>}
          {etapa > 0 && <button disabled={ocupado} className="mt-5 underline block" onClick={() => { setErro(''); setEtapa(value => value - 1) }}>Voltar à etapa anterior</button>}
        </div>
      </>}
    </>}
    <a href="/carrinho" className="inline-block underline mt-6 text-camada-teal-700">Voltar ao carrinho</a>
  </section>
}
