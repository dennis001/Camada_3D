import React, { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import { formatarMoeda } from '../lib/produtos'

const field = 'mt-1 w-full rounded-lg border border-gray-300 bg-white p-2'
const button = 'rounded-lg border border-gray-300 px-4 py-2 disabled:opacity-40'
const statusLabel = status => status === 'confirmed' ? 'Confirmado (simulado)' : 'Aguardando pagamento'
const methodLabel = value => value === 'pix' ? 'Pix' : 'Cartão de crédito'
const dateLabel = value => value ? new Date(value).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'Data não registrada'
const eventLabels = { created: 'Pedido de teste criado', payment_confirmed: 'Pagamento aprovado na simulação', legacy_confirmation: 'Pagamento já confirmado antes da implantação do histórico' }

export function DetalhePedido({ data }) {
  const { pedido, historico } = data
  const d = pedido.details
  const address = d.endereco
  return <div className="space-y-6">
    <div className="rounded-xl border bg-white p-5">
      <h3 className="text-lg font-semibold">Pedido <span className="break-all">{pedido.id}</span></h3>
      <p className="mt-2 text-sm text-gray-600">Site · Teste · {dateLabel(pedido.created_at)}</p>
      <dl className="mt-5 grid gap-4 sm:grid-cols-3">
        <div><dt className="text-sm text-gray-600">Pagamento</dt><dd>{statusLabel(pedido.status)} · {methodLabel(d.pagamento)}</dd></div>
        <div><dt className="text-sm text-gray-600">Produção</dt><dd>{pedido.producao}</dd></div>
        <div><dt className="text-sm text-gray-600">Envio</dt><dd>{pedido.envio}</dd></div>
      </dl>
      <p className="mt-4 text-sm text-gray-600">Prazo de postagem/entrega: não definido nesta simulação. Nenhuma ordem de produção ou postagem foi gerada.</p>
    </div>
    <div className="rounded-xl border bg-white p-5">
      <h3 className="text-lg font-semibold mb-3">Itens comprados</h3>
      <ul className="divide-y">{d.itens.map(item => <li key={item.chave} className="py-4 flex flex-wrap justify-between gap-3"><div className="min-w-0"><p className="font-medium break-words">{item.nome}</p><p className="text-sm text-gray-600 break-words">{item.cor} · SKU: {item.sku || 'Não informado'}</p><p className="text-sm">{item.quantidade} unidade(s) × {formatarMoeda(item.precoCentavos)}</p></div><strong>{formatarMoeda(item.precoCentavos * item.quantidade)}</strong></li>)}</ul>
      <dl className="border-t pt-4 space-y-2"><div className="flex justify-between gap-3"><dt>Produtos</dt><dd>{formatarMoeda(d.subtotal)}</dd></div><div className="flex justify-between gap-3"><dt>Frete simulado</dt><dd>{formatarMoeda(d.frete)}</dd></div><div className="flex justify-between gap-3 font-bold"><dt>Total do pedido</dt><dd>{formatarMoeda(d.total)}</dd></div></dl>
      <p className="mt-3 text-xs text-gray-500">Valores registrados na compra, preservados mesmo se o catálogo mudar.</p>
    </div>
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-xl border bg-white p-5 break-words"><h3 className="text-lg font-semibold mb-3">Destinatário e endereço</h3><p>{address.nome}</p><p>{address.rua}, {address.numero}</p>{address.complemento && <p>{address.complemento}</p>}<p>{address.bairro} · {address.cidade}/{address.uf}</p><p>CEP {address.cep}</p></div>
      <div className="rounded-xl border bg-white p-5"><h3 className="text-lg font-semibold mb-3">Histórico do pedido</h3><ol className="space-y-4">{historico.map(event => <li key={event.event_type}><p>{eventLabels[event.event_type] || 'Evento do pedido'}</p><p className="text-sm text-gray-500">{dateLabel(event.occurred_at)}</p></li>)}</ol></div>
    </div>
  </div>
}

export default function Pedidos() {
  const [filtros, setFiltros] = useState({ busca: '', status: '', pagamento: '', inicio: '', fim: '' })
  const [consulta, setConsulta] = useState({ pagina: 1 })
  const [revisao, setRevisao] = useState(0)
  const [lista, setLista] = useState(null)
  const [selecionado, setSelecionado] = useState(null)
  const [detalhe, setDetalhe] = useState(null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const titulo = useRef(null)
  const ultimoBotao = useRef(null)
  useEffect(() => {
    let ativo = true
    setCarregando(true); setErro(''); setDetalhe(null); setLista(null)
    const query = new URLSearchParams(Object.entries(consulta).filter(([, value]) => value !== ''))
    api(selecionado ? `/admin/pedidos/${selecionado}` : `/admin/pedidos?${query}`).then(data => {
      if (ativo) { if (selecionado) setDetalhe(data); else setLista(data) }
    }).catch(error => { if (ativo) setErro(error.status === 404 ? 'Painel ou pedido indisponível neste ambiente.' : error.message) }).finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [consulta, selecionado, revisao])
  useEffect(() => { if (selecionado) titulo.current?.focus() }, [selecionado])
  useEffect(() => { if (lista && ultimoBotao.current) document.getElementById(`pedido-${ultimoBotao.current}`)?.focus() }, [lista])
  const paginas = lista ? Math.max(1, Math.ceil(lista.resumo.quantidade / lista.porPagina)) : 1
  function filtrar(event) { event.preventDefault(); ultimoBotao.current = null; setConsulta({ ...filtros, pagina: 1 }) }
  return <section aria-labelledby="pedidos-title" className="mt-6">
    <div className="flex flex-wrap justify-between items-center gap-3 mb-4"><h2 id="pedidos-title" ref={titulo} tabIndex={-1} className="text-2xl font-bold">{selecionado ? 'Detalhes do pedido' : 'Pedidos'}</h2><div className="flex gap-2">{selecionado && <button className={button} onClick={() => setSelecionado(null)}>Voltar à lista</button>}<button disabled={carregando} className={button} onClick={() => setRevisao(value => value + 1)}>Atualizar</button></div></div>
    <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Ambiente de testes: use somente dados fictícios. Pedidos deste painel não representam vendas reais. Cadastro de pedidos externos, produção e expedição serão adicionados nas próximas etapas.</p>
    {!selecionado && <form onSubmit={filtrar} className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 rounded-xl border bg-white p-5">
      <label>Número do pedido<input className={field} maxLength={36} value={filtros.busca} placeholder="Número completo ou parte dele" onChange={e => setFiltros({ ...filtros, busca: e.target.value })} /></label>
      <label>Pagamento<select className={field} value={filtros.status} onChange={e => setFiltros({ ...filtros, status: e.target.value })}><option value="">Todos</option><option value="pending">Aguardando pagamento</option><option value="confirmed">Confirmado (simulado)</option></select></label>
      <label>Forma de pagamento<select className={field} value={filtros.pagamento} onChange={e => setFiltros({ ...filtros, pagamento: e.target.value })}><option value="">Todas</option><option value="pix">Pix</option><option value="credito">Cartão de crédito</option></select></label>
      <label>De<input type="date" className={field} value={filtros.inicio} onChange={e => setFiltros({ ...filtros, inicio: e.target.value })} /></label>
      <label>Até<input type="date" className={field} value={filtros.fim} onChange={e => setFiltros({ ...filtros, fim: e.target.value })} /></label>
      <div className="flex flex-wrap items-end gap-2"><button className="btn-primary">Filtrar</button><button type="button" className={button} onClick={() => { setFiltros({ busca: '', status: '', pagamento: '', inicio: '', fim: '' }); setConsulta({ pagina: 1 }); ultimoBotao.current = null }}>Limpar filtros</button></div>
      <p className="text-xs text-gray-500 sm:col-span-2 lg:col-span-3">Canal: Site (teste). Período considera a data de criação, no horário de Brasília.</p>
    </form>}
    {erro && <p role="alert" className="my-4 text-red-700">{erro} Use Atualizar para tentar novamente.</p>}
    {carregando && <p role="status" className="py-8">Carregando pedidos…</p>}
    {!carregando && detalhe && <DetalhePedido data={detalhe} />}
    {!carregando && lista && <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">{[['Pedidos', lista.resumo.quantidade], ['Aguardando pagamento', lista.resumo.pendentes], ['Confirmados (simulados)', lista.resumo.confirmados], ['Valor dos pedidos de teste', formatarMoeda(lista.resumo.total)]].map(([label, value]) => <div key={label} className="rounded-xl border bg-white p-5"><p className="text-sm text-gray-600">{label}</p><p className="text-2xl font-bold mt-2">{value}</p></div>)}</div>
      <p className="text-xs text-gray-500 mb-3">Totais de todos os pedidos que correspondem aos filtros; não representam faturamento.</p>
      {lista.pedidos.length ? <ul className="space-y-3">{lista.pedidos.map(pedido => <li key={pedido.id} className="rounded-xl border bg-white p-5 flex flex-wrap items-center justify-between gap-4"><div className="min-w-0"><p className="font-semibold break-all">{pedido.id}</p><p className="text-sm text-gray-500 mt-1">{dateLabel(pedido.created_at)} · Site (teste) · {pedido.unidades} unidade(s)</p><p className="text-sm mt-2">{statusLabel(pedido.status)} · {methodLabel(pedido.pagamento)}</p></div><div className="flex items-center gap-4"><strong>{formatarMoeda(pedido.total)}</strong><button id={`pedido-${pedido.id}`} className={button} aria-label={`Ver detalhes do pedido ${pedido.id}`} onClick={() => { ultimoBotao.current = pedido.id; setSelecionado(pedido.id) }}>Ver detalhes</button></div></li>)}</ul> : <div className="rounded-xl border border-dashed p-8 text-center"><h3 className="font-semibold">Nenhum pedido encontrado</h3><p className="mt-2 text-gray-600">Revise os filtros ou crie uma compra simulada na loja.</p><a className="inline-block underline mt-4 text-camada-teal-700" href="/">Ir para a loja</a></div>}
      <nav aria-label="Páginas de pedidos" className="mt-5 flex flex-wrap items-center justify-between gap-3"><button className={button} disabled={lista.pagina <= 1} onClick={() => { ultimoBotao.current = null; setConsulta({ ...consulta, pagina: lista.pagina - 1 }) }}>Anterior</button><p>Página {lista.pagina} · {lista.resumo.quantidade} pedido(s)</p><button className={button} disabled={lista.pagina >= paginas} onClick={() => { ultimoBotao.current = null; setConsulta({ ...consulta, pagina: lista.pagina + 1 }) }}>Próxima</button></nav>
    </>}
  </section>
}
