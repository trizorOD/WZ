const { pool } = require('../db');

async function nextWzNumber(year) {
  const result = await pool.query(
    `INSERT INTO wz_number_counters (year, last_seq)
     VALUES ($1, 1)
     ON CONFLICT (year) DO UPDATE SET last_seq = wz_number_counters.last_seq + 1
     RETURNING last_seq`,
    [year]
  );
  const sequence = result.rows[0].last_seq;
  const number = `WZ/${String(sequence).padStart(6, '0')}/${year}`;
  return { number, sequence };
}

module.exports = { nextWzNumber };
