const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { searchProducts } = require('../services/woocommerce');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const search = req.query.search || '';
  try {
    const products = await searchProducts(search);
    res.json(products);
  } catch (err) {
    console.error('WooCommerce products search failed:', err);
    res.status(502).json({ error: 'WooCommerce unavailable' });
  }
});

module.exports = router;
