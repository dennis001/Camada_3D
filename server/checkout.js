import { randomUUID } from 'node:crypto'
import { fail, publicCatalog } from './catalog.js'
import { validarCarrinho, detalharCarrinho } from '../src/lib/carrinho.js'

const uuid = { type: 'string', pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' }
const text = { type: 'string', minLength: 1, maxLength: 160 }
export function registerCheckout(app, { pool, authenticated, enabled, catalogPreviewIds }) {
  app.get('/api/checkout/config', async () => ({ teste: enabled }))
  if (!enabled) return
  async function access(request) {
    await authenticated(request)
    if (request.admin.must_change_password) throw fail(403, 'Defina sua senha pessoal antes de continuar.')
  }
  app.post('/api/checkout/teste', {
    onRequest: access,
    schema: { body: { type: 'object', additionalProperties: false, required: ['requestId', 'itens', 'endereco', 'pagamento'], properties: {
      requestId: uuid, pagamento: { enum: ['pix', 'credito'] },
      itens: { type: 'array', minItems: 1, maxItems: 100, items: { type: 'object', additionalProperties: false, required: ['produtoId', 'corId', 'quantidade'], properties: { produtoId: text, corId: text, quantidade: { type: 'integer', minimum: 1, maximum: 1000000 } } } },
      endereco: { type: 'object', additionalProperties: false, required: ['nome', 'cep', 'rua', 'numero', 'bairro', 'cidade', 'uf'], properties: { nome: text, cep: { type: 'string', pattern: '^\\d{8}$' }, rua: text, numero: text, bairro: text, cidade: text, uf: { enum: 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ') }, complemento: { type: 'string', maxLength: 160 } } },
    } } },
  }, async request => {
    const body = request.body
    if (Object.entries(body.endereco).some(([key, value]) => key !== 'complemento' && !value.trim())) throw fail(400, 'Preencha o endereço de entrega.')
    const previous = await pool.query('SELECT * FROM test_orders WHERE customer_id=$1 AND request_id=$2', [request.admin.id, body.requestId])
    if (previous.rowCount) return { pedido: previous.rows[0] }
    let items
    try { items = validarCarrinho(body.itens) } catch { throw fail(400, 'Carrinho inválido.') }
    const details = detalharCarrinho(items, await publicCatalog(pool, catalogPreviewIds))
    if (details.some(item => item.indisponivel)) throw fail(409, 'Um produto ou cor saiu do catálogo. Revise o carrinho.')
    const subtotal = details.reduce((sum, item) => sum + item.precoCentavos * item.quantidade, 0)
    if (!Number.isSafeInteger(subtotal)) throw fail(400, 'Total do pedido inválido.')
    const snapshot = { itens: details.map(({ impressao, ...item }) => item), endereco: body.endereco, pagamento: body.pagamento, subtotal, frete: 0, total: subtotal, teste: true }
    const result = await pool.query('INSERT INTO test_orders(id,customer_id,request_id,details) VALUES($1,$2,$3,$4) ON CONFLICT(customer_id,request_id) DO UPDATE SET request_id=EXCLUDED.request_id RETURNING *', [randomUUID(), request.admin.id, body.requestId, snapshot])
    return { pedido: result.rows[0] }
  })
  app.get('/api/checkout/teste/:id', { onRequest: access, schema: { params: { type: 'object', properties: { id: uuid }, required: ['id'] } } }, async request => {
    const result = await pool.query('SELECT * FROM test_orders WHERE id=$1 AND customer_id=$2', [request.params.id, request.admin.id])
    if (!result.rowCount) throw fail(404, 'Pedido não encontrado.')
    return { pedido: result.rows[0] }
  })
  app.post('/api/checkout/teste/:id/confirmar', { onRequest: access, schema: { params: { type: 'object', properties: { id: uuid }, required: ['id'] } } }, async request => {
    const result = await pool.query("UPDATE test_orders SET status='confirmed' WHERE id=$1 AND customer_id=$2 RETURNING *", [request.params.id, request.admin.id])
    if (!result.rowCount) throw fail(404, 'Pedido não encontrado.')
    return { pedido: result.rows[0] }
  })
}
