jest.mock('axios');
const axios = require('axios');
const { lookupNip } = require('../services/nipLookup');

describe('lookupNip', () => {
  it('parses a found subject', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        result: {
          subject: {
            nip: '1133105750',
            name: 'Example Sp. z o.o.',
            workingAddress: 'ul. Testowa 1, 00-001 Warszawa',
            regon: '123456789',
            statusVat: 'Czynny',
          },
        },
      },
    });

    const result = await lookupNip('1133105750');
    expect(result).toEqual({
      nip: '1133105750',
      name: 'Example Sp. z o.o.',
      address: 'ul. Testowa 1, 00-001 Warszawa',
      regon: '123456789',
      vatStatus: 'Czynny',
    });
  });

  it('returns null when no subject is found', async () => {
    axios.get.mockResolvedValueOnce({ data: { result: { subject: null } } });
    const result = await lookupNip('0000000000');
    expect(result).toBeNull();
  });
});
