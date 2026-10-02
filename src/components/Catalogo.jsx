import React, { useMemo, useState } from 'react'
import { Box, Search, ShoppingBag } from 'lucide-react'
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

function ProdutoCard({ produto, onAdicionar }) {
  const [corId, setCorId] = useState('')
  const [quantidade, setQuantidade] = useState('1')
  const [indiceFoto, setIndiceFoto] = useState(0)
  const [mensagem, setMensagem] = useState(null)
  const cores = produto.cores || []
  const cor = cores.find((item) => item.id === corId) || cores.find((item) => item.estoqueSite > 0) || cores[0]
  const estoque = cor?.estoqueSite || 0
  const categoria = categorias.find((item) => item.id === produto.categoriaId)
  const imagens = produto.imagens || []
  const imagem = imagens[indiceFoto] || imagens[0]
  const quantidadeValida = Number.isInteger(Number(quantidade)) && Number(quantidade) >= 1 && Number(quantidade) <= estoque

  function adicionar(event) {
    event.preventDefault()
    if (!cor || !quantidadeValida) {
      setMensagem({ ok: false, texto: 'Escolha uma cor disponível e uma quantidade dentro do estoque.' })
      return
    }
    const resultado = onAdicionar(produto.id, cor.id, Number(quantidade))
    setMensagem(resultado.ok
      ? { ok: true, texto: 'Produto adicionado ao carrinho.' }
      : { ok: false, texto: resultado.erro || 'Não foi possível adicionar este produto.' })
  }

  return (
    <article className="flex flex-col rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="h-56 bg-gray-50">
        <ImagemProduto key={imagem || 'sem-foto'} src={imagem} nome={produto.nome} />
      </div>
      {imagens.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2 px-4 py-3" aria-label={'Fotos de ' + produto.nome}>
          {imagens.map((src, indice) => (
            <button key={src + '-' + indice} type="button" aria-label={'Ver foto ' + (indice + 1) + ' de ' + produto.nome} aria-pressed={imagem === src}
              onClick={() => setIndiceFoto(indice)} className={'text-xs px-3 py-2 rounded-lg border ' + (imagem === src ? 'border-camada-teal-600 text-camada-teal-700 bg-camada-teal-50' : 'border-gray-300 text-gray-600')}>
              Foto {indice + 1}
            </button>
          ))}
        </div>
      )}
      <div className="p-6 flex flex-col flex-1">
        <span className="self-start text-xs font-medium text-camada-teal-700 bg-camada-teal-50 rounded-full px-3 py-1 mb-3">{categoria?.nome || 'Produtos'}</span>
        <h3 className="text-xl font-semibold text-camada-dark-900 mb-2">{produto.nome}</h3>
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{produto.descricao}</p>
        <details className="text-sm my-4 border-y border-gray-100 py-3">
          <summary className="cursor-pointer font-medium text-camada-dark-900">Detalhes do produto</summary>
          <div className="pt-3 space-y-2 text-gray-600">
            <p className="whitespace-pre-line">{produto.descricao}</p>
            <p><strong className="font-medium">Material:</strong> {produto.material || 'A informar'}</p>
            <p><strong className="font-medium">Medidas:</strong> {produto.medidas || 'A informar'}</p>
            {cor?.sku && <p className="break-words"><strong className="font-medium">SKU da cor selecionada:</strong> {cor.sku}</p>}
          </div>
        </details>
        <p className="text-2xl font-bold text-camada-teal-700 mb-4">{formatarMoeda(produto.precoCentavos)}</p>
        <form onSubmit={adicionar} className="mt-auto space-y-4">
          <div>
            <label htmlFor={'cor-' + produto.id} className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
            <select id={'cor-' + produto.id} value={cor?.id || ''} disabled={!cores.length}
              onChange={(event) => { setCorId(event.target.value); setQuantidade('1'); setMensagem(null) }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white">
              {!cores.length && <option value="">Nenhuma cor cadastrada</option>}
              {cores.map((item) => <option key={item.id} value={item.id}>{item.nome}{item.estoqueSite > 0 ? ' — ' + item.estoqueSite + ' disponível(is)' : ' — esgotada'}</option>)}
            </select>
          </div>
          <div className="flex gap-4 items-end">
            <div className="w-24 shrink-0">
              <label htmlFor={'quantidade-' + produto.id} className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
              <input id={'quantidade-' + produto.id} type="number" inputMode="numeric" min="1" max={Math.max(1, estoque)} step="1" required value={quantidade}
                disabled={!estoque} onChange={(event) => { setQuantidade(event.target.value); setMensagem(null) }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-gray-100" />
            </div>
            <p className="pb-2 text-sm text-gray-500">{estoque > 0 ? estoque + ' peça(s) pronta(s) nesta cor' : 'Cor sem estoque no site'}</p>
          </div>
          <button type="submit" disabled={!quantidadeValida} className="w-full btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
            <ShoppingBag size={18} aria-hidden="true" />
            {estoque > 0 ? 'Adicionar ao carrinho' : 'Indisponível'}
          </button>
          <div className="text-sm min-h-[1.25rem]" role="status" aria-live="polite">
            {mensagem && <p className={mensagem.ok ? 'text-camada-teal-700' : 'text-red-700'}>{mensagem.texto} {mensagem.ok && <a href="#carrinho" className="underline font-medium">Ver carrinho</a>}</p>}
          </div>
        </form>
      </div>
    </article>
  )
}

export default function Catalogo({ produtos = [], onAdicionar }) {
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
          <p className="text-gray-600 max-w-2xl mx-auto">Conheça as peças, confira as medidas e escolha entre as cores com estoque disponível.</p>
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{filtrados.map((produto) => <ProdutoCard key={produto.id} produto={produto} onAdicionar={onAdicionar} />)}</div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <Box size={36} className="mx-auto mb-4 text-camada-teal-600" aria-hidden="true" />
            <h3 className="text-xl font-semibold text-camada-dark-900 mb-2">{produtos.length ? 'Nenhum produto encontrado' : 'Nosso catálogo está em preparação'}</h3>
            <p className="text-gray-600 max-w-lg mx-auto">{produtos.length ? 'Tente outro nome ou escolha uma categoria diferente.' : 'As peças aparecerão aqui conforme forem cadastradas e liberadas para o catálogo.'}</p>
            {produtos.length > 0 && <button type="button" onClick={limparFiltros} className="btn-secondary mt-6">Limpar filtros</button>}
          </div>
        )}
      </div>
    </section>
  )
}

