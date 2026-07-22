const { pool, withTransaction } = require('../db');

async function insertWzDocument({ number, year, sequence, clientId, dispatchDate, note, issuedByUserId, pdfPath, items }) {
  return withTransaction(async (tx) => {
    const docResult = await tx.query(
      `INSERT INTO wz_documents (number, year, sequence, client_id, dispatch_date, note, issued_by_user_id, pdf_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [number, year, sequence, clientId, dispatchDate, note || null, issuedByUserId, pdfPath]
    );
    const document = docResult.rows[0];

    for (const item of items) {
      await tx.query(
        `INSERT INTO wz_document_items (wz_document_id, product_id, name, sku, quantity, unit)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [document.id, item.productId, item.name, item.sku, item.quantity, item.unit]
      );
    }

    return document;
  });
}

async function listWzDocuments({ clientQuery, number } = {}) {
  const conditions = [];
  const params = [];
  let sql = `SELECT d.id, d.number, d.year, d.sequence, d.client_id, d.dispatch_date::text AS dispatch_date,
       d.note, d.issued_by_user_id, d.pdf_path, d.created_at, c.name AS client_name
     FROM wz_documents d JOIN clients c ON c.id = d.client_id`;

  if (clientQuery) {
    params.push(`%${clientQuery}%`);
    conditions.push(`c.name ILIKE $${params.length}`);
  }
  if (number) {
    params.push(`%${number}%`);
    conditions.push(`d.number ILIKE $${params.length}`);
  }
  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }
  sql += ` ORDER BY d.created_at DESC LIMIT 50`;

  const result = await pool.query(sql, params);
  return result.rows;
}

async function getWzDocumentById(id) {
  const result = await pool.query(
    `SELECT d.*, c.name AS client_name FROM wz_documents d JOIN clients c ON c.id = d.client_id WHERE d.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

module.exports = { insertWzDocument, listWzDocuments, getWzDocumentById };
