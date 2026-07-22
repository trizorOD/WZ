const request = require('supertest');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { pool } = require('../db');
const app = require('../app');

jest.mock('../services/nipLookup');
const { lookupNip } = require('../services/nipLookup');

function authHeader() {
  const token = jwt.sign({ userId: 1, email: 'x@example.com', fullName: 'Test' }, config.jwtSecret);
  return `Bearer ${token}`;
}

afterEach(async () => {
  await pool.query("DELETE FROM clients WHERE nip = '1133105750'");
});

afterAll(async () => {
  await pool.end();
});

describe('GET /clients/lookup/:nip', () => {
  it('fetches from the MF API and saves a new client', async () => {
    lookupNip.mockResolvedValueOnce({
      nip: '1133105750',
      name: 'Example Sp. z o.o.',
      address: 'ul. Testowa 1, 00-001 Warszawa',
      regon: '123456789',
      vatStatus: 'Czynny',
    });

    const res = await request(app)
      .get('/clients/lookup/1133105750')
      .set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Example Sp. z o.o.');
    expect(lookupNip).toHaveBeenCalledWith('1133105750');
  });

  it('returns the cached client without calling the MF API again', async () => {
    lookupNip.mockResolvedValueOnce({
      nip: '1133105750',
      name: 'Example Sp. z o.o.',
      address: 'addr',
      regon: null,
      vatStatus: null,
    });
    await request(app).get('/clients/lookup/1133105750').set('Authorization', authHeader());

    lookupNip.mockClear();
    const res = await request(app)
      .get('/clients/lookup/1133105750')
      .set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(lookupNip).not.toHaveBeenCalled();
  });

  it('returns 404 when the MF API has no match', async () => {
    lookupNip.mockResolvedValueOnce(null);
    const res = await request(app)
      .get('/clients/lookup/0000000000')
      .set('Authorization', authHeader());
    expect(res.status).toBe(404);
  });
});
