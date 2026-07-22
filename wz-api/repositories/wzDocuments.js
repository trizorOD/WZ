const { withTransaction } = require('../db');

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

module.exports = { insertWzDocument };
