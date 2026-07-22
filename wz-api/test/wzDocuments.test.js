const request = require('supertest');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { pool } = require('../db');
const app = require('../app');

function authHeader(fullName = 'Jan Kowalski') {
  const token = jwt.sign({ userId, email: 'wz-documents-test@example.com', fullName }, config.jwtSecret);
  return `Bearer ${token}`;
}

// wz_documents.issued_by_user_id has a FK to users(id), so the JWT must carry a
// real user id from the live DB rather than a hardcoded value like 1.
let clientId;
let userId;
const createdNumbers = [];

beforeAll(async () => {
  const result = await pool.query(
    `INSERT INTO clients (nip, name, address) VALUES ($1, $2, $3)
     ON CONFLICT (nip) DO UPDATE SET name = $2 RETURNING id`,
    ['9999999999', 'Test Client Sp. z o.o.', 'ul. Testowa 2, 00-002 Warszawa']
  );
  clientId = result.rows[0].id;

  const userResult = await pool.query(
    `INSERT INTO users (email, password_hash, full_name) VALUES ($1, 'x', 'Jan Kowalski')
     ON CONFLICT (email) DO UPDATE SET full_name = 'Jan Kowalski' RETURNING id`,
    ['wz-documents-test@example.com']
  );
  userId = userResult.rows[0].id;
});

afterAll(async () => {
  await pool.query('DELETE FROM wz_documents WHERE client_id = $1', [clientId]);
  await pool.query('DELETE FROM clients WHERE id = $1', [clientId]);
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
  await pool.query('DELETE FROM wz_number_counters WHERE year = $1', [new Date().getFullYear()]);
  for (const number of createdNumbers) {
    const pdfPath = path.join(config.pdfStorageDir, `${number.replace(/\//g, '-')}.pdf`);
    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
  }
  await pool.end();
});

describe('POST /wz-documents', () => {
  it('creates a document, assigns a sequential number, and stores a PDF', async () => {
    const res = await request(app)
      .post('/wz-documents')
      .set('Authorization', authHeader())
      .send({
        clientId,
        dispatchDate: '2026-07-23',
        note: '',
        items: [{ productId: 10, name: 'Whisky X', sku: 'WX-1', quantity: 6, unit: 'szt.' }],
      });

    expect(res.status).toBe(201);
    expect(res.body.number).toMatch(/^WZ\/\d{6}\/\d{4}$/);
    expect(fs.existsSync(config.pdfStorageDir)).toBe(true);
    createdNumbers.push(res.body.number);
  });

  it('rejects a request with no items', async () => {
    const res = await request(app)
      .post('/wz-documents')
      .set('Authorization', authHeader())
      .send({ clientId, dispatchDate: '2026-07-23', items: [] });

    expect(res.status).toBe(400);
  });

  it('returns 404 for an unknown client', async () => {
    const res = await request(app)
      .post('/wz-documents')
      .set('Authorization', authHeader())
      .send({
        clientId: 999999,
        dispatchDate: '2026-07-23',
        items: [{ productId: 1, name: 'X', sku: 'X', quantity: 1, unit: 'szt.' }],
      });

    expect(res.status).toBe(404);
  });
});
