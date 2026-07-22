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
  // Intentionally not deleting the wz_number_counters row for the current
  // year: it's a shared, monotonic counter that real (non-test) documents
  // also rely on. Deleting it would reset the sequence and risk a future
  // insert colliding with an already-issued WZ number.
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
    createdNumbers.push(res.body.number);

    // The document row must actually persist with the submitted fields, not
    // just produce a 201 response.
    const docResult = await pool.query('SELECT * FROM wz_documents WHERE id = $1', [res.body.id]);
    expect(docResult.rows).toHaveLength(1);
    const savedDoc = docResult.rows[0];
    expect(savedDoc.number).toBe(res.body.number);
    expect(savedDoc.client_id).toBe(clientId);
    // pg returns DATE columns as a local-midnight JS Date, so format with
    // local getters rather than toISOString() (which would shift by the
    // runner's UTC offset and flip the day).
    const savedDispatchDate = new Date(savedDoc.dispatch_date);
    const formattedDispatchDate = [
      savedDispatchDate.getFullYear(),
      String(savedDispatchDate.getMonth() + 1).padStart(2, '0'),
      String(savedDispatchDate.getDate()).padStart(2, '0'),
    ].join('-');
    expect(formattedDispatchDate).toBe('2026-07-23');
    // insertWzDocument stores an empty note as NULL (`note || null`).
    expect(savedDoc.note).toBeNull();

    // The line items must persist too, so a bug in insertWzDocument's item
    // loop would fail this test rather than slipping through.
    const itemsResult = await pool.query(
      'SELECT * FROM wz_document_items WHERE wz_document_id = $1',
      [res.body.id]
    );
    expect(itemsResult.rows).toHaveLength(1);
    const savedItem = itemsResult.rows[0];
    expect(savedItem.product_id).toBe(10);
    expect(savedItem.name).toBe('Whisky X');
    expect(savedItem.sku).toBe('WX-1');
    expect(Number(savedItem.quantity)).toBe(6);
    expect(savedItem.unit).toBe('szt.');

    // The specific PDF for this document must exist on disk, built the same
    // way the route builds it, not just the (persistent) storage directory.
    const pdfPath = path.join(config.pdfStorageDir, `${res.body.number.replace(/\//g, '-')}.pdf`);
    expect(fs.existsSync(pdfPath)).toBe(true);
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
