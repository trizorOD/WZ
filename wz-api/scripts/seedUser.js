const bcrypt = require('bcryptjs');
const { pool } = require('../db');

async function seedUser() {
  const args = process.argv.slice(2);
  const isAdmin = args.includes('--admin');
  const [email, password, fullName] = args.filter((arg) => arg !== '--admin');

  if (!email || !password || !fullName) {
    console.error('Usage: node scripts/seedUser.js <email> <password> "<full name>" [--admin]');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);
  if (isAdmin) {
    await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO UPDATE SET password_hash = $2, full_name = $3, role = 'admin'`,
      [email, hash, fullName]
    );
  } else {
    await pool.query(
      `INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET password_hash = $2, full_name = $3`,
      [email, hash, fullName]
    );
  }
  console.log(`User ${email} ready${isAdmin ? ' (admin)' : ''}`);
  await pool.end();
}

seedUser().catch((err) => {
  console.error(err);
  process.exit(1);
});
