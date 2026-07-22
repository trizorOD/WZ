const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { lookupNip } = require('../services/nipLookup');
const { findClientByNip, searchClients, upsertClient } = require('../repositories/clients');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const query = req.query.query || '';
  try {
    const clients = await searchClients(query);
    res.json(clients);
  } catch (err) {
    console.error('Client search failed:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/lookup/:nip', requireAuth, async (req, res) => {
  const { nip } = req.params;
  try {
    const existing = await findClientByNip(nip);
    if (existing && req.query.refresh !== 'true') {
      return res.json(existing);
    }
    try {
      const data = await lookupNip(nip);
      if (!data) return res.status(404).json({ error: 'NIP not found' });
      const client = await upsertClient(data);
      res.json(client);
    } catch (err) {
      res.status(502).json({ error: 'MF NIP lookup unavailable' });
    }
  } catch (err) {
    console.error('Client NIP lookup failed:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
