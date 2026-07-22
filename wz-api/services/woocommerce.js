const axios = require('axios');
const config = require('../config');

async function searchProducts(search) {
  const url = `${config.woocommerce.baseUrl}/wp-json/wc/v3/products`;
  const response = await axios.get(url, {
    params: {
      search,
      per_page: 20,
      consumer_key: config.woocommerce.consumerKey,
      consumer_secret: config.woocommerce.consumerSecret,
    },
  });
  return response.data.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    stockStatus: p.stock_status,
    stockQuantity: p.stock_quantity,
  }));
}

module.exports = { searchProducts };
