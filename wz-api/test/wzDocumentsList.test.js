// test/wzDocumentsList.test.js
const request = require('supertest');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { pool } = require('../db');
const app = require('../app');

function authHeader() {
  const token = jwt.sign({ userId, email: 'wz-documents-list-test@example.com', fullName: 'Jan Kowalski' }, config.jwtSecret);
  return `Bearer ${token}`;
}

// wz_documents.issued_by_user_id has a FK to users(id), so the JWT must carry a
// real user id from the live DB rather than a hardcoded value like 1 (same
// lesson learned in test/wzDocuments.test.js).
let clientId;
let userId;
let documentId;

beforeAll(async () => {
  const clientResult = await pool.query(
    `INSERT INTO clients (nip, name, address) VALUES ($1, $2, $3)
     ON CONFLICT (nip) DO UPDATE SET name = $2 RETURNING id`,
    ['8888888888', 'History Client Sp. z o.o.', 'ul. Historyczna 3, 00-003 Warszawa']
  );
  clientId = clientResult.rows[0].id;

  const userResult = await pool.query(
    `INSERT INTO users (email, password_hash, full_name) VALUES ($1, 'x', 'Jan Kowalski')
     ON CONFLICT (email) DO UPDATE SET full_name = 'Jan Kowalski' RETURNING id`,
    ['wz-documents-list-test@example.com']
  );
  userId = userResult.rows[0].id;

  const createRes = await request(app)
    .post('/wz-documents')
    .set('Authorization', authHeader())
    .send({
      clientId,
      dispatchDate: '2026-07-23',
      items: [{ productId: 11, name: 'Rum Y', sku: 'RY-1', quantity: 3, unit: 'kartony' }],
    });
  documentId = createRes.body.id;
});

afterAll(async () => {
  const numberResult = await pool.query('SELECT number FROM wz_documents WHERE client_id = $1', [clientId]);
  await pool.query('DELETE FROM wz_documents WHERE client_id = $1', [clientId]);
  await pool.query('DELETE FROM clients WHERE id = $1', [clientId]);
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
  await pool.query('DELETE FROM wz_number_counters WHERE year = $1', [new Date().getFullYear()]);
  for (const row of numberResult.rows) {
    const pdfPath = path.join(config.pdfStorageDir, `${row.number.replace(/\//g, '-')}.pdf`);
    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
  }
  await pool.end();
});

describe('GET /wz-documents', () => {
  it('lists documents filtered by client name', async () => {
    const res = await request(app)
      .get('/wz-documents?client=History Client')
      .set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.body.some((d) => d.id === documentId)).toBe(true);
  });
});

describe('GET /wz-documents/:id/pdf', () => {
  it('streams the stored PDF', async () => {
    const res = await request(app)
      .get(`/wz-documents/${documentId}/pdf`)
      .set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.header['content-type']).toBe('application/pdf');
  });

  it('returns 404 for an unknown document id', async () => {
    const res = await request(app)
      .get('/wz-documents/999999/pdf')
      .set('Authorization', authHeader());

    expect(res.status).toBe(404);
  });
});
