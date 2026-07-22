CREATE SCHEMA IF NOT EXISTS wz;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  nip TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  regon TEXT,
  vat_status TEXT,
  last_refreshed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE wz_number_counters (
  year INTEGER PRIMARY KEY,
  last_seq INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE wz_documents (
  id SERIAL PRIMARY KEY,
  number TEXT UNIQUE NOT NULL,
  year INTEGER NOT NULL,
  sequence INTEGER NOT NULL,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  dispatch_date DATE NOT NULL,
  note TEXT,
  issued_by_user_id INTEGER NOT NULL REFERENCES users(id),
  pdf_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE wz_document_items (
  id SERIAL PRIMARY KEY,
  wz_document_id INTEGER NOT NULL REFERENCES wz_documents(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('szt.', 'kartony'))
);
