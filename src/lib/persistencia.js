import { validarProduto } from './produtos.js'

export const CHAVE_PRODUTOS = 'studio-camadas:produtos:v1'
export const CHAVE_CARRINHO = 'studio-camadas:carrinho:v1'
export const LIMITE_BACKUP_BYTES = 5 * 1024 * 1024

export function validarCatalogo(produtos) {
  if (!Array.isArray(produtos)) throw new Error('O backup precisa conter uma lista de produtos.')
  const ids = new Set()
  for (const produto of produtos) {
    if (!produto || typeof produto.id !== 'string' || !produto.id.trim() || ids.has(produto.id)) throw new Error('Cada produto precisa ter um identificador único.')
    ids.add(produto.id)
    const erros = validarProduto(produto, produtos)
    if (erros.length) throw new Error(`${produto.nome || 'Produto'}: ${erros.join(' ')}`)
  }
  return produtos
}

export function criarBackup(produtos) {
  return JSON.stringify({ aplicativo: 'studio-camadas', versao: 1, exportadoEm: new Date().toISOString(), produtos }, null, 2)
}

export function lerBackup(texto) {
  if (new TextEncoder().encode(texto).length > LIMITE_BACKUP_BYTES) throw new Error('O backup excede o limite de 5 MB.')
  let dados
  try { dados = JSON.parse(texto) } catch { throw new Error('Arquivo JSON inválido. Os dados atuais foram preservados.') }
  if (dados?.aplicativo !== 'studio-camadas' || dados.versao !== 1) throw new Error('Formato ou versão de backup não reconhecido.')
  return validarCatalogo(dados.produtos)
}

export function carregarProdutos(storage) {
  let versao = null
  try {
    versao = storage.getItem(CHAVE_PRODUTOS)
    return { produtos: versao === null ? [] : lerBackup(versao), versao, erro: '' }
  } catch (erro) {
    return { produtos: [], versao, erro: `Não foi possível carregar o cadastro. ${erro.message} Exporte uma cópia antes de recuperar os dados.` }
  }
}

// Detecta alterações em outra aba antes de sobrescrever o cadastro.
export function salvarProdutos(storage, produtos, versaoAnterior) {
  validarCatalogo(produtos)
  if (storage.getItem(CHAVE_PRODUTOS) !== versaoAnterior) throw new Error('O cadastro foi alterado em outra aba. Recarregue a página antes de salvar.')
  const versao = criarBackup(produtos)
  if (new TextEncoder().encode(versao).length > LIMITE_BACKUP_BYTES) throw new Error('O cadastro excede 5 MB. Use links para as fotos.')
  storage.setItem(CHAVE_PRODUTOS, versao)
  return versao
}

export function mesclarProdutos(atuais, importados) {
  const resultado = new Map(atuais.map(produto => [produto.id, produto]))
  importados.forEach(produto => resultado.set(produto.id, produto))
  return validarCatalogo([...resultado.values()])
}
