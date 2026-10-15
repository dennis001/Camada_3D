CREATE TABLE test_order_events (
  order_id uuid NOT NULL REFERENCES test_orders(id),
  event_type text NOT NULL CHECK (event_type IN ('created', 'payment_confirmed', 'legacy_confirmation')),
  occurred_at timestamptz DEFAULT now(),
  PRIMARY KEY (order_id, event_type)
);
INSERT INTO test_order_events(order_id, event_type, occurred_at)
SELECT id, 'created', created_at FROM test_orders;
-- A versão anterior não registrava a data da confirmação; não inventar um horário.
INSERT INTO test_order_events(order_id, event_type, occurred_at)
SELECT id, 'legacy_confirmation', NULL FROM test_orders WHERE status='confirmed';
CREATE INDEX test_orders_created ON test_orders(created_at DESC, id DESC);
