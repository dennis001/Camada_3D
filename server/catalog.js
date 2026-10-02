import { randomUUID } from 'node:crypto'
import { validarProduto, normalizarTexto, toProdutoPublico } from '../src/lib/produtos.js'
import { transaction } from './db.js'

export function fail(statusCode, message) { return Object.assign(new Error(message), { statusCode }) }
export function validateProducts(products) {
  if (!Array.isArray(products) || products.length > 2000) throw fail(400, 'Informe até 2.000 produtos por cadastro.')
  const ids = new Set()
  for (const product of products) {
    const errors = validarProduto(product, products)
    if (errors.length) throw fail(400, errors.join(' '))
    if (ids.has(product.id)) throw fail(400, 'Identificador de produto repetido.')
    if (product.id.length > 120 || product.nome.length > 300) throw fail(400, 'Identificador ou nome do produto muito longo.')
    ids.add(product.id)
    for (const image of product.imagens) {
      if (image.startsWith('/') && !image.startsWith('//') && !image.includes('\\')) continue
      try { if (['https:', 'http:'].includes(new URL(image).protocol)) continue } catch {}
      throw fail(400, 'Use endereços HTTP(S) ou caminhos locais para as imagens.')
    }
  }
}

// A API aceita apenas os campos do contrato, incluindo os dados privados conhecidos.
export function canonicalProduct(p) {
  const keys = ['id', 'nome', 'descricao', 'categoriaId', 'precoCentavos', 'material', 'medidas', 'imagens', 'publicado']
  const result = Object.fromEntries(keys.map(key => [key, p[key]]))
  result.cores = p.cores.map(({ id, sku, nome, estoqueSite, imagem }) => ({ id, sku, nome, estoqueSite, ...(imagem ? { imagem } : {}) }))
  result.ficha = Object.fromEntries(['tempoPlacaMinutos', 'unidadesPorPlaca', 'potenciaWatts', 'tarifaKwhCentavos', 'embalagemCentavos', 'outrosCustosCentavos', 'perfil', 'arquivo3mf'].map(key => [key, p.ficha[key]]))
  result.ficha.filamentos = p.ficha.filamentos.map(({ material, cor, gramasPorPlaca, precoKgCentavos }) => ({ material, cor, gramasPorPlaca, precoKgCentavos }))
  result.origem = Object.fromEntries(['plataforma', 'url', 'autor', 'licenca', 'usoComercial', 'evidencia'].map(key => [key, p.origem[key]]))
  return result
}

export async function readCatalog(pool) {
  // Uma única instrução lê produtos e revisão no mesmo snapshot PostgreSQL.
  const result = await pool.query("SELECT revision, COALESCE((SELECT jsonb_agg(data ORDER BY id) FROM products), '[]'::jsonb) AS produtos FROM catalog_state WHERE id=1")
  return result.rows[0]
}
export async function publicCatalog(pool, previewIds = []) {
  const result = await pool.query("SELECT data FROM products WHERE data->>'publicado'='true' OR id=ANY($1::text[]) ORDER BY id", [previewIds])
  return result.rows.map(row => ({ ...toProdutoPublico(row.data), ...(!row.data.publicado ? { emTeste: true } : {}) }))
}
export async function audit(client, actor, action, productId = null) {
  await client.query('INSERT INTO audit_events(id,actor_id,action,product_id) VALUES($1,$2,$3,$4)', [randomUUID(), actor, action, productId])
}
export async function saveCatalog(pool, incoming, revision, actor, importing = false) {
  if (!Number.isInteger(revision) || revision < 0) throw fail(400, 'Informe a revisão do catálogo.')
  validateProducts(incoming)
  const clean = incoming.map(canonicalProduct)
  return transaction(pool, async client => {
    const state = await client.query('SELECT revision FROM catalog_state WHERE id=1 FOR UPDATE')
    if (state.rows[0].revision !== revision) throw fail(409, 'O catálogo mudou desde sua última leitura. Exporte suas alterações e recarregue antes de tentar novamente.')
    const previous = await client.query('SELECT data FROM products ORDER BY id')
    const merged = new Map(previous.rows.map(row => [row.data.id, row.data]))
    clean.forEach(product => merged.set(product.id, product))
    validateProducts([...merged.values()])
    const next = revision + 1
    // Liberar SKUs de todos os produtos afetados antes da inserção permite trocas válidas em uma importação.
    await client.query('DELETE FROM variants WHERE product_id=ANY($1::text[])', [clean.map(p => p.id)])
    for (const product of clean) {
      await client.query('INSERT INTO products(id,data,updated_by) VALUES($1,$2,$3) ON CONFLICT(id) DO UPDATE SET data=$2, updated_by=$3, updated_at=now()', [product.id, product, actor])
      for (const variant of product.cores) {
        await client.query('INSERT INTO variants(product_id,id,sku_key,stock_site) VALUES($1,$2,$3,$4)', [product.id, variant.id, normalizarTexto(variant.sku) || null, variant.estoqueSite])
      }
      await client.query('INSERT INTO product_revisions(product_id,revision,data,actor_id) VALUES($1,$2,$3,$4)', [product.id, next, product, actor])
      await audit(client, actor, importing ? 'product.imported' : 'product.saved', product.id)
    }
    await client.query('UPDATE catalog_state SET revision=$1 WHERE id=1', [next])
    return { revision: next, produtos: [...merged.values()].sort((a, b) => a.id.localeCompare(b.id)) }
  })
}
