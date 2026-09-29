jest.mock('axios');
const axios = require('axios');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const config = require('../config');
const app = require('../app');
const { resetWarehouseCache } = require('../services/baselinker');

const BASELINKER_URL = 'https://api.baselinker.com/connector.php';

function authHeader() {
  const token = jwt.sign({ userId: 1, email: 'x@example.com', fullName: 'Test' }, config.jwtSecret);
  return `Bearer ${token}`;
}

const warehousesResponse = {
  status: 'SUCCESS',
  warehouses: [
    { warehouse_type: 'bl', warehouse_id: 48933, name: 'Default' },
    { warehouse_type: 'bl', warehouse_id: 52045, name: 'Annopol' },
  ],
};

function productsResponse(products) {
  return {
    status: 'SUCCESS',
    products: Object.fromEntries(products.map((p) => [String(p.id), p])),
  };
}

// Routes mocked axios.post calls by BaseLinker method.
function mockBaseLinker({ products = [], warehouses = warehousesResponse } = {}) {
  axios.post.mockImplementation(async (url, body) => {
    const method = body.get('method');
    if (method === 'getInventoryWarehouses') return { data: warehouses };
    if (method === 'getInventoryProductsList') {
      return { data: productsResponse(products) };
    }
    throw new Error(`unexpected method ${method}`);
  });
}

function callsFor(method) {
  return axios.post.mock.calls.filter(([, body]) => body.get('method') === method);
}

describe('GET /products', () => {
  beforeEach(() => {
    axios.post.mockReset();
    resetWarehouseCache();
  });

  it('returns BaseLinker products with per-warehouse and total stock', async () => {
    mockBaseLinker({
      products: [{ id: 10, name: 'Whisky X', sku: 'WX-1', stock: { bl_48933: 10, bl_52045: 3 } }],
    });

    const res = await request(app)
      .get('/products?search=whisky')
      .set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        id: 10,
        name: 'Whisky X',
        sku: 'WX-1',
        stockQuantity: 13,
        stocks: [
          { warehouseId: 'bl_48933', name: 'Default', quantity: 10 },
          { warehouseId: 'bl_52045', name: 'Annopol', quantity: 3 },
        ],
      },
    ]);

    const [url, body, options] = callsFor('getInventoryProductsList')[0];
    expect(url).toBe(BASELINKER_URL);
    expect(options.headers['X-BLToken']).toBe(config.baselinker.token);
    expect(JSON.parse(body.get('parameters')).inventory_id).toBe(config.baselinker.inventoryId);
  });

  it('searches by product name only', async () => {
    mockBaseLinker();

    await request(app)
      .get('/products?search=whisky')
      .set('Authorization', authHeader());

    const calls = callsFor('getInventoryProductsList');
    expect(calls).toHaveLength(1);
    const parameters = JSON.parse(calls[0][1].get('parameters'));
    expect(parameters.filter_name).toBe('whisky');
    expect(parameters).not.toHaveProperty('filter_sku');
  });

  it('limits results to 20 products', async () => {
    const many = Array.from({ length: 30 }, (_, i) => ({
      id: i + 1, name: `P${i}`, sku: `S${i}`, stock: { bl_48933: 0, bl_52045: 0 },
    }));
    mockBaseLinker({ products: many });

    const res = await request(app)
      .get('/products?search=p')
      .set('Authorization', authHeader());

    expect(res.body).toHaveLength(20);
  });

  it('caches warehouse names between requests', async () => {
    mockBaseLinker();

    await request(app).get('/products?search=a').set('Authorization', authHeader());
    await request(app).get('/products?search=b').set('Authorization', authHeader());

    expect(callsFor('getInventoryWarehouses')).toHaveLength(1);
  });

  it('returns 502 when BaseLinker responds with an error status', async () => {
    axios.post.mockResolvedValue({ data: { status: 'ERROR', error_code: 'ERROR_BAD_TOKEN', error_message: 'Invalid token' } });

    const res = await request(app)
      .get('/products?search=whisky')
      .set('Authorization', authHeader());

    expect(res.status).toBe(502);
    expect(res.body).toEqual({ error: 'BaseLinker unavailable' });
  });

  it('returns 502 when BaseLinker is unreachable', async () => {
    axios.post.mockRejectedValue(new Error('timeout'));

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
