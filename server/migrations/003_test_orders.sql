CREATE TABLE test_orders (
  id uuid PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES admins(id),
  request_id uuid NOT NULL,
  details jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(customer_id, request_id)
);
