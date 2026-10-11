import { fail } from './catalog.js'
import { transaction } from './db.js'

function validDate(value) {
  if (!value) return true
  if (value.startsWith('0000-')) return false
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}
export function registerAdminOrders(app, { pool, administrator, enabled }) {
  if (!enabled) return
  app.get('/api/admin/pedidos', {
    onRequest: administrator,
    schema: { querystring: { type: 'object', additionalProperties: false, properties: {
      busca: { type: 'string', maxLength: 36 },
      status: { enum: ['pending', 'confirmed'] },
      pagamento: { enum: ['pix', 'credito'] },
      inicio: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
      fim: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
      pagina: { type: 'integer', minimum: 1, maximum: 100000, default: 1 },
    } } },
  }, async request => {
    const q = request.query
    if (!validDate(q.inicio) || !validDate(q.fim) || (q.inicio && q.fim && q.inicio > q.fim)) throw fail(400, 'Informe um período válido, com início anterior ou igual ao fim.')
    const values = [q.busca?.trim().toLowerCase() || '', q.status || null, q.pagamento || null, q.inicio || null, q.fim || null]
    const where = `WHERE ($1='' OR strpos(id::text,$1)>0)
      AND ($2::text IS NULL OR status=$2)
      AND ($3::text IS NULL OR details->>'pagamento'=$3)
      AND ($4::date IS NULL OR created_at >= ($4::date::timestamp AT TIME ZONE 'America/Sao_Paulo'))
      AND ($5::date IS NULL OR created_at < (($5::date+1)::timestamp AT TIME ZONE 'America/Sao_Paulo'))`
    return transaction(pool, async client => {
      await client.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY')
      const summary = (await client.query(`SELECT count(*)::int AS quantidade,
        count(*) FILTER (WHERE status='pending')::int AS pendentes,
        count(*) FILTER (WHERE status='confirmed')::int AS confirmados,
        COALESCE(sum((details->>'total')::numeric),0)::text AS total
        FROM test_orders ${where}`, values)).rows[0]
      const result = await client.query(`SELECT id, created_at, status, details->>'pagamento' AS pagamento,
        (details->>'total')::text AS total,
        (SELECT sum((item->>'quantidade')::numeric)::text FROM jsonb_array_elements(details->'itens') AS item) AS unidades
        FROM test_orders ${where} ORDER BY created_at DESC,id DESC LIMIT 20 OFFSET $6`, [...values, (q.pagina - 1) * 20])
      const safeNumber = value => Number.isSafeInteger(Number(value)) ? Number(value) : null
      return {
        pedidos: result.rows.map(row => ({ ...row, total: safeNumber(row.total), unidades: safeNumber(row.unidades), canal: 'site_teste' })),
        resumo: { ...summary, total: safeNumber(summary.total) }, pagina: q.pagina, porPagina: 20,
      }
    })
  })
  app.get('/api/admin/pedidos/:id', {
    onRequest: administrator,
    schema: { params: { type: 'object', required: ['id'], properties: { id: { type: 'string', pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' } } } },
  }, async request => transaction(pool, async client => {
    await client.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY')
    const row = (await client.query('SELECT id,details,status,created_at FROM test_orders WHERE id=$1', [request.params.id])).rows[0]
    if (!row) throw fail(404, 'Pedido não encontrado.')
    const historico = (await client.query('SELECT event_type,occurred_at FROM test_order_events WHERE order_id=$1 ORDER BY occurred_at NULLS LAST,event_type', [row.id])).rows
    return { pedido: { ...row, canal: 'site_teste', producao: 'Não iniciada (teste)', envio: 'Não enviado (teste)', prazo: null }, historico }
  }))
}
