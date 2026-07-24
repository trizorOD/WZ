const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');
const { pool } = require('../db');
const app = require('../app');

const PLAIN_EMAIL = 'test-plain-user@example.com';
const NEW_USER_EMAIL = 'test-new-admin-user@example.com';

function adminToken() {
  return `Bearer ${jwt.sign(
    { userId: 999001, email: 'test-admin@example.com', fullName: 'Admin', role: 'admin' },
    config.jwtSecret
  )}`;
}

function plainToken() {
  return `Bearer ${jwt.sign(
    { userId: 999002, email: PLAIN_EMAIL, fullName: 'Plain', role: 'user' },
    config.jwtSecret
  )}`;
}

let seededUserId;

beforeAll(async () => {
  const hash = await bcrypt.hash('whatever-password', 10);
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, 'user')
     ON CONFLICT (email) DO UPDATE SET password_hash = $2
     RETURNING id`,
    [PLAIN_EMAIL, hash, 'Plain User']
  );
  seededUserId = result.rows[0].id;
});

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email IN ($1, $2)', [PLAIN_EMAIL, NEW_USER_EMAIL]);
  await pool.end();
});

describe('access control', () => {
  it('rejects a non-admin token', async () => {
    const getRes = await request(app).get('/admin/users').set('Authorization', plainToken());
    expect(getRes.status).toBe(403);

    const postRes = await request(app)
      .post('/admin/users')
      .set('Authorization', plainToken())
      .send({ email: 'x@example.com', password: 'x', fullName: 'X' });
    expect(postRes.status).toBe(403);

    const patchRes = await request(app)
      .patch(`/admin/users/${seededUserId}/deactivate`)
      .set('Authorization', plainToken());
    expect(patchRes.status).toBe(403);
  });

  it('rejects requests with no token', async () => {
    const res = await request(app).get('/admin/users');
    expect(res.status).toBe(401);
  });
});

describe('GET /admin/users', () => {
  it('lists users without exposing password_hash', async () => {
    const res = await request(app).get('/admin/users').set('Authorization', adminToken());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const seeded = res.body.find((u) => u.email === PLAIN_EMAIL);
    expect(seeded).toBeDefined();
    expect(seeded.password_hash).toBeUndefined();
  });
});

describe('POST /admin/users', () => {
  it('creates a new user defaulting role to user', async () => {
    const res = await request(app)
      .post('/admin/users')
      .set('Authorization', adminToken())
      .send({ email: NEW_USER_EMAIL, password: 'a-strong-password', fullName: 'New User' });
    expect(res.status).toBe(201);
    expect(res.body.role).toBe('user');
    expect(res.body.is_active).toBe(true);
  });

  it('rejects a duplicate email', async () => {
    const res = await request(app)
      .post('/admin/users')
      .set('Authorization', adminToken())
      .send({ email: PLAIN_EMAIL, password: 'a-strong-password', fullName: 'Dup' });
    expect(res.status).toBe(409);
  });

  it('rejects a missing field', async () => {
    const res = await request(app)
      .post('/admin/users')
      .set('Authorization', adminToken())
      .send({ email: 'missing-field@example.com', password: 'x' });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /admin/users/:id/deactivate and /reactivate', () => {
  it('deactivates then reactivates a user, idempotently', async () => {
    const deactivate1 = await request(app)
      .patch(`/admin/users/${seededUserId}/deactivate`)
      .set('Authorization', adminToken());
    expect(deactivate1.status).toBe(200);
    expect(deactivate1.body.is_active).toBe(false);

    const deactivate2 = await request(app)
      .patch(`/admin/users/${seededUserId}/deactivate`)
      .set('Authorization', adminToken());
    expect(deactivate2.status).toBe(200);
    expect(deactivate2.body.is_active).toBe(false);

    const reactivate = await request(app)
      .patch(`/admin/users/${seededUserId}/reactivate`)
      .set('Authorization', adminToken());
    expect(reactivate.status).toBe(200);
    expect(reactivate.body.is_active).toBe(true);
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app)
      .patch('/admin/users/999999999/deactivate')
      .set('Authorization', adminToken());
    expect(res.status).toBe(404);
  });
});

describe('PATCH /admin/users/:id/password', () => {
  it('changes the password so the user can log in with it', async () => {
    const res = await request(app)
      .patch(`/admin/users/${seededUserId}/password`)
      .set('Authorization', adminToken())
      .send({ newPassword: 'brand-new-password' });
    expect(res.status).toBe(200);

    const login = await request(app)
      .post('/auth/login')
      .send({ email: PLAIN_EMAIL, password: 'brand-new-password' });
    expect(login.status).toBe(200);
  });

  it('rejects a missing newPassword', async () => {
    const res = await request(app)
      .patch(`/admin/users/${seededUserId}/password`)
      .set('Authorization', adminToken());
    expect(res.status).toBe(400);
  });
});
