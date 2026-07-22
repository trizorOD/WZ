const { pool } = require('../db');

async function findUserByEmail(email) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

module.exports = { findUserByEmail };
