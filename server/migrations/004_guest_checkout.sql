CREATE TABLE checkout_guests (
  id uuid PRIMARY KEY,
  token_hash text NOT NULL UNIQUE,
  csrf_token text NOT NULL,
  expires_at timestamptz NOT NULL
);
ALTER TABLE test_orders ALTER COLUMN customer_id DROP NOT NULL;
ALTER TABLE test_orders ADD COLUMN guest_id uuid;
ALTER TABLE test_orders ADD CONSTRAINT test_orders_owner CHECK ((customer_id IS NOT NULL) <> (guest_id IS NOT NULL));
CREATE UNIQUE INDEX test_orders_guest_request ON test_orders(guest_id, request_id);
