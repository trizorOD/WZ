const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { lookupNip } = require('../services/nipLookup');
const { findClientByNip, searchClients, insertClient, upsertClient } = require('../repositories/clients');

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

router.post('/', requireAuth, async (req, res) => {
  const { nip, name, address, regon } = req.body;
  if (!nip || !name || !address) {
    return res.status(400).json({ error: 'nip, name and address are required' });
  }
  try {
    let client;
    try {
      client = await insertClient({ nip, name, address, regon });
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'Client with this NIP already exists' });
      }
      throw err;
    }
    res.status(201).json(client);
  } catch (err) {
    console.error('Manual client creation failed:', err);
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
