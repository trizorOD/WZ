const bcrypt = require('bcryptjs');
const { pool } = require('../db');

async function seedUser() {
  const [, , email, password, fullName] = process.argv;
  if (!email || !password || !fullName) {
    console.error('Usage: node scripts/seedUser.js <email> <password> "<full name>"');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET password_hash = $2, full_name = $3`,
    [email, hash, fullName]
  );
  console.log(`User ${email} ready`);
  await pool.end();
}

seedUser().catch((err) => {
  console.error(err);
  process.exit(1);
});
