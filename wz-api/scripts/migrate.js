const fs = require('fs');
const path = require('path');
const { pool } = require('../db');

async function migrate() {
  const fileName = process.argv[2] || '001_init.sql';
  const sql = fs.readFileSync(path.join(__dirname, '..', 'migrations', fileName), 'utf8');
  await pool.query(sql);
  console.log(`Migration ${fileName} applied`);
  await pool.end();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
