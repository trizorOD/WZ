const { Pool } = require('pg');
const config = require('./config');

// All wz-api tables live in the `wz` schema, not `public` — this project
// shares its Postgres instance with unrelated data.
const pool = new Pool({ connectionString: config.databaseUrl, options: '-c search_path=wz' });

function query(text, params) {
  return pool.query(text, params);
}

async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, withTransaction };
