const bcrypt = require('bcryptjs');
const request = require('supertest');
const { pool } = require('../db');
const app = require('../app');

const TEST_EMAIL = 'test-auth@example.com';
const TEST_PASSWORD = 'correct-horse-battery-staple';
const INACTIVE_EMAIL = 'test-auth-inactive@example.com';
const INACTIVE_PASSWORD = 'another-strong-password';

beforeAll(async () => {
  const hash = await bcrypt.hash(TEST_PASSWORD, 10);
  await pool.query(
    `INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET password_hash = $2`,
    [TEST_EMAIL, hash, 'Test User']
  );

  const inactiveHash = await bcrypt.hash(INACTIVE_PASSWORD, 10);
  await pool.query(
    `INSERT INTO users (email, password_hash, full_name, is_active) VALUES ($1, $2, $3, false)
     ON CONFLICT (email) DO UPDATE SET password_hash = $2, is_active = false`,
    [INACTIVE_EMAIL, inactiveHash, 'Inactive User']
  );
});

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email IN ($1, $2)', [TEST_EMAIL, INACTIVE_EMAIL]);
  await pool.end();
});

describe('POST /auth/login', () => {
  it('returns a JWT for valid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
  });

  it('rejects an invalid password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: TEST_EMAIL, password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('rejects an unknown email', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: 'x' });
    expect(res.status).toBe(401);
  });

  it('rejects a missing password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: TEST_EMAIL });
    expect(res.status).toBe(400);
  });

  it('rejects a deactivated user with correct credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: INACTIVE_EMAIL, password: INACTIVE_PASSWORD });
    expect(res.status).toBe(401);
  });
});
