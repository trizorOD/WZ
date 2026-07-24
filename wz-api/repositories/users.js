// wz-api/repositories/users.js
const { pool } = require('../db');

async function findUserByEmail(email) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

async function listUsers() {
  const result = await pool.query(
    `SELECT id, email, full_name, role, is_active, created_at
     FROM users ORDER BY created_at DESC`
  );
  return result.rows;
}

async function insertUser({ email, passwordHash, fullName, role }) {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, full_name, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, full_name, role, is_active, created_at`,
    [email, passwordHash, fullName, role]
  );
  return result.rows[0];
}

async function setUserActive(id, isActive) {
  const result = await pool.query(
    `UPDATE users SET is_active = $2
     WHERE id = $1
     RETURNING id, email, full_name, role, is_active, created_at`,
    [id, isActive]
  );
  return result.rows[0] || null;
}

async function updateUserPassword(id, passwordHash) {
  const result = await pool.query(
    `UPDATE users SET password_hash = $2 WHERE id = $1 RETURNING id`,
    [id, passwordHash]
  );
  return result.rows[0] || null;
}

module.exports = { findUserByEmail, listUsers, insertUser, setUserActive, updateUserPassword };
