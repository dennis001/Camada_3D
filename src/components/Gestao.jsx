import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Plus, Save, Download, Upload, Package, Trash2, AlertCircle } from 'lucide-react'
import { criarProduto, validarProduto, calcularCustos, parseMoeda, formatarMoeda, categorias } from '../lib/produtos'
import { criarBackup } from '../lib/persistencia'
import { downloadJson } from '../lib/api'

const campoClasse = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-camada-dark-900 outline-none focus:border-camada-teal-600 focus:ring-2 focus:ring-camada-teal-100 disabled:bg-gray-100'
const botaoSecundario = 'inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-camada-dark-900 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-camada-teal-600 disabled:opacity-50'
const moedaTexto = (valor) => valor == null ? '' : (valor / 100).toFixed(2).replace('.', ',')
const numeroTexto = (valor) => valor == null ? '' : String(valor)
const novoId = () => globalThis.crypto?.randomUUID?.() || `item-${Date.now()}-${Math.random().toString(36).slice(2)}`

function numero(valor) {
  const texto = String(valor ?? '').trim()
  if (!texto || !/^\d+(?:[.,]\d+)?$/.test(texto)) return null
  const resultado = Number(texto.replace(',', '.'))
  return Number.isFinite(resultado) ? resultado : null
}

function paraFormulario(produto) {
  return {
    ...produto,
    precoCentavos: moedaTexto(produto.precoCentavos),
    imagensTexto: (produto.imagens || []).join('\n'),
    cores: (produto.cores || []).map(cor => ({ ...cor, estoqueSite: numeroTexto(cor.estoqueSite) })),
    ficha: {
      ...produto.ficha,
      tempoPlacaMinutos: numeroTexto(produto.ficha.tempoPlacaMinutos),
      unidadesPorPlaca: numeroTexto(produto.ficha.unidadesPorPlaca),
      potenciaWatts: numeroTexto(produto.ficha.potenciaWatts),
      tarifaKwhCentavos: moedaTexto(produto.ficha.tarifaKwhCentavos),
      embalagemCentavos: moedaTexto(produto.ficha.embalagemCentavos),
      outrosCustosCentavos: moedaTexto(produto.ficha.outrosCustosCentavos),
      filamentos: produto.ficha.filamentos.map(filamento => ({
        ...filamento,
        gramasPorPlaca: numeroTexto(filamento.gramasPorPlaca),
        precoKgCentavos: moedaTexto(filamento.precoKgCentavos),
      })),
    },
    origem: { ...produto.origem },
  }
}

function paraProduto(formulario) {
  const { imagensTexto, ...produto } = formulario
  return {
    ...produto,
    nome: produto.nome.trim(),
    descricao: produto.descricao.trim(),
    material: produto.material.trim(),
    medidas: produto.medidas.trim(),
    precoCentavos: parseMoeda(produto.precoCentavos),
    imagens: imagensTexto.split(/\r?\n/).map(url => url.trim()).filter(Boolean),
    cores: produto.cores.map(cor => ({ ...cor, nome: cor.nome.trim(), sku: cor.sku.trim(), estoqueSite: numero(cor.estoqueSite) })),
    ficha: {
      ...produto.ficha,
      tempoPlacaMinutos: numero(produto.ficha.tempoPlacaMinutos),
      unidadesPorPlaca: numero(produto.ficha.unidadesPorPlaca),
      potenciaWatts: numero(produto.ficha.potenciaWatts),
      tarifaKwhCentavos: parseMoeda(produto.ficha.tarifaKwhCentavos),
      embalagemCentavos: parseMoeda(produto.ficha.embalagemCentavos),
      outrosCustosCentavos: parseMoeda(produto.ficha.outrosCustosCentavos),
      filamentos: produto.ficha.filamentos.map(filamento => ({
        ...filamento,
        gramasPorPlaca: numero(filamento.gramasPorPlaca),
        precoKgCentavos: parseMoeda(filamento.precoKgCentavos),
      })),
    },
  }
}

function errosDeEntrada(formulario) {
  const erros = []
  const verificar = (rotulo, valor, parser, inteiro = false) => {
    if (!String(valor ?? '').trim()) return
    const convertido = parser(valor)
    if (convertido == null || convertido < 0 || (inteiro && !Number.isInteger(convertido))) {
      erros.push(`${rotulo}: informe um número ${inteiro ? 'inteiro ' : ''}não negativo válido.`)
    }
  }
  verificar('Preço de venda', formulario.precoCentavos, parseMoeda)
  verificar('Tempo de impressão da placa', formulario.ficha.tempoPlacaMinutos, numero)
  verificar('Unidades por placa', formulario.ficha.unidadesPorPlaca, numero, true)
  verificar('Potência média', formulario.ficha.potenciaWatts, numero)
  verificar('Tarifa de energia', formulario.ficha.tarifaKwhCentavos, parseMoeda)
  verificar('Embalagem', formulario.ficha.embalagemCentavos, parseMoeda)
  verificar('Outros custos', formulario.ficha.outrosCustosCentavos, parseMoeda)
  formulario.cores.forEach((cor, indice) => verificar(`Estoque da cor ${indice + 1}`, cor.estoqueSite, numero, true))
  formulario.ficha.filamentos.forEach((filamento, indice) => {
    verificar(`Consumo do filamento ${indice + 1}`, filamento.gramasPorPlaca, numero)
    verificar(`Preço/kg do filamento ${indice + 1}`, filamento.precoKgCentavos, parseMoeda)
  })
  return erros
}

function Campo({ rotulo, dica, multiline = false, children, ...props }) {
  const id = useId()
  const Entrada = multiline ? 'textarea' : 'input'
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-800">{rotulo}</label>
      {children
        ? <select {...props} id={id} aria-describedby={dica ? `${id}-dica` : undefined} className={campoClasse}>{children}</select>
        : <Entrada {...props} id={id} aria-describedby={dica ? `${id}-dica` : undefined} className={campoClasse} />}
      {dica && <p id={`${id}-dica`} className="mt-1.5 text-xs leading-relaxed text-gray-500">{dica}</p>}
    </div>
  )
}

function Secao({ titulo, descricao, children }) {
  return (
    <fieldset className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
      <legend className="px-2 text-lg font-semibold text-camada-dark-900">{titulo}</legend>
      {descricao && <p className="mb-5 text-sm leading-relaxed text-gray-600">{descricao}</p>}
      {children}
    </fieldset>
  )
}

function Valor({ rotulo, valor, destaque = false }) {
  return (
    <div className={`rounded-xl p-3 ${destaque ? 'bg-camada-dark-900 text-white' : 'bg-gray-50 text-camada-dark-900'}`}>
      <dt className={`text-xs ${destaque ? 'text-gray-300' : 'text-gray-600'}`}>{rotulo}</dt>
      <dd className={`mt-1 text-xl font-semibold ${valor != null && valor < 0 ? (destaque ? 'text-red-300' : 'text-red-700') : ''}`}>
        {valor == null ? 'Pendente' : formatarMoeda(valor)}
      </dd>
    </div>
  )
}

export default function Gestao({ produtos, onSalvar, onExportar, onImportar, erroPersistencia, fonte = 'local', onAlterado }) {
  const servidor = fonte === 'servidor'
  const [formulario, setFormulario] = useState(() => paraFormulario(criarProduto()))
  const [erros, setErros] = useState([])
  const [mensagem, setMensagem] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [alterado, setAlterado] = useState(false)
  useEffect(() => { onAlterado?.(alterado) }, [alterado, onAlterado])
  const [trocaPendente, setTrocaPendente] = useState(null)
  const [busca, setBusca] = useState('')
  const arquivoRef = useRef(null)
  const errosRef = useRef(null)
  const produtoAtual = useMemo(() => paraProduto(formulario), [formulario])
  const custos = useMemo(() => calcularCustos(produtoAtual), [produtoAtual])
  const errosNumericos = useMemo(() => errosDeEntrada(formulario), [formulario])
  const existente = produtos.some(produto => produto.id === formulario.id)
  const visiveis = produtos.filter(produto => `${produto.nome} ${produto.cores.map(cor => cor.sku).join(' ')}`.toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR')))

  const alterar = (atualizar) => {
    setFormulario(atualizar)
    setAlterado(true)
    setMensagem('')
    setErros([])
  }
  const campo = (nome, valor) => alterar(anterior => ({ ...anterior, [nome]: valor }))
  const ficha = (nome, valor) => alterar(anterior => ({ ...anterior, ficha: { ...anterior.ficha, [nome]: valor } }))
  const origem = (nome, valor) => alterar(anterior => ({ ...anterior, origem: { ...anterior.origem, [nome]: valor } }))
  const cor = (indice, nome, valor) => alterar(anterior => ({ ...anterior, cores: anterior.cores.map((item, i) => i === indice ? { ...item, [nome]: valor } : item) }))
  const filamento = (indice, nome, valor) => alterar(anterior => ({ ...anterior, ficha: { ...anterior.ficha, filamentos: anterior.ficha.filamentos.map((item, i) => i === indice ? { ...item, [nome]: valor } : item) } }))

  const abrir = (produto, descartar = false) => {
    if (alterado && !descartar) {
      setTrocaPendente(produto)
      return
    }
    setFormulario(paraFormulario(produto))
    setAlterado(false)
    setErros([])
    setMensagem('')
    setTrocaPendente(null)
  }

  const mostrarErros = (lista) => {
    setErros(lista)
    setMensagem('')
    requestAnimationFrame(() => errosRef.current?.focus())
  }

  const salvar = async (evento) => {
    evento.preventDefault()
    const problemas = [...new Set([...errosNumericos, ...validarProduto(produtoAtual, produtos)])]
    if (problemas.length) {
      mostrarErros(problemas)
      return
    }
    setOcupado(true)
    setMensagem('')
    try {
      const resultado = await onSalvar(produtoAtual)
      if (!resultado?.ok) throw new Error(resultado?.erro || 'Não foi possível salvar o produto neste navegador.')
      setFormulario(paraFormulario(produtoAtual))
      setAlterado(false)
      setTrocaPendente(null)
      setErros([])
      setMensagem(servidor ? 'Produto salvo no servidor. A validação manual ainda está pendente.' : 'Produto salvo neste navegador. A validação manual ainda está pendente.')
    } catch (erro) {
      mostrarErros([erro.message || 'Não foi possível salvar. Faça um backup dos dados disponíveis e tente novamente.'])
    } finally {
      setOcupado(false)
    }
  }

  const exportar = async () => {
    try {
      await onExportar()
      setMensagem('Backup dos produtos salvos solicitado. Confira o arquivo JSON nos downloads; alterações do formulário ainda não salvas não entram no backup.')
      setErros([])
    } catch (erro) {
      mostrarErros([erro.message || 'Não foi possível exportar o backup.'])
    }
  }

  const importar = async (evento) => {
    const arquivo = evento.target.files?.[0]
    evento.target.value = ''
    if (!arquivo) return
    setOcupado(true)
    setMensagem('')
    try {
      const resultado = await onImportar(arquivo)
      if (!resultado?.ok) throw new Error(resultado?.erro || 'Não foi possível importar o backup.')
      setFormulario(paraFormulario(criarProduto()))
      setAlterado(false)
      setTrocaPendente(null)
      setErros([])
      setMensagem(servidor ? 'Backup importado no servidor. Selecione um produto para conferir os dados.' : 'Backup importado neste navegador. Selecione um produto para conferir os dados.')
    } catch (erro) {
      mostrarErros([erro.message || 'Não foi possível importar. Confira se o arquivo é um backup JSON da Camada 3D.'])
    } finally {
      setOcupado(false)
    }
  }

  return (
    <section id="gestao-produtos" aria-labelledby="gestao-titulo" className="bg-gray-50 pb-12 pt-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-5">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-camada-teal-700">Microfábrica · desenvolvimento</span>
            <h2 id="gestao-titulo" className="mt-2 text-3xl font-bold text-camada-dark-900">Gestão de produtos</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">Prepare o catálogo, registre a origem dos modelos e confira os custos de produção.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {alterado && <button type="button" onClick={() => downloadJson(criarBackup([produtoAtual]), `rascunho-${Date.now()}.json`)} className={botaoSecundario}>Baixar rascunho atual</button>}
            <button type="button" onClick={exportar} disabled={ocupado} className={botaoSecundario}><Download size={16} aria-hidden="true" />Exportar backup</button>
            <button type="button" onClick={() => arquivoRef.current?.click()} disabled={ocupado || alterado} className={botaoSecundario}><Upload size={16} aria-hidden="true" />Importar backup</button>
            <input ref={arquivoRef} type="file" accept=".json,application/json" aria-label="Arquivo de backup JSON" className="hidden" onChange={importar} />
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-camada-teal-200 bg-camada-teal-50 p-4 text-sm leading-relaxed text-camada-dark-900">
          {servidor ? <><strong>Cadastro compartilhado no servidor.</strong> Salvar atualiza o catálogo para todos os administradores. O backup JSON exporta produtos, fichas e licenças; as contas e o histórico fazem parte do backup completo do banco.</> : <><strong>Dados apenas neste navegador.</strong> Exporte backups para preservar os cadastros.</>}
          <p className="mt-1">A importação atualiza produtos com o mesmo identificador e preserva os demais; exporte um backup antes. Salve as alterações do formulário para habilitar a importação.</p>
        </div>
        {erroPersistencia && <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{erroPersistencia}</div>}
        {mensagem && <div role="status" className="mb-6 rounded-xl border border-camada-teal-200 bg-white p-4 text-sm text-camada-teal-800">{mensagem}</div>}
        {erros.length > 0 && (
          <div ref={errosRef} role="alert" tabIndex={-1} className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 outline-none">
            <p className="flex items-center gap-2 font-semibold"><AlertCircle size={18} aria-hidden="true" />Revise antes de continuar</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">{erros.map(erro => <li key={erro}>{erro}</li>)}</ul>
          </div>
        )}
        {trocaPendente && (
          <div role="alert" className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            <p>Há alterações não salvas neste formulário. Continue editando para salvá-las ou descarte para abrir o outro cadastro.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => setTrocaPendente(null)} className={botaoSecundario}>Continuar editando</button>
              <button type="button" onClick={() => abrir(trocaPendente, true)} className={botaoSecundario}>Descartar alterações e abrir</button>
            </div>
          </div>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-gray-200 bg-white p-4" aria-label="Produtos cadastrados">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-camada-dark-900">Produtos <span className="font-normal text-gray-500">({produtos.length})</span></h3>
              <Package size={18} className="text-camada-teal-700" aria-hidden="true" />
            </div>
            <button type="button" onClick={() => abrir(criarProduto())} disabled={ocupado} className={`${botaoSecundario} mb-4 w-full`}><Plus size={16} aria-hidden="true" />Novo produto</button>
            <Campo rotulo="Buscar por nome ou SKU" value={busca} onChange={evento => setBusca(evento.target.value)} type="search" />
            <ul className="mt-4 max-h-[560px] space-y-2 overflow-y-auto">
              {visiveis.map(produto => (
                <li key={produto.id}>
                  <button type="button" disabled={ocupado} onClick={() => abrir(produto)} aria-pressed={produto.id === formulario.id} className={`w-full rounded-xl border p-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-camada-teal-600 ${produto.id === formulario.id ? 'border-camada-teal-500 bg-camada-teal-50' : 'border-gray-100 hover:border-gray-300'}`}>
                    <span className="block break-words text-sm font-semibold text-camada-dark-900">{produto.nome}</span>
                    <span className="mt-1 block text-xs text-gray-500">{produto.precoCentavos == null ? 'Preço pendente' : formatarMoeda(produto.precoCentavos)} · {produto.cores.length} cor(es)</span>
                    <span className={`mt-2 inline-block rounded px-2 py-0.5 text-xs ${produto.publicado ? 'bg-camada-teal-100 text-camada-teal-800' : 'bg-gray-100 text-gray-600'}`}>{produto.publicado ? 'No catálogo' : 'Rascunho'}</span>
                  </button>
                </li>
              ))}
            </ul>
            {visiveis.length === 0 && <p className="py-5 text-sm text-gray-500">{produtos.length ? 'Nenhum produto corresponde à busca.' : 'Seu primeiro produto começa no formulário ao lado.'}</p>}
          </aside>

          <form onSubmit={salvar} noValidate className="min-w-0 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-camada-dark-900">{existente ? 'Editar produto' : 'Novo produto'}</h3>
              <span className="text-xs text-gray-500">{alterado ? 'Alterações não salvas' : existente ? 'Cadastro salvo' : 'Ainda não salvo'}</span>
            </div>
            <fieldset disabled={ocupado} className="min-w-0 space-y-6">
              <Secao titulo="Produto e catálogo" descricao="Um preço de venda por produto, compartilhado entre todas as cores. Preencha o que já sabe e mantenha o restante como rascunho.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo rotulo="Nome do produto" value={formulario.nome} onChange={evento => campo('nome', evento.target.value)} autoComplete="off" />
                  <Campo rotulo="Categoria" value={formulario.categoriaId} onChange={evento => campo('categoriaId', evento.target.value)}>
                    <option value="">Selecione uma categoria</option>
                    {categorias.filter(categoria => categoria.id !== 'todos').map(categoria => <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>)}
                  </Campo>
                  <Campo rotulo="Preço de venda (R$)" inputMode="decimal" placeholder="Ex.: 39,90" value={formulario.precoCentavos} onChange={evento => campo('precoCentavos', evento.target.value)} />
                  <Campo rotulo="Exibição no catálogo" value={formulario.publicado ? 'publicado' : 'rascunho'} onChange={evento => campo('publicado', evento.target.value === 'publicado')} dica="Produtos publicados aparecem na vitrine. Rascunhos ficam somente na administração.">
                    <option value="rascunho">Rascunho</option>
                    <option value="publicado">Publicado no catálogo</option>
                  </Campo>
                  <Campo rotulo="Material do produto" placeholder="Ex.: PLA" value={formulario.material} onChange={evento => campo('material', evento.target.value)} />
                  <Campo rotulo="Medidas" placeholder="Ex.: 10 × 8 × 12 cm" value={formulario.medidas} onChange={evento => campo('medidas', evento.target.value)} />
                  <div className="sm:col-span-2"><Campo rotulo="Descrição" multiline rows={3} value={formulario.descricao} onChange={evento => campo('descricao', evento.target.value)} /></div>
                  <div className="sm:col-span-2"><Campo rotulo="Imagens" multiline rows={3} value={formulario.imagensTexto} onChange={evento => campo('imagensTexto', evento.target.value)} dica="Uma URL de imagem por linha. A primeira será a capa do produto." /></div>
                </div>
              </Secao>

              <Secao titulo="Cores, SKU e estoque" descricao="Cada cor tem SKU e quantidade próprios. O controle de movimentações, reservas e sincronização com a Shopee será implementado nas próximas etapas.">
                <div className="space-y-4">
                  {formulario.cores.map((item, indice) => (
                    <div key={item.id} className="rounded-xl border border-gray-200 p-3 sm:p-4">
                      <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold text-camada-dark-900">Cor {indice + 1}</h3><button type="button" className="rounded p-1 text-gray-500 hover:bg-red-50 hover:text-red-700" onClick={() => campo('cores', formulario.cores.filter((_, i) => i !== indice))} aria-label={`Remover cor ${indice + 1}`}><Trash2 size={17} aria-hidden="true" /></button></div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <Campo rotulo={`Nome da cor ${indice + 1}`} value={item.nome} onChange={evento => cor(indice, 'nome', evento.target.value)} placeholder="Ex.: Branco" />
                        <Campo rotulo={`SKU da cor ${indice + 1}`} value={item.sku} onChange={evento => cor(indice, 'sku', evento.target.value)} placeholder="Ex.: NATAL-01-BR" />
                        <Campo rotulo={`Estoque da cor ${indice + 1}`} inputMode="numeric" value={item.estoqueSite} onChange={evento => cor(indice, 'estoqueSite', evento.target.value)} dica="Quantidade inteira de unidades." />
                      </div>
                    </div>
                  ))}
                  <button type="button" className={botaoSecundario} onClick={() => campo('cores', [...formulario.cores, { id: novoId(), nome: '', sku: '', estoqueSite: '' }])}><Plus size={16} aria-hidden="true" />Adicionar cor</button>
                </div>
              </Secao>

              <Secao titulo="Ficha de impressão" descricao="Registre uma placa com unidades iguais deste produto. Consumo e tempo são da placa inteira; embalagem e outros custos são por unidade. Campos vazios ficam pendentes, sem presumir custo zero.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo rotulo="Tempo de impressão da placa (min)" inputMode="decimal" placeholder="Ex.: 180" value={formulario.ficha.tempoPlacaMinutos} onChange={evento => ficha('tempoPlacaMinutos', evento.target.value)} />
                  <Campo rotulo="Unidades por placa" inputMode="numeric" placeholder="Ex.: 4" value={formulario.ficha.unidadesPorPlaca} onChange={evento => ficha('unidadesPorPlaca', evento.target.value)} />
                </div>
                <div className="my-5 space-y-4">
                  {formulario.ficha.filamentos.map((item, indice) => (
                    <div key={indice} className="rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4">
                      <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold text-camada-dark-900">Filamento {indice + 1}</h3><button type="button" className="rounded p-1 text-gray-500 hover:bg-red-50 hover:text-red-700" onClick={() => ficha('filamentos', formulario.ficha.filamentos.filter((_, i) => i !== indice))} aria-label={`Remover filamento ${indice + 1}`}><Trash2 size={17} aria-hidden="true" /></button></div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Campo rotulo={`Material do filamento ${indice + 1}`} value={item.material} onChange={evento => filamento(indice, 'material', evento.target.value)} placeholder="Ex.: PLA" />
                        <Campo rotulo={`Cor do filamento ${indice + 1}`} value={item.cor} onChange={evento => filamento(indice, 'cor', evento.target.value)} placeholder="Ex.: Vermelho" />
                        <Campo rotulo={`Consumo do filamento ${indice + 1} por placa (g)`} inputMode="decimal" value={item.gramasPorPlaca} onChange={evento => filamento(indice, 'gramasPorPlaca', evento.target.value)} dica="Inclua suportes, purga e demais perdas da placa." />
                        <Campo rotulo={`Preço do filamento ${indice + 1} por kg (R$)`} inputMode="decimal" value={item.precoKgCentavos} onChange={evento => filamento(indice, 'precoKgCentavos', evento.target.value)} />
                      </div>
                    </div>
                  ))}
                  <button type="button" className={botaoSecundario} onClick={() => ficha('filamentos', [...formulario.ficha.filamentos, { material: '', cor: '', gramasPorPlaca: '', precoKgCentavos: '' }])}><Plus size={16} aria-hidden="true" />Adicionar filamento</button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo rotulo="Potência média (W)" inputMode="decimal" value={formulario.ficha.potenciaWatts} onChange={evento => ficha('potenciaWatts', evento.target.value)} dica="Use a potência média medida durante a impressão." />
                  <Campo rotulo="Tarifa de energia (R$/kWh)" inputMode="decimal" value={formulario.ficha.tarifaKwhCentavos} onChange={evento => ficha('tarifaKwhCentavos', evento.target.value)} />
                  <Campo rotulo="Embalagem por unidade (R$)" inputMode="decimal" value={formulario.ficha.embalagemCentavos} onChange={evento => ficha('embalagemCentavos', evento.target.value)} />
                  <Campo rotulo="Outros custos por unidade (R$)" inputMode="decimal" value={formulario.ficha.outrosCustosCentavos} onChange={evento => ficha('outrosCustosCentavos', evento.target.value)} dica="Informe 0,00 apenas quando confirmar que não há outros custos diretos." />
                  <Campo rotulo="Perfil de impressão" value={formulario.ficha.perfil} onChange={evento => ficha('perfil', evento.target.value)} placeholder="Impressora, bico, altura de camada, preenchimento…" />
                  <Campo rotulo="Referência do arquivo 3MF" value={formulario.ficha.arquivo3mf} onChange={evento => ficha('arquivo3mf', evento.target.value)} dica="Nome ou localização do arquivo. O arquivo não é enviado nem guardado pelo painel." />
                </div>
              </Secao>

              <Secao titulo="Origem e licença" descricao="Registre a origem do modelo e a autorização para vender impressões. Uma licença pendente ou proibida impede a publicação no catálogo.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo rotulo="Plataforma de origem" value={formulario.origem.plataforma} onChange={evento => origem('plataforma', evento.target.value)} placeholder="Ex.: MakerWorld ou criação própria" />
                  <Campo rotulo="Autor do modelo" value={formulario.origem.autor} onChange={evento => origem('autor', evento.target.value)} />
                  <div className="sm:col-span-2"><Campo rotulo="URL de origem" inputMode="url" value={formulario.origem.url} onChange={evento => origem('url', evento.target.value)} placeholder="https://…" /></div>
                  <Campo rotulo="Nome da licença" value={formulario.origem.licenca} onChange={evento => origem('licenca', evento.target.value)} />
                  <Campo rotulo="Permissão de uso comercial" value={formulario.origem.usoComercial} onChange={evento => origem('usoComercial', evento.target.value)}>
                    <option value="pendente">Pendente de verificação</option>
                    <option value="permitido">Permitido, com evidência</option>
                    <option value="proibido">Proibido</option>
                  </Campo>
                  <div className="sm:col-span-2"><Campo rotulo="Evidência da autorização" multiline rows={3} value={formulario.origem.evidencia} onChange={evento => origem('evidencia', evento.target.value)} dica="Registre link, data e termos ou referência do comprovante da permissão comercial." /></div>
                </div>
              </Secao>
            </fieldset>

            <section aria-labelledby="resumo-custos" className="rounded-2xl border border-camada-teal-200 bg-white p-4 sm:p-6">
              <h3 id="resumo-custos" className="text-lg font-semibold text-camada-dark-900">Estimativa por unidade</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">Calculada com os valores deste formulário, inclusive antes de salvar. O resultado é anterior a taxas de marketplace, descontos, frete, tributos e despesas fixas.</p>
              <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Valor rotulo="Filamento" valor={custos.filamentoCentavos} />
                <Valor rotulo="Energia" valor={custos.energiaCentavos} />
                <Valor rotulo="Embalagem" valor={custos.embalagemCentavos} />
                <Valor rotulo="Outros custos diretos" valor={custos.outrosCustosCentavos} />
                <Valor rotulo="Custo direto total" valor={custos.totalCentavos} destaque />
                <Valor rotulo="Resultado estimado" valor={custos.lucroCentavos} destaque />
                <Valor rotulo="Resultado por hora de máquina" valor={custos.lucroHoraCentavos} destaque />
                <div className="rounded-xl bg-gray-50 p-3 text-camada-dark-900"><dt className="text-xs text-gray-600">Margem antes de taxas e despesas</dt><dd className="mt-1 text-xl font-semibold">{custos.margemPercentual == null ? 'Pendente' : `${custos.margemPercentual.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`}</dd></div>
              </dl>
              {custos.tempoUnidadeMinutos != null && <p className="mt-3 text-xs text-gray-500">Tempo de máquina por unidade: {custos.tempoUnidadeMinutos.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} min.</p>}
              {(custos.pendencias.length > 0 || errosNumericos.length > 0) && (
                <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-semibold">Pendências da estimativa</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">{[...new Set([...errosNumericos, ...custos.pendencias])].map(pendencia => <li key={pendencia}>{pendencia}</li>)}</ul>
                </div>
              )}
            </section>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4">
              <p className="max-w-lg text-xs leading-relaxed text-gray-500">{servidor ? 'Salvar grava no banco e registra o responsável pela alteração.' : 'Salvar mantém o cadastro neste navegador.'} Os testes de aceite continuam pendentes.</p>
              {alterado && <button type="button" className={botaoSecundario} onClick={() => abrir(produtos.find(p => p.id === formulario.id) || criarProduto(), true)}>Descartar alterações</button>}
              <button type="submit" disabled={ocupado} className="inline-flex items-center justify-center gap-2 rounded-lg bg-camada-teal-700 px-5 py-3 font-semibold text-white hover:bg-camada-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-camada-teal-600 disabled:opacity-50"><Save size={18} aria-hidden="true" />{ocupado ? 'Processando…' : 'Salvar produto'}</button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
