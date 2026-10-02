export const categorias = [
  { id: 'natal', nome: 'Natal' },
  { id: 'decoracao', nome: 'Decoração' },
  { id: 'acessorios', nome: 'Acessórios' },
  { id: 'organizacao', nome: 'Organização' },
  { id: 'maker', nome: 'Maker' },
  { id: 'gaming', nome: 'Gaming' },
]

export function normalizarTexto(valor = '') {
  return String(valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
}

const temTexto = (valor) => typeof valor === 'string' && valor.trim().length > 0
const numeroValido = (valor) => typeof valor === 'number' && Number.isFinite(valor) && valor >= 0
const centavosValidos = (valor) => numeroValido(valor) && Number.isSafeInteger(valor)
const inteiroPositivo = (valor) => Number.isSafeInteger(valor) && valor > 0
const registro = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor)
const arredondarCentavos = (valor) => Number.isFinite(valor) && Number.isSafeInteger(Math.round(valor)) ? Math.round(valor) : null

function urlHttp(valor) {
  if (!temTexto(valor)) return false
  try {
    return ['http:', 'https:'].includes(new URL(valor).protocol)
  } catch {
    return false
  }
}

export function criarProduto() {
  return {
    id: globalThis.crypto.randomUUID(),
    nome: '',
    descricao: '',
    categoriaId: '',
    precoCentavos: null,
    material: '',
    medidas: '',
    imagens: [],
    publicado: false,
    cores: [],
    ficha: {
      tempoPlacaMinutos: null,
      unidadesPorPlaca: null,
      filamentos: [],
      potenciaWatts: null,
      tarifaKwhCentavos: null,
      embalagemCentavos: null,
      outrosCustosCentavos: null,
      perfil: '',
      arquivo3mf: '',
    },
    origem: {
      plataforma: '',
      url: '',
      autor: '',
      licenca: '',
      usoComercial: 'pendente',
      evidencia: '',
    },
  }
}

// Valores numéricos são reais. Textos aceitam o formato brasileiro e decimal com ponto.
export function parseMoeda(valor) {
  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? arredondarCentavos(valor * 100) : null
  }
  if (typeof valor !== 'string') return null
  let texto = valor.trim().replace(/^R\$\s*/, '').trim()
  if (!texto) return null
  if (/^-?(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(texto)) {
    texto = texto.replace(/\./g, '').replace(',', '.')
  } else if (!/^-?\d+\.\d{1,2}$/.test(texto)) {
    return null
  }
  return arredondarCentavos(Number(texto) * 100)
}

export function formatarMoeda(centavos) {
  if (typeof centavos !== 'number' || !Number.isFinite(centavos)) return 'Pendente'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(centavos / 100)
}

export function validarProduto(produto, todos = []) {
  if (!registro(produto)) return ['Produto inválido.']
  const erros = []
  const verificarNumero = (valor, nome, { inteiro = false, positivo = false } = {}) => {
    if (valor === null || valor === undefined) return
    if (!numeroValido(valor) || (inteiro && !Number.isSafeInteger(valor)) || (positivo && valor === 0)) {
      erros.push(`${nome} deve ser ${inteiro ? 'um inteiro' : 'um número finito'} ${positivo ? 'maior que zero' : 'maior ou igual a zero'}.`)
    }
  }
  if (!temTexto(produto.id)) erros.push('O produto precisa de um identificador.')
  if (!temTexto(produto.nome)) erros.push('Informe o nome do produto.')
  if (!categorias.some((categoria) => categoria.id === produto.categoriaId)) erros.push('Selecione uma categoria válida.')
  if (typeof produto.publicado !== 'boolean') erros.push('A publicação deve ser informada como verdadeiro ou falso.')
  verificarNumero(produto.precoCentavos, 'Preço em centavos', { inteiro: true })

  for (const campo of ['descricao', 'material', 'medidas']) {
    if (typeof produto[campo] !== 'string') erros.push(`O campo ${campo} deve ser um texto.`)
  }
  if (!Array.isArray(produto.imagens) || produto.imagens.some((imagem) => !temTexto(imagem))) {
    erros.push('As imagens devem ser uma lista de endereços ou arquivos preenchidos.')
  }

  if (!Array.isArray(produto.cores)) {
    erros.push('As cores devem ser uma lista.')
  } else {
    const ids = new Set()
    const nomes = new Set()
    const skus = new Set()
    const skusCatalogo = new Set((Array.isArray(todos) ? todos : [])
      .filter((outro) => registro(outro) && outro.id !== produto.id)
      .flatMap((outro) => Array.isArray(outro.cores) ? outro.cores : [])
      .filter(registro)
      .map((cor) => normalizarTexto(cor.sku))
      .filter(Boolean))
    produto.cores.forEach((cor, indice) => {
      const rotulo = `Cor ${indice + 1}`
      if (!registro(cor)) {
        erros.push(`${rotulo} inválida.`)
        return
      }
      if (!temTexto(cor.id)) erros.push(`${rotulo}: informe um identificador.`)
      else if (ids.has(cor.id)) erros.push(`${rotulo}: identificador repetido.`)
      ids.add(cor.id)
      for (const [campo, conjunto, nome] of [['nome', nomes, 'nome'], ['sku', skus, 'SKU']]) {
        if (typeof cor[campo] !== 'string') erros.push(`${rotulo}: ${nome} deve ser um texto.`)
        const chave = normalizarTexto(cor[campo])
        if (produto.publicado && !chave) erros.push(`${rotulo}: informe ${nome} antes de publicar.`)
        if (!chave) continue
        if (conjunto.has(chave) || (campo === 'sku' && skusCatalogo.has(chave))) erros.push(`${rotulo}: ${nome} duplicado${campo === 'sku' ? ' no catálogo' : ' no produto'}.`)
        conjunto.add(chave)
      }
      if (!centavosValidos(cor.estoqueSite)) erros.push(`${rotulo}: estoque deve ser um inteiro maior ou igual a zero.`)
      if (cor.imagem !== undefined && (typeof cor.imagem !== 'string' || (cor.imagem && !urlHttp(cor.imagem) && !(cor.imagem.startsWith('/') && !cor.imagem.startsWith('//') && !cor.imagem.includes('\\'))))) erros.push(`${rotulo}: imagem deve ser uma URL HTTP(S) ou caminho local válido.`)
    })
  }

  if (!registro(produto.ficha)) {
    erros.push('Informe uma ficha técnica válida.')
  } else {
    const ficha = produto.ficha
    verificarNumero(ficha.tempoPlacaMinutos, 'Tempo da placa', { positivo: true })
    verificarNumero(ficha.unidadesPorPlaca, 'Unidades por placa', { inteiro: true, positivo: true })
    verificarNumero(ficha.potenciaWatts, 'Potência em watts')
    for (const [campo, nome] of [['tarifaKwhCentavos', 'Tarifa de energia em centavos'], ['embalagemCentavos', 'Embalagem em centavos'], ['outrosCustosCentavos', 'Outros custos em centavos']]) {
      verificarNumero(ficha[campo], nome, { inteiro: true })
    }
    for (const campo of ['perfil', 'arquivo3mf']) {
      if (typeof ficha[campo] !== 'string') erros.push(`O campo ${campo} deve ser um texto.`)
    }
    if (!Array.isArray(ficha.filamentos)) {
      erros.push('Os filamentos devem ser uma lista.')
    } else {
      ficha.filamentos.forEach((filamento, indice) => {
        if (!registro(filamento)) {
          erros.push(`Filamento ${indice + 1} inválido.`)
          return
        }
        for (const campo of ['material', 'cor']) {
          if (typeof filamento[campo] !== 'string') erros.push(`Filamento ${indice + 1}: ${campo} deve ser um texto.`)
        }
        verificarNumero(filamento.gramasPorPlaca, `Filamento ${indice + 1}: gramas por placa`)
        verificarNumero(filamento.precoKgCentavos, `Filamento ${indice + 1}: preço por kg em centavos`, { inteiro: true })
      })
    }
  }

  if (!registro(produto.origem)) {
    erros.push('Informe uma origem válida para o modelo.')
  } else {
    const origem = produto.origem
    if (!['pendente', 'permitido', 'proibido'].includes(origem.usoComercial)) erros.push('Selecione uma situação válida para o uso comercial.')
    for (const campo of ['plataforma', 'url', 'autor', 'licenca', 'evidencia']) {
      if (typeof origem[campo] !== 'string') erros.push(`Origem: ${campo} deve ser um texto.`)
    }
    if (temTexto(origem.url) && !urlHttp(origem.url)) erros.push('O endereço de origem deve começar com http:// ou https:// e ser válido.')
    if (produto.publicado) {
      for (const [campo, nome] of [['plataforma', 'a plataforma de origem'], ['autor', 'o autor'], ['licenca', 'a licença'], ['evidencia', 'a evidência da autorização comercial']]) {
        if (!temTexto(origem[campo])) erros.push(`Informe ${nome} antes de publicar.`)
      }
      const autoral = ['autoral', 'proprio', 'propria', 'criacao propria'].includes(normalizarTexto(origem.plataforma))
      if (!autoral && !urlHttp(origem.url)) erros.push('Informe o link de origem do modelo antes de publicar.')
      if (origem.usoComercial !== 'permitido') erros.push('O uso comercial precisa estar permitido e comprovado antes de publicar.')
    }
  }

  if (produto.publicado) {
    if (!Array.isArray(produto.cores) || produto.cores.length === 0) erros.push('Adicione pelo menos uma cor com SKU e estoque antes de publicar.')
    for (const [campo, nome] of [['descricao', 'a descrição'], ['material', 'o material'], ['medidas', 'as medidas']]) {
      if (!temTexto(produto[campo])) erros.push(`Informe ${nome} antes de publicar.`)
    }
    if (!centavosValidos(produto.precoCentavos) || produto.precoCentavos === 0) erros.push('Informe um preço de venda maior que zero antes de publicar.')
    if (!Array.isArray(produto.imagens) || !produto.imagens.some(temTexto)) erros.push('Adicione pelo menos uma foto antes de publicar.')
  }
  return [...new Set(erros)]
}

export function calcularCustos(produto) {
  const ficha = registro(produto?.ficha) ? produto.ficha : {}
  const pendencias = []
  const unidades = inteiroPositivo(ficha.unidadesPorPlaca) ? ficha.unidadesPorPlaca : null
  const tempo = numeroValido(ficha.tempoPlacaMinutos) && ficha.tempoPlacaMinutos > 0 ? ficha.tempoPlacaMinutos : null
  if (unidades === null) pendencias.push('Informe quantas unidades são produzidas por placa.')
  if (tempo === null) pendencias.push('Informe o tempo de impressão da placa em minutos.')
  const tempoUnidadeMinutos = unidades !== null && tempo !== null ? tempo / unidades : null

  const filamentos = Array.isArray(ficha.filamentos) ? ficha.filamentos : []
  let filamentosCompletos = filamentos.length > 0
  let filamentoPlacaCentavos = 0
  if (!filamentosCompletos) pendencias.push('Adicione os filamentos usados na placa.')
  filamentos.forEach((filamento, indice) => {
    for (const [campo, nome] of [['material', 'o material'], ['cor', 'a cor']]) {
      if (!temTexto(filamento?.[campo])) {
        pendencias.push(`Informe ${nome} do filamento ${indice + 1}.`)
        filamentosCompletos = false
      }
    }
    if (!numeroValido(filamento?.gramasPorPlaca)) {
      pendencias.push(`Informe as gramas por placa do filamento ${indice + 1}.`)
      filamentosCompletos = false
    }
    if (!centavosValidos(filamento?.precoKgCentavos)) {
      pendencias.push(`Informe o preço por kg do filamento ${indice + 1}.`)
      filamentosCompletos = false
    }
    if (numeroValido(filamento?.gramasPorPlaca) && centavosValidos(filamento?.precoKgCentavos)) {
      filamentoPlacaCentavos += filamento.gramasPorPlaca / 1000 * filamento.precoKgCentavos
    }
  })
  const filamentoCentavos = filamentosCompletos && unidades !== null ? arredondarCentavos(filamentoPlacaCentavos / unidades) : null

  const potencia = numeroValido(ficha.potenciaWatts) ? ficha.potenciaWatts : null
  const tarifa = centavosValidos(ficha.tarifaKwhCentavos) ? ficha.tarifaKwhCentavos : null
  if (potencia === null) pendencias.push('Informe a potência média da impressora em watts.')
  if (tarifa === null) pendencias.push('Informe o custo do kWh.')
  const energiaCentavos = potencia !== null && tarifa !== null && tempoUnidadeMinutos !== null
    ? arredondarCentavos(potencia / 1000 * tempoUnidadeMinutos / 60 * tarifa) : null
  const embalagemCentavos = centavosValidos(ficha.embalagemCentavos) ? ficha.embalagemCentavos : null
  const outrosCustosCentavos = centavosValidos(ficha.outrosCustosCentavos) ? ficha.outrosCustosCentavos : null
  if (embalagemCentavos === null) pendencias.push('Informe o custo de embalagem por unidade; use zero se não houver.')
  if (outrosCustosCentavos === null) pendencias.push('Informe os outros custos por unidade; use zero se não houver.')

  const componentes = [filamentoCentavos, energiaCentavos, embalagemCentavos, outrosCustosCentavos]
  const totalCentavos = componentes.every((valor) => valor !== null) ? arredondarCentavos(componentes.reduce((total, valor) => total + valor, 0)) : null
  const preco = centavosValidos(produto?.precoCentavos) ? produto.precoCentavos : null
  if (preco === null) pendencias.push('Informe o preço de venda para calcular lucro e margem.')
  else if (preco === 0) pendencias.push('O preço de venda deve ser maior que zero para calcular a margem.')
  const lucroCentavos = totalCentavos !== null && preco !== null ? arredondarCentavos(preco - totalCentavos) : null
  const margemPercentual = lucroCentavos !== null && preco > 0 ? lucroCentavos / preco * 100 : null
  const lucroHoraCentavos = lucroCentavos !== null && tempoUnidadeMinutos !== null ? arredondarCentavos(lucroCentavos / tempoUnidadeMinutos * 60) : null
  if (filamentosCompletos && unidades !== null && filamentoCentavos === null) pendencias.push('O custo de filamento ultrapassa o limite numérico suportado.')
  if (potencia !== null && tarifa !== null && tempoUnidadeMinutos !== null && energiaCentavos === null) pendencias.push('O custo de energia ultrapassa o limite numérico suportado.')
  if (componentes.every((valor) => valor !== null) && totalCentavos === null) pendencias.push('O custo total ultrapassa o limite numérico suportado.')

  return { pendencias, filamentoCentavos, energiaCentavos, embalagemCentavos, outrosCustosCentavos, totalCentavos, lucroCentavos, margemPercentual, lucroHoraCentavos, tempoUnidadeMinutos }
}

// Exportação explícita: novos campos internos nunca entram automaticamente no catálogo.
export function toProdutoPublico(produto) {
  return {
    id: produto.id,
    nome: produto.nome,
    descricao: produto.descricao,
    categoriaId: produto.categoriaId,
    precoCentavos: produto.precoCentavos,
    material: produto.material,
    medidas: produto.medidas,
    producao: {
      tempoPlacaMinutos: produto.ficha?.tempoPlacaMinutos ?? null,
      unidadesPorPlaca: produto.ficha?.unidadesPorPlaca ?? null,
    },
    imagens: [...produto.imagens],
    cores: produto.cores.map(({ id, sku, nome, estoqueSite, imagem }) => ({ id, sku, nome, estoqueSite, ...(imagem ? { imagem } : {}) })),
  }
}
