import { token, digest, sameToken } from './security.js'
import { randomUUID } from 'node:crypto'
import { fail, publicCatalog } from './catalog.js'
import { validarCarrinho, detalharCarrinho } from '../src/lib/carrinho.js'

const uuid = { type: 'string', pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' }
const text = { type: 'string', minLength: 1, maxLength: 160 }
export function registerCheckout(app, { pool, authenticated, enabled, catalogPreviewIds, cookieName, cookieOptions, environment }) {
  app.get('/api/checkout/config', async () => ({ teste: enabled }))
  if (!enabled) return
  const guestCookie = (cookieOptions.secure ? '__Host-' : '') + 'camada_' + environment + '_guest'
  const guestOptions = { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 }
  async function guest(request) {
    const value = request.cookies[guestCookie]
    if (!value || !/^[A-Za-z0-9_-]{43}$/.test(value)) return null
    return (await pool.query('SELECT * FROM checkout_guests WHERE token_hash=$1 AND expires_at>now()', [digest(value)])).rows[0]
  }
  app.post('/api/checkout/sessao', { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, async (request, reply) => {
    let current = await guest(request)
    if (!current) {
      await pool.query('DELETE FROM checkout_guests WHERE expires_at<=now()')
      const value = token()
      const result = await pool.query("INSERT INTO checkout_guests(id,token_hash,csrf_token,expires_at) VALUES($1,$2,$3,now()+interval '7 days') RETURNING *", [randomUUID(), digest(value), token()])
      current = result.rows[0]
      reply.setCookie(guestCookie, value, guestOptions)
    }
    return { csrfToken: current.csrf_token }
  })
  async function access(request) {
    if (request.cookies[cookieName]) {
      try { await authenticated(request) } catch (error) { if (error.statusCode !== 401) throw error }
    }
    if (request.admin) {
      if (request.admin.must_change_password) throw fail(403, 'Defina sua senha pessoal antes de continuar.')
      request.customerId = request.admin.id
      request.guestId = null
    } else {
      const current = await guest(request)
      if (!current) throw fail(401, 'Sua sessão de compra expirou. Recarregue a página.')
      if (!['GET', 'HEAD'].includes(request.method) && !sameToken(request.headers['x-csrf-token'], current.csrf_token)) throw fail(403, 'Solicitação expirada. Recarregue a página.')
      request.customerId = null
      request.guestId = current.id
    }
  }
  const view = row => ({ id: row.id, details: row.details, status: row.status, created_at: row.created_at })
  app.post('/api/checkout/teste', {
    onRequest: access,
    config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    schema: { body: { type: 'object', additionalProperties: false, required: ['requestId', 'itens', 'endereco', 'pagamento'], properties: {
      requestId: uuid, pagamento: { enum: ['pix', 'credito'] },
      itens: { type: 'array', minItems: 1, maxItems: 100, items: { type: 'object', additionalProperties: false, required: ['produtoId', 'corId', 'quantidade'], properties: { produtoId: text, corId: text, quantidade: { type: 'integer', minimum: 1, maximum: 1000000 } } } },
      endereco: { type: 'object', additionalProperties: false, required: ['nome', 'cep', 'rua', 'numero', 'bairro', 'cidade', 'uf'], properties: { nome: text, cep: { type: 'string', pattern: '^\\d{8}$' }, rua: text, numero: text, bairro: text, cidade: text, uf: { enum: 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ') }, complemento: { type: 'string', maxLength: 160 } } },
    } } },
  }, async request => {
    const body = request.body
    if (Object.entries(body.endereco).some(([key, value]) => key !== 'complemento' && !value.trim())) throw fail(400, 'Preencha o endereço de entrega.')
    const previous = await pool.query('SELECT * FROM test_orders WHERE (customer_id=$1 OR guest_id=$2) AND request_id=$3', [request.customerId, request.guestId, body.requestId])
    if (previous.rowCount) return { pedido: view(previous.rows[0]) }
    let items
    try { items = validarCarrinho(body.itens) } catch { throw fail(400, 'Carrinho inválido.') }
    const details = detalharCarrinho(items, await publicCatalog(pool, catalogPreviewIds))
    if (details.some(item => item.indisponivel)) throw fail(409, 'Um produto ou cor saiu do catálogo. Revise o carrinho.')
    const subtotal = details.reduce((sum, item) => sum + item.precoCentavos * item.quantidade, 0)
    if (!Number.isSafeInteger(subtotal)) throw fail(400, 'Total do pedido inválido.')
    const snapshot = { itens: details.map(({ impressao, ...item }) => item), endereco: body.endereco, pagamento: body.pagamento, subtotal, frete: 0, total: subtotal, teste: true }
    const ownerColumn = request.customerId ? 'customer_id' : 'guest_id'
    const result = await pool.query(`INSERT INTO test_orders(id,customer_id,guest_id,request_id,details) VALUES($1,$2,$3,$4,$5) ON CONFLICT(${ownerColumn},request_id) DO UPDATE SET request_id=EXCLUDED.request_id RETURNING *`, [randomUUID(), request.customerId, request.guestId, body.requestId, snapshot])
    return { pedido: view(result.rows[0]) }
  })
  app.get('/api/checkout/teste/:id', { onRequest: access, schema: { params: { type: 'object', properties: { id: uuid }, required: ['id'] } } }, async request => {
    const result = await pool.query('SELECT * FROM test_orders WHERE id=$1 AND (customer_id=$2 OR guest_id=$3)', [request.params.id, request.customerId, request.guestId])
    if (!result.rowCount) throw fail(404, 'Pedido não encontrado.')
    return { pedido: view(result.rows[0]) }
  })
  app.post('/api/checkout/teste/:id/confirmar', { onRequest: access, schema: { params: { type: 'object', properties: { id: uuid }, required: ['id'] } } }, async request => {
    const result = await pool.query("UPDATE test_orders SET status='confirmed' WHERE id=$1 AND (customer_id=$2 OR guest_id=$3) RETURNING *", [request.params.id, request.customerId, request.guestId])
    if (!result.rowCount) throw fail(404, 'Pedido não encontrado.')
    return { pedido: view(result.rows[0]) }
  })
}
