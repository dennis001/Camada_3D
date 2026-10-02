import test from 'node:test'
import assert from 'node:assert/strict'
import { estimarImpressao, resumirImpressao, formatarTempoImpressao } from '../src/lib/producao.js'
import { alterarQuantidade, detalharCarrinho } from '../src/lib/carrinho.js'

test('produção arredonda lotes para cima e só cresce ao precisar de outra placa', () => {
  const producao = { tempoPlacaMinutos: 110, unidadesPorPlaca: 4 }
  assert.deepEqual(estimarImpressao(1, producao), { placas: 1, minutos: 110 })
  assert.deepEqual(estimarImpressao(4, producao), { placas: 1, minutos: 110 })
  assert.deepEqual(estimarImpressao(5, producao), { placas: 2, minutos: 220 })
  assert.deepEqual(estimarImpressao(12, producao), { placas: 3, minutos: 330 })
  assert.equal(formatarTempoImpressao(220), '3 h 40 min')
})

test('cores sem peças prontas aceitam encomendas; carrinho recalcula ao alterar e remover', () => {
  const produtos = [{ id: 'p', nome: 'Teste', precoCentavos: 2990, producao: { tempoPlacaMinutos: 110, unidadesPorPlaca: 4 }, cores: [{ id: 'branco', nome: 'Branco', estoqueSite: 0 }, { id: 'cinza', nome: 'Cinza', estoqueSite: 0 }] }]
  let itens = alterarQuantidade([], produtos, 'p', 'branco', 5)
  itens = alterarQuantidade(itens, produtos, 'p', 'cinza', 1)
  assert.equal(resumirImpressao(detalharCarrinho(itens, produtos)).minutos, 330)
  itens = alterarQuantidade(itens, produtos, 'p', 'branco', 4)
  assert.equal(resumirImpressao(detalharCarrinho(itens, produtos)).minutos, 220)
  assert.equal(resumirImpressao(detalharCarrinho(itens.slice(1), produtos)).minutos, 110)
  assert.equal(resumirImpressao(detalharCarrinho(itens, [])).minutos, null)
})

test('ficha incompleta, quantidade inválida e estouro numérico não geram prazo fictício', () => {
  for (const producao of [null, {}, { tempoPlacaMinutos: 0, unidadesPorPlaca: 1 }, { tempoPlacaMinutos: 10, unidadesPorPlaca: 0 }, { tempoPlacaMinutos: 10, unidadesPorPlaca: 1.5 }]) assert.equal(estimarImpressao(2, producao).minutos, null)
  const producao = { tempoPlacaMinutos: 110, unidadesPorPlaca: 4 }
  for (const q of [0, -1, 1.5, Infinity, Number.MAX_SAFE_INTEGER + 1]) assert.equal(estimarImpressao(q, producao).minutos, null)
  assert.equal(estimarImpressao(Number.MAX_SAFE_INTEGER, { tempoPlacaMinutos: 110, unidadesPorPlaca: 1 }).minutos, null)
  assert.equal(resumirImpressao([{ impressao: { placas: 1, minutos: 110 } }, { impressao: { placas: null, minutos: null } }]).minutos, null)
  assert.equal(formatarTempoImpressao(null), 'A calcular')
})
