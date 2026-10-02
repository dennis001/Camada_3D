import test from 'node:test'
import assert from 'node:assert/strict'
import { criarProduto, validarProduto, calcularCustos, parseMoeda, formatarMoeda, normalizarTexto, toProdutoPublico } from '../src/lib/produtos.js'

function produtoCompleto() {
  return {
    ...criarProduto(),
    nome: 'Enfeite de Natal',
    categoriaId: 'natal',
    descricao: 'Enfeite de teste',
    material: 'PLA',
    medidas: '5 × 5 × 1 cm',
    precoCentavos: 2000,
    imagens: ['/foto-enfeite.jpg'],
    cores: [{ id: 'cor-verde', sku: 'NAT-VERDE', nome: 'Verde', estoqueSite: 3 }],
    ficha: {
      tempoPlacaMinutos: 120,
      unidadesPorPlaca: 4,
      filamentos: [
        { material: 'PLA', cor: 'Verde', gramasPorPlaca: 100, precoKgCentavos: 10000 },
        { material: 'PLA', cor: 'Branco', gramasPorPlaca: 50, precoKgCentavos: 12000 },
      ],
      potenciaWatts: 200,
      tarifaKwhCentavos: 100,
      embalagemCentavos: 150,
      outrosCustosCentavos: 40,
      perfil: 'Perfil de teste',
      arquivo3mf: 'enfeite.3mf',
    },
    origem: { plataforma: 'MakerWorld', url: 'https://makerworld.com/modelo-teste', autor: 'Autor de teste', licenca: 'Autorização de teste', usoComercial: 'permitido', evidencia: 'comprovante-de-teste.pdf' },
  }
}

test('rascunho nasce sem dados comerciais inventados e com identificador único', () => {
  const primeiro = criarProduto()
  const segundo = criarProduto()
  assert.notEqual(primeiro.id, segundo.id)
  assert.equal(primeiro.publicado, false)
  assert.equal(primeiro.precoCentavos, null)
  assert.equal(primeiro.ficha.tempoPlacaMinutos, null)
  assert.deepEqual(primeiro.cores, [])
  assert.deepEqual(primeiro.ficha.filamentos, [])
  assert.equal(primeiro.origem.usoComercial, 'pendente')
  assert.equal(validarProduto(primeiro).length, 2)
  primeiro.nome = 'Rascunho'
  primeiro.categoriaId = 'natal'
  assert.deepEqual(validarProduto(primeiro), [])
})

test('moeda brasileira preserva centavos, milhares e ausência', () => {
  assert.equal(parseMoeda('R$ 1.234,56'), 123456)
  assert.equal(parseMoeda('1.234.567,89'), 123456789)
  assert.equal(parseMoeda('1.234'), 123400)
  assert.equal(parseMoeda('12,5'), 1250)
  assert.equal(parseMoeda('12.50'), 1250)
  assert.equal(parseMoeda(12.5), 1250)
  assert.equal(parseMoeda('0'), 0)
  assert.equal(parseMoeda('-12,50'), -1250)
  for (const valor of ['', ' ', null, undefined, NaN, Infinity, true, 'abc', '1,234.56', '1.2.34', '1,234']) assert.equal(parseMoeda(valor), null)
  assert.equal(formatarMoeda(null), 'Pendente')
  assert.match(formatarMoeda(123456), /1\.234,56/)
})

test('normalização remove acentos, caixa e espaços nas bordas', () => {
  assert.equal(normalizarTexto('  Organização  '), 'organizacao')
  assert.equal(normalizarTexto(null), '')
})

test('custos rateiam múltiplos filamentos e energia pela placa, embalagem e outros por unidade', () => {
  const resultado = calcularCustos(produtoCompleto())
  assert.deepEqual(resultado, {
    pendencias: [],
    filamentoCentavos: 400,
    energiaCentavos: 10,
    embalagemCentavos: 150,
    outrosCustosCentavos: 40,
    totalCentavos: 600,
    lucroCentavos: 1400,
    margemPercentual: 70,
    lucroHoraCentavos: 2800,
    tempoUnidadeMinutos: 30,
  })
})

test('custos arredondam por componente após somar filamentos e ratear a placa', () => {
  const produto = produtoCompleto()
  produto.ficha.unidadesPorPlaca = 3
  produto.ficha.filamentos = [
    { material: 'PLA', cor: 'A', gramasPorPlaca: 1, precoKgCentavos: 1400 },
    { material: 'PLA', cor: 'B', gramasPorPlaca: 1, precoKgCentavos: 1400 },
  ]
  const resultado = calcularCustos(produto)
  assert.equal(resultado.filamentoCentavos, 1)
  assert.equal(resultado.energiaCentavos, 13)
  assert.equal(resultado.totalCentavos, 204)
})

test('dados faltantes não se tornam zero nem um total parcial', () => {
  const produto = produtoCompleto()
  produto.ficha.filamentos[1].precoKgCentavos = null
  produto.ficha.embalagemCentavos = null
  const resultado = calcularCustos(produto)
  assert.equal(resultado.filamentoCentavos, null)
  assert.equal(resultado.energiaCentavos, 10)
  assert.equal(resultado.embalagemCentavos, null)
  assert.equal(resultado.totalCentavos, null)
  assert.equal(resultado.lucroCentavos, null)
  assert.equal(resultado.margemPercentual, null)
  assert.equal(resultado.lucroHoraCentavos, null)
  assert.ok(resultado.pendencias.some((texto) => texto.includes('filamento 2')))
  assert.ok(resultado.pendencias.some((texto) => texto.includes('embalagem')))
})

test('ausência de preço impede apenas lucro, margem e lucro por hora', () => {
  const produto = produtoCompleto()
  produto.precoCentavos = null
  const resultado = calcularCustos(produto)
  assert.equal(resultado.totalCentavos, 600)
  assert.equal(resultado.lucroCentavos, null)
  assert.equal(resultado.margemPercentual, null)
  assert.equal(resultado.lucroHoraCentavos, null)
  assert.equal(resultado.pendencias.length, 1)
})

test('filamento sem material ou cor mantém custo e lucro pendentes', () => {
  for (const campo of ['material', 'cor']) {
    const produto = produtoCompleto()
    produto.ficha.filamentos[1][campo] = ' '
    const resultado = calcularCustos(produto)
    assert.equal(resultado.filamentoCentavos, null)
    assert.equal(resultado.totalCentavos, null)
    assert.equal(resultado.lucroCentavos, null)
    assert.ok(resultado.pendencias.some((texto) => texto.includes(campo) && texto.includes('filamento 2')))
  }
})

test('zero informado é custo válido e prejuízo mantém o sinal', () => {
  const produto = produtoCompleto()
  produto.precoCentavos = 100
  produto.ficha.embalagemCentavos = 0
  produto.ficha.outrosCustosCentavos = 0
  produto.ficha.potenciaWatts = 0
  let resultado = calcularCustos(produto)
  assert.equal(resultado.totalCentavos, 400)
  assert.equal(resultado.lucroCentavos, -300)
  assert.equal(resultado.margemPercentual, -300)
  assert.equal(resultado.lucroHoraCentavos, -600)
  produto.precoCentavos = 0
  resultado = calcularCustos(produto)
  assert.equal(resultado.lucroCentavos, -400)
  assert.equal(resultado.margemPercentual, null)
})

test('placa e tempo inválidos não geram divisão por zero ou valores infinitos', () => {
  for (const valor of [0, -1, Infinity, NaN, null]) {
    const produto = produtoCompleto()
    produto.ficha.unidadesPorPlaca = valor
    const resultado = calcularCustos(produto)
    assert.equal(resultado.totalCentavos, null)
    assert.equal(resultado.tempoUnidadeMinutos, null)
    assert.equal(resultado.lucroHoraCentavos, null)
  }
  const produto = produtoCompleto()
  produto.ficha.tempoPlacaMinutos = 0
  assert.equal(calcularCustos(produto).energiaCentavos, null)
})

test('validação rejeita negativos, valores não finitos, estoque fracionado e categoria por nome', () => {
  const produto = produtoCompleto()
  produto.precoCentavos = -1
  produto.categoriaId = 'Decoração'
  produto.ficha.filamentos[0].gramasPorPlaca = -1
  produto.ficha.potenciaWatts = Infinity
  produto.ficha.unidadesPorPlaca = 1.5
  produto.cores[0].estoqueSite = 1.5
  const erros = validarProduto(produto)
  assert.ok(erros.some((texto) => texto.includes('Preço')))
  assert.ok(erros.some((texto) => texto.includes('categoria')))
  assert.ok(erros.some((texto) => texto.includes('gramas')))
  assert.ok(erros.some((texto) => texto.includes('Potência')))
  assert.ok(erros.some((texto) => texto.includes('Unidades')))
  assert.ok(erros.some((texto) => texto.includes('estoque')))
})

test('SKU é único no catálogo e nomes de cores são únicos dentro do produto', () => {
  const primeiro = produtoCompleto()
  const segundo = produtoCompleto()
  segundo.cores[0].sku = ' nat-verde '
  assert.ok(validarProduto(segundo, [primeiro]).some((texto) => texto.includes('SKU duplicado')))
  assert.deepEqual(validarProduto(primeiro, [primeiro]), [])
  segundo.cores[0].sku = 'OUTRO-SKU'
  assert.deepEqual(validarProduto(segundo, [primeiro]), [])
  segundo.cores.push({ id: 'segunda-cor', sku: 'OUTRO-SKU-2', nome: 'VÉRDE', estoqueSite: 0 })
  assert.ok(validarProduto(segundo).some((texto) => texto.includes('nome duplicado')))
})

test('publicação exige ficha pública e comprovação da licença comercial', () => {
  const produto = produtoCompleto()
  produto.publicado = true
  assert.deepEqual(validarProduto(produto), [])
  produto.origem.usoComercial = 'pendente'
  produto.origem.evidencia = ''
  produto.imagens = []
  produto.precoCentavos = null
  const erros = validarProduto(produto)
  assert.ok(erros.some((texto) => texto.includes('uso comercial')))
  assert.ok(erros.some((texto) => texto.includes('evidência')))
  assert.ok(erros.some((texto) => texto.includes('foto')))
  assert.ok(erros.some((texto) => texto.includes('preço de venda')))
})

test('criação autoral aceita comprovante próprio sem exigir uma URL externa', () => {
  const produto = produtoCompleto()
  produto.publicado = true
  produto.origem.plataforma = 'Autoral'
  produto.origem.url = ''
  assert.deepEqual(validarProduto(produto), [])
  produto.origem.plataforma = 'MakerWorld'
  assert.ok(validarProduto(produto).some((texto) => texto.includes('link de origem')))
  produto.origem.url = 'javascript:alert(1)'
  assert.ok(validarProduto(produto).some((texto) => texto.includes('http://')))
})

test('produto publicado precisa de ao menos uma cor com SKU e estoque', () => {
  const produto = produtoCompleto()
  produto.publicado = true
  produto.cores = []
  assert.ok(validarProduto(produto).some((texto) => texto.includes('pelo menos uma cor')))
  produto.publicado = false
  assert.deepEqual(validarProduto(produto), [])
})

test('validação retorna erros em dados importados malformados em vez de lançar exceções', () => {
  assert.deepEqual(validarProduto(null), ['Produto inválido.'])
  const produto = produtoCompleto()
  produto.cores = [null]
  produto.ficha.filamentos = [null]
  produto.origem = null
  produto.imagens = null
  assert.ok(validarProduto(produto).length >= 4)
})

test('rascunhos importados precisam preservar campos textuais do contrato, mesmo vazios', () => {
  const produto = produtoCompleto()
  for (const campo of ['descricao', 'material', 'medidas']) delete produto[campo]
  for (const campo of ['perfil', 'arquivo3mf']) delete produto.ficha[campo]
  const erros = validarProduto(produto)
  for (const campo of ['descricao', 'material', 'medidas', 'perfil', 'arquivo3mf']) assert.ok(erros.some((texto) => texto.includes(campo)))
  for (const campo of ['descricao', 'material', 'medidas']) produto[campo] = ''
  for (const campo of ['perfil', 'arquivo3mf']) produto.ficha[campo] = ''
  assert.deepEqual(validarProduto(produto), [])
})

test('projeção pública exclui custos, licença, documentos e futuros campos internos', () => {
  const produto = produtoCompleto()
  produto.segredoInterno = 'não publicar'
  produto.cores[0].custoInternoCentavos = 999
  const publico = toProdutoPublico(produto)
  assert.deepEqual(Object.keys(publico).sort(), ['id', 'nome', 'descricao', 'categoriaId', 'precoCentavos', 'material', 'medidas', 'imagens', 'cores'].sort())
  assert.deepEqual(Object.keys(publico.cores[0]).sort(), ['id', 'sku', 'nome', 'estoqueSite'].sort())
  assert.equal(publico.precoCentavos, 2000)
  publico.imagens.push('/outra-foto.jpg')
  publico.cores[0].nome = 'Outra'
  assert.equal(produto.imagens.length, 1)
  assert.equal(produto.cores[0].nome, 'Verde')
})
