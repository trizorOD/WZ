jest.mock('axios');
const axios = require('axios');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const config = require('../config');
const app = require('../app');

function authHeader() {
  const token = jwt.sign({ userId: 1, email: 'x@example.com', fullName: 'Test' }, config.jwtSecret);
  return `Bearer ${token}`;
}

describe('GET /products', () => {
  it('returns mapped WooCommerce products', async () => {
    axios.get.mockResolvedValueOnce({
      data: [
        { id: 10, name: 'Whisky X', sku: 'WX-1', stock_status: 'instock', stock_quantity: 42 },
      ],
    });

    const res = await request(app)
      .get('/products?search=whisky')
      .set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { id: 10, name: 'Whisky X', sku: 'WX-1', stockStatus: 'instock', stockQuantity: 42 },
    ]);

    expect(axios.get).toHaveBeenCalledWith(
      `${config.woocommerce.baseUrl}/wp-json/wc/v3/products`,
      {
        params: {
          search: 'whisky',
          per_page: 20,
          consumer_key: config.woocommerce.consumerKey,
          consumer_secret: config.woocommerce.consumerSecret,
        },
      }
    );
  });

  it('returns 502 when WooCommerce is unreachable', async () => {
    axios.get.mockRejectedValueOnce(new Error('timeout'));

    const res = await request(app)
      .get('/products?search=whisky')
      .set('Authorization', authHeader());

    expect(res.status).toBe(502);
  });

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/products?search=whisky');
    expect(res.status).toBe(401);
  });
});
