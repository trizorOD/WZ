const { pool } = require('../db');

async function findClientByNip(nip) {
  const result = await pool.query('SELECT * FROM clients WHERE nip = $1', [nip]);
  return result.rows[0] || null;
}

async function searchClients(query) {
  const result = await pool.query(
    `SELECT * FROM clients WHERE nip ILIKE $1 OR name ILIKE $1 ORDER BY name LIMIT 20`,
    [`%${query}%`]
  );
  return result.rows;
}

async function upsertClient(data) {
  const result = await pool.query(
    `INSERT INTO clients (nip, name, address, regon, vat_status, last_refreshed_at)
     VALUES ($1, $2, $3, $4, $5, now())
     ON CONFLICT (nip) DO UPDATE SET
       name = $2, address = $3, regon = $4, vat_status = $5, last_refreshed_at = now()
     RETURNING *`,
    [data.nip, data.name, data.address, data.regon, data.vatStatus]
  );
  return result.rows[0];
}

module.exports = { findClientByNip, searchClients, upsertClient };
