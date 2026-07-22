const express = require('express');
const fs = require('fs');
const path = require('path');
const { requireAuth } = require('../middleware/auth');
const config = require('../config');
const { nextWzNumber } = require('../services/numbering');
const { generateWzPdf } = require('../services/pdf');
const { findClientById } = require('../repositories/clients');
const { insertWzDocument, listWzDocuments, getWzDocumentById } = require('../repositories/wzDocuments');

const router = express.Router();

router.post('/', requireAuth, async (req, res) => {
  const { clientId, dispatchDate, note, items } = req.body;

  if (!clientId || !dispatchDate || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'clientId, dispatchDate and at least one item are required' });
  }

  try {
    const client = await findClientById(clientId);
    if (!client) return res.status(404).json({ error: 'Client not found' });

    const year = new Date().getFullYear();
    // If anything below fails after a number is issued here, that number is
    // intentionally left unused rather than reused/reclaimed. The spec only
    // requires uniqueness + monotonicity under concurrency, not gapless
    // contiguity, and a WZ is not a fiscal invoice, so a gap is acceptable.
    const { number, sequence } = await nextWzNumber(year);
    const issuedAt = new Date().toISOString().slice(0, 10);

    const pdfBuffer = await generateWzPdf({
      number,
      issuedAt,
      dispatchDate,
      client: { name: client.name, address: client.address },
      issuedByName: req.user.fullName,
      note,
      items,
    });

    fs.mkdirSync(config.pdfStorageDir, { recursive: true });
    const pdfPath = path.join(config.pdfStorageDir, `${number.replace(/\//g, '-')}.pdf`);
    fs.writeFileSync(pdfPath, pdfBuffer);

    const document = await insertWzDocument({
      number,
      year,
      sequence,
      clientId,
      dispatchDate,
      note,
      issuedByUserId: req.user.userId,
      pdfPath,
      items,
    });

    res.status(201).json({ id: document.id, number: document.number, pdfUrl: `/wz-documents/${document.id}/pdf` });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to create WZ document', err);
    res.status(500).json({ error: 'Failed to create WZ document' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const documents = await listWzDocuments({ clientQuery: req.query.client, number: req.query.number });
    res.json(documents);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to list WZ documents', err);
    res.status(500).json({ error: 'Failed to list WZ documents' });
  }
});

router.get('/:id/pdf', requireAuth, async (req, res) => {
  try {
    const document = await getWzDocumentById(req.params.id);
    if (!document) return res.status(404).json({ error: 'Document not found' });
    res.sendFile(path.resolve(document.pdf_path));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch WZ document PDF', err);
    res.status(500).json({ error: 'Failed to fetch WZ document PDF' });
  }
});

module.exports = router;
