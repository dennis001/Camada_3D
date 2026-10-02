import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Box, Search, ShoppingBag, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { estimarImpressao, formatarTempoImpressao } from '../lib/producao.js'
import { categorias, formatarMoeda, normalizarTexto } from '../lib/produtos.js'

function ImagemProduto({ src, nome }) {
  const [falhou, setFalhou] = useState(false)

  if (!src || falhou) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-500 bg-gray-100">
        <Box size={36} aria-hidden="true" />
        <span className="text-sm">Foto ainda não disponível</span>
      </div>
    )
  }

  return <img src={src} alt={nome} loading="lazy" onError={() => setFalhou(true)} className="w-full h-full object-contain" />
}

function ProdutoCard({ produto, onAdicionar, onVerDetalhes, ampliado = false, onVerCarrinho }) {
  const quantidadeId = useId()
  const [corId, setCorId] = useState('')
  const [quantidade, setQuantidade] = useState('1')
  const [indiceFoto, setIndiceFoto] = useState(0)
  const [mensagem, setMensagem] = useState(null)
  const cores = produto.cores || []
  const cor = cores.find((item) => item.id === corId) || cores[0]
  const categoria = categorias.find((item) => item.id === produto.categoriaId)
  const imagens = [...new Set([...(produto.imagens || []), ...cores.map(item => item.imagem).filter(Boolean)])]
  const imagem = imagens[indiceFoto] || imagens[0]
  const quantidadeValida = Boolean(cor) && Number.isSafeInteger(Number(quantidade)) && Number(quantidade) >= 1

  function selecionarCor(item) {
    setCorId(item.id); setQuantidade('1'); setMensagem(null)
    if (item.imagem) setIndiceFoto(imagens.indexOf(item.imagem))
  }
  function trocarFoto(direcao) {
    const indice = ((Math.max(0, imagens.indexOf(imagem)) + direcao) % imagens.length + imagens.length) % imagens.length
    setIndiceFoto(indice)
    const variante = cores.find(item => item.imagem === imagens[indice])
    if (variante) { setCorId(variante.id); setQuantidade('1'); setMensagem(null) }
  }

  function adicionar(event) {
    event.preventDefault()
    if (!cor || !quantidadeValida) {
      setMensagem({ ok: false, texto: 'Escolha uma cor e uma quantidade inteira maior que zero.' })
      return
    }
    const resultado = onAdicionar(produto.id, cor.id, Number(quantidade))
    setMensagem(resultado.ok
      ? { ok: true, texto: 'Produto adicionado ao carrinho.' }
      : { ok: false, texto: resultado.erro || 'Não foi possível adicionar este produto.' })
  }

  return (
    <article className={ampliado ? 'grid bg-white lg:grid-cols-2' : 'flex flex-col rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm'}>
      <div>
      <div className={'relative bg-gray-50 ' + (ampliado ? 'h-72 sm:h-96 lg:h-[32rem]' : 'h-56')} role="group" aria-label={'Fotos de ' + produto.nome}>
        {onVerDetalhes ? <button type="button" onClick={onVerDetalhes} aria-label={'Ver detalhes de ' + produto.nome} className="h-full w-full cursor-zoom-in focus-visible:outline focus-visible:outline-camada-teal-600"><ImagemProduto key={imagem || 'sem-foto'} src={imagem} nome={produto.nome} /></button> : <ImagemProduto key={imagem || 'sem-foto'} src={imagem} nome={produto.nome} />}
        {imagens.length > 1 && <>
          <button type="button" onClick={() => trocarFoto(-1)} aria-label={'Foto anterior de ' + produto.nome} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border bg-white/95 p-2 text-gray-700 shadow hover:bg-white focus-visible:outline-camada-teal-600"><ChevronLeft size={22} aria-hidden="true" /></button>
          <button type="button" onClick={() => trocarFoto(1)} aria-label={'Próxima foto de ' + produto.nome} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border bg-white/95 p-2 text-gray-700 shadow hover:bg-white focus-visible:outline-camada-teal-600"><ChevronRight size={22} aria-hidden="true" /></button>
          <span role="status" className="absolute bottom-2 right-3 rounded-full bg-black/60 px-2 py-1 text-xs text-white">{Math.max(0, imagens.indexOf(imagem)) + 1} / {imagens.length}</span>
        </>}
      </div>
      {imagem && cores.some(item => item.imagem === imagem) && <p className="px-4 pt-2 text-xs text-gray-500">Imagem ilustrativa da cor. O tom pode variar na peça impressa.</p>}
      {cores.length > 0 && (
        <div className="border-b border-gray-100 px-4 py-3" role="group" aria-label={'Cores de ' + produto.nome}>
          <p className="mb-2 text-sm font-medium text-gray-700">Cor: {cor?.nome}</p>
          <div className="flex flex-wrap gap-2">{cores.map(item => (
            <button key={item.id} type="button" aria-pressed={cor?.id === item.id} onClick={() => selecionarCor(item)} className={'rounded-lg border px-3 py-2 text-xs ' + (cor?.id === item.id ? 'border-camada-teal-600 bg-camada-teal-50 text-camada-teal-700' : 'border-gray-300 text-gray-600')}>
              {item.nome}
            </button>
          ))}</div>
        </div>
      )}
      </div>
      <div className="p-6 flex flex-col flex-1">
        <span className="self-start text-xs font-medium text-camada-teal-700 bg-camada-teal-50 rounded-full px-3 py-1 mb-3">{categoria?.nome || 'Produtos'}</span>
        <h3 className={'font-semibold text-camada-dark-900 mb-2 ' + (ampliado ? 'text-2xl' : 'text-xl')}>{onVerDetalhes ? <button type="button" onClick={onVerDetalhes} className="text-left hover:text-camada-teal-700 hover:underline">{produto.nome}</button> : produto.nome}</h3>
        {produto.emTeste && <p className="mb-3 text-sm font-medium text-amber-800">Prévia de teste</p>}
        {!ampliado && <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{produto.descricao}</p>}
        <details open={ampliado || undefined} className="text-sm my-4 border-y border-gray-100 py-3">
          <summary className="cursor-pointer font-medium text-camada-dark-900">Detalhes do produto</summary>
          <div className="pt-3 space-y-2 text-gray-600">
            <p className="whitespace-pre-line">{produto.descricao}</p>
            <p><strong className="font-medium">Material:</strong> {produto.material || 'A informar'}</p>
            <p><strong className="font-medium">Medidas:</strong> {produto.medidas || 'A informar'}</p>
            <p className="text-xs">L = largura · A = altura · C = comprimento/profundidade.</p>
            {cor?.sku && <p className="break-words"><strong className="font-medium">SKU da cor selecionada:</strong> {cor.sku}</p>}
          </div>
        </details>
        <p className="text-2xl font-bold text-camada-teal-700 mb-4">{formatarMoeda(produto.precoCentavos)}</p>
        <p className="mb-4 text-sm text-gray-600">Impressão para esta quantidade: {formatarTempoImpressao(estimarImpressao(Number(quantidade), produto.producao).minutos)}. O transporte é calculado separadamente.</p>
        <form onSubmit={adicionar} className="mt-auto space-y-4">
          {!cores.length && <p className="text-sm text-gray-600">Nenhuma cor cadastrada.</p>}
          <div className="flex gap-4 items-end">
            <div className="w-24 shrink-0">
              <label htmlFor={quantidadeId} className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
              <input id={quantidadeId} type="number" inputMode="numeric" min="1" step="1" required value={quantidade}
                disabled={!cor} onChange={(event) => { setQuantidade(event.target.value); setMensagem(null) }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-gray-100" />
            </div>
            <p className="pb-2 text-sm text-gray-500">Produção sob encomenda</p>
          </div>
          <button type="submit" disabled={!quantidadeValida} className="w-full btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
            <ShoppingBag size={18} aria-hidden="true" />
            {cor ? 'Adicionar ao carrinho' : 'Indisponível'}
          </button>
          <div className="text-sm min-h-[1.25rem]" role="status" aria-live="polite">
            {mensagem && <p className={mensagem.ok ? 'text-camada-teal-700' : 'text-red-700'}>{mensagem.texto} {mensagem.ok && <a href="#carrinho" onClick={onVerCarrinho} className="underline font-medium">Ver carrinho</a>}</p>}
          </div>
        </form>
      </div>
    </article>
  )
}

function DetalhesProduto({ produto, onAdicionar, onFechar }) {
  const dialogRef = useRef(null)
  useEffect(() => {
    const dialog = dialogRef.current
    const anterior = document.activeElement
    const overflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = overflow
      if (anterior?.isConnected) anterior.focus()
    }
  }, [])
  return <dialog ref={dialogRef} aria-label={'Detalhes de ' + produto.nome} onCancel={event => { event.preventDefault(); onFechar() }} onClick={event => { if (event.target === event.currentTarget) onFechar() }} className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-5xl overflow-y-auto rounded-2xl border-0 bg-white p-0 shadow-2xl backdrop:bg-black/60">
    <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3">
      <p className="font-medium text-gray-700">Detalhes do produto</p>
      <button type="button" autoFocus onClick={onFechar} aria-label="Fechar detalhes do produto" className="rounded-full p-2 text-gray-600 hover:bg-gray-100"><X size={24} aria-hidden="true" /></button>
    </div>
    <ProdutoCard produto={produto} onAdicionar={onAdicionar} ampliado onVerCarrinho={onFechar} />
  </dialog>
}

export default function Catalogo({ produtos = [], onAdicionar }) {
  const [produtoAbertoId, setProdutoAbertoId] = useState(null)
  const produtoAberto = produtos.find(produto => produto.id === produtoAbertoId)
  const [busca, setBusca] = useState('')
  const [categoriaId, setCategoriaId] = useState('todos')
  const [ordem, setOrdem] = useState('padrao')
  const filtrados = useMemo(() => {
    const termo = normalizarTexto(busca.trim())
    const resultado = produtos.filter((produto) => {
      const correspondeBusca = normalizarTexto(produto.nome + ' ' + produto.descricao).includes(termo)
      return correspondeBusca && (categoriaId === 'todos' || produto.categoriaId === categoriaId)
    })
    if (ordem === 'preco-asc') resultado.sort((a, b) => a.precoCentavos - b.precoCentavos)
    if (ordem === 'preco-desc') resultado.sort((a, b) => b.precoCentavos - a.precoCentavos)
    if (ordem === 'nome') resultado.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    return resultado
  }, [produtos, busca, categoriaId, ordem])

  function limparFiltros() {
    setBusca('')
    setCategoriaId('todos')
    setOrdem('padrao')
  }

  return (
    <section id="catalogo" className="scroll-mt-24 py-16 bg-gray-50" aria-labelledby="titulo-catalogo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold tracking-widest uppercase text-camada-teal-700 mb-3">Feito camada por camada</p>
          <h2 id="titulo-catalogo" className="text-3xl font-bold text-camada-dark-900 mb-4">Catálogo de produtos</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Conheça as peças, confira as medidas e escolha a cor para produzir sob encomenda.</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-8">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="busca-produtos" className="block text-sm font-medium text-gray-700 mb-2">Buscar produto</label>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-3 text-gray-400" aria-hidden="true" />
                <input id="busca-produtos" type="search" placeholder="Nome ou descrição" value={busca} onChange={(event) => setBusca(event.target.value)}
                  className="scroll-mt-28 w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" />
              </div>
            </div>
            <div>
              <label htmlFor="categoria-produtos" className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
              <select id="categoria-produtos" value={categoriaId} onChange={(event) => setCategoriaId(event.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white">
                <option value="todos">Todas as categorias</option>
                {categorias.filter((categoria) => categoria.id !== 'todos').map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="ordem-produtos" className="block text-sm font-medium text-gray-700 mb-2">Ordenar por</label>
              <select id="ordem-produtos" value={ordem} onChange={(event) => setOrdem(event.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white">
                <option value="padrao">Ordem do catálogo</option>
                <option value="preco-asc">Menor preço</option>
                <option value="preco-desc">Maior preço</option>
                <option value="nome">Nome: A a Z</option>
              </select>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500" aria-live="polite">{filtrados.length} produto(s) encontrado(s)</p>
        </div>
        {filtrados.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{filtrados.map((produto) => <ProdutoCard key={produto.id} produto={produto} onAdicionar={onAdicionar} onVerDetalhes={() => setProdutoAbertoId(produto.id)} />)}</div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <Box size={36} className="mx-auto mb-4 text-camada-teal-600" aria-hidden="true" />
            <h3 className="text-xl font-semibold text-camada-dark-900 mb-2">{produtos.length ? 'Nenhum produto encontrado' : 'Nosso catálogo está em preparação'}</h3>
            <p className="text-gray-600 max-w-lg mx-auto">{produtos.length ? 'Tente outro nome ou escolha uma categoria diferente.' : 'As peças aparecerão aqui conforme forem cadastradas e liberadas para o catálogo.'}</p>
            {produtos.length > 0 && <button type="button" onClick={limparFiltros} className="btn-secondary mt-6">Limpar filtros</button>}
          </div>
        )}
      </div>
      {produtoAberto && <DetalhesProduto key={produtoAberto.id} produto={produtoAberto} onAdicionar={onAdicionar} onFechar={() => setProdutoAbertoId(null)} />}
    </section>
  )
}

