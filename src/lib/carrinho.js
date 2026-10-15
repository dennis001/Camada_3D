import { estimarImpressao } from './producao.js'

export function chaveItem(produtoId, corId) { return JSON.stringify([produtoId, corId]) }

export function validarCarrinho(itens) {
  if (!Array.isArray(itens)) throw new Error('Carrinho salvo inválido.')
  const chaves = new Set()
  for (const item of itens) {
    if (!item || typeof item.produtoId !== 'string' || typeof item.corId !== 'string' || !Number.isSafeInteger(item.quantidade) || item.quantidade < 1) throw new Error('Carrinho salvo inválido.')
    const chave = chaveItem(item.produtoId, item.corId)
    if (chaves.has(chave)) throw new Error('Carrinho salvo contém itens duplicados.')
    chaves.add(chave)
  }
  return itens.map(({ produtoId, corId, quantidade }) => ({ produtoId, corId, quantidade }))
}

export function detalharCarrinho(itens, produtos) {
  return itens.map(item => {
    const produto = produtos.find(p => p.id === item.produtoId)
    const cor = produto?.cores.find(c => c.id === item.corId)
    return {
      ...item, chave: chaveItem(item.produtoId, item.corId),
      nome: produto?.nome || 'Produto fora do catálogo', cor: cor?.nome || 'Cor indisponível', sku: cor?.sku || '',
      precoCentavos: produto?.precoCentavos ?? null,
      impressao: estimarImpressao(item.quantidade, produto?.producao),
      indisponivel: !cor || !Number.isSafeInteger(produto?.precoCentavos) || produto.precoCentavos < 0,
    }
  })
}

export function alterarQuantidade(itens, produtos, produtoId, corId, quantidade) {
  if (!Number.isSafeInteger(quantidade) || quantidade < 1) throw new Error('Informe uma quantidade inteira maior que zero.')
  const produto = produtos.find(p => p.id === produtoId)
  const cor = produto?.cores.find(c => c.id === corId)
  if (!cor || !Number.isSafeInteger(produto?.precoCentavos) || produto.precoCentavos < 0) throw new Error('Este produto ou cor não está mais disponível.')
  if (!Number.isSafeInteger(produto.precoCentavos * quantidade)) throw new Error('O valor deste item ultrapassa o limite suportado.')
  const existe = itens.some(item => item.produtoId === produtoId && item.corId === corId)
  const novo = { produtoId, corId, quantidade }
  return existe ? itens.map(item => item.produtoId === produtoId && item.corId === corId ? novo : item) : [...itens, novo]
}
