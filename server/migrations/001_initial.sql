CREATE TABLE admins (
  id uuid PRIMARY KEY,
  username text NOT NULL UNIQUE CHECK (username = lower(username)),
  name text NOT NULL,
  password_hash text NOT NULL,
  must_change_password boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE sessions (
  token_hash text PRIMARY KEY,
  admin_id uuid NOT NULL REFERENCES admins(id),
  csrf_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_admin ON sessions(admin_id);
CREATE INDEX sessions_expiration ON sessions(expires_at);
CREATE TABLE catalog_state (
  id integer PRIMARY KEY CHECK (id = 1),
  revision integer NOT NULL DEFAULT 0 CHECK (revision >= 0)
);
INSERT INTO catalog_state (id) VALUES (1);
CREATE TABLE products (
  id text PRIMARY KEY,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object' AND data->>'id' = id),
  updated_by uuid NOT NULL REFERENCES admins(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE variants (
  product_id text NOT NULL REFERENCES products(id),
  id text NOT NULL,
  sku_key text UNIQUE,
  stock_site bigint NOT NULL CHECK (stock_site >= 0),
  PRIMARY KEY (product_id, id)
);
CREATE TABLE product_revisions (
  product_id text NOT NULL REFERENCES products(id),
  revision integer NOT NULL,
  data jsonb NOT NULL,
  actor_id uuid NOT NULL REFERENCES admins(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, revision)
);
CREATE TABLE audit_events (
  id uuid PRIMARY KEY,
  actor_id uuid REFERENCES admins(id),
  action text NOT NULL,
  product_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
