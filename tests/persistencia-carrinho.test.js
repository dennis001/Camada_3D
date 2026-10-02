import test from 'node:test'
import assert from 'node:assert/strict'
import { criarProduto } from '../src/lib/produtos.js'
import { criarBackup, lerBackup, carregarProdutos, salvarProdutos, mesclarProdutos, CHAVE_PRODUTOS } from '../src/lib/persistencia.js'
import { alterarQuantidade, detalharCarrinho, validarCarrinho } from '../src/lib/carrinho.js'

function rascunho(nome = 'Ensaio') { return { ...criarProduto(), nome, categoriaId: 'natal' } }
function memoria() {
  const valores = new Map()
  return { getItem: chave => valores.get(chave) ?? null, setItem: (chave, valor) => valores.set(chave, valor) }
}

test('backup preserva centavos, IDs, origem e campos pendentes após recarga', () => {
  const storage = memoria()
  const produto = rascunho()
  produto.precoCentavos = 129990
  const versao = salvarProdutos(storage, [produto], null)
  assert.deepEqual(carregarProdutos(storage), { produtos: [produto], versao, erro: '' })
  assert.deepEqual(lerBackup(criarBackup([produto])), [produto])
})

test('JSON inválido, versão desconhecida e catálogo inválido não substituem cadastro', () => {
  const storage = memoria()
  const versao = salvarProdutos(storage, [rascunho()], null)
  assert.throws(() => lerBackup('{quebrado'), /inválido/)
  assert.throws(() => lerBackup('{"aplicativo":"studio-camadas","versao":2}'), /versão/)
  assert.throws(() => salvarProdutos(storage, [{ id: 'a' }], versao))
  assert.equal(storage.getItem(CHAVE_PRODUTOS), versao)
})

test('cadastro corrompido é preservado e retorna erro recuperável', () => {
  const storage = memoria()
  storage.setItem(CHAVE_PRODUTOS, 'corrompido')
  const resultado = carregarProdutos(storage)
  assert.equal(resultado.versao, 'corrompido')
  assert.ok(resultado.erro)
  assert.equal(storage.getItem(CHAVE_PRODUTOS), 'corrompido')
})

test('falha de escrita e alteração em outra aba não são reportadas como sucesso', () => {
  const storage = memoria()
  const versao = salvarProdutos(storage, [rascunho('Primeiro')], null)
  salvarProdutos(storage, [rascunho('Outra aba')], versao)
  assert.throws(() => salvarProdutos(storage, [rascunho('Aba antiga')], versao), /outra aba/)
  assert.equal(carregarProdutos(storage).produtos[0].nome, 'Outra aba')
  assert.throws(() => salvarProdutos({ getItem: () => null, setItem: () => { throw new Error('Sem espaço') } }, [rascunho()], null), /Sem espaço/)
})

test('importação mescla por ID, preserva demais produtos e rejeita SKU duplicado', () => {
  const primeiro = rascunho('Primeiro')
  const segundo = rascunho('Segundo')
  const editado = { ...primeiro, nome: 'Editado' }
  assert.deepEqual(mesclarProdutos([primeiro, segundo], [editado]), [editado, segundo])
  primeiro.cores = [{ id: 'verde', nome: 'Verde', sku: 'NAT-01', estoqueSite: 1 }]
  segundo.cores = [{ id: 'preto', nome: 'Preto', sku: 'nat-01', estoqueSite: 1 }]
  assert.throws(() => mesclarProdutos([primeiro], [segundo]), /duplicado/)
})

const produtos = [{ id: 'p', nome: 'Peça', precoCentavos: 129990, cores: [{ id: 'v', nome: 'Verde', sku: 'P-V', estoqueSite: 3 }, { id: 'b', nome: 'Branco', sku: 'P-B', estoqueSite: 1 }] }]

test('carrinho mantém cores distintas e total com centavos precisos', () => {
  let itens = alterarQuantidade([], produtos, 'p', 'v', 2)
  itens = alterarQuantidade(itens, produtos, 'p', 'b', 1)
  const detalhe = detalharCarrinho(itens, produtos)
  assert.equal(detalhe.length, 2)
  assert.equal(detalhe.reduce((soma, item) => soma + item.quantidade * item.precoCentavos, 0), 389970)
  assert.deepEqual(validarCarrinho(JSON.parse(JSON.stringify(itens))), itens)
})

test('carrinho impede quantidade inválida, cor inexistente e estoque excedido', () => {
  for (const quantidade of [0, -1, 1.5, NaN, Infinity, '2', 4]) assert.throws(() => alterarQuantidade([], produtos, 'p', 'v', quantidade))
  assert.throws(() => alterarQuantidade([], produtos, 'p', 'inexistente', 1))
  assert.throws(() => validarCarrinho([{ produtoId: 'p', corId: 'v', quantidade: -1 }]))
  assert.throws(() => validarCarrinho([{ produtoId: 'p', corId: 'v', quantidade: 1 }, { produtoId: 'p', corId: 'v', quantidade: 2 }]))
})

test('carrinho sinaliza despublicação e redução de estoque sem apagar itens', () => {
  const itens = alterarQuantidade([], produtos, 'p', 'v', 3)
  assert.equal(detalharCarrinho(itens, [])[0].indisponivel, true)
  const atualizado = [{ ...produtos[0], precoCentavos: 500, cores: [{ ...produtos[0].cores[0], estoqueSite: 2 }] }]
  const detalhe = detalharCarrinho(itens, atualizado)[0]
  assert.equal(detalhe.indisponivel, true)
  assert.equal(detalhe.precoCentavos, 500)
  assert.equal(detalhe.quantidade, 3)
  const corrigido = alterarQuantidade(itens, atualizado, 'p', 'v', 2)
  assert.equal(detalharCarrinho(corrigido, atualizado)[0].indisponivel, false)
})
