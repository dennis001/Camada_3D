ALTER TABLE admins ADD COLUMN role text NOT NULL DEFAULT 'admin'
  CHECK (role IN ('admin', 'developer', 'customer'));
-- Sessões antigas exigirão novo login, pois não possuem uma origem vinculada.
ALTER TABLE sessions ADD COLUMN audience text NOT NULL DEFAULT '';
