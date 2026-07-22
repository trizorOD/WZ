const { pool } = require('../db');
const { nextWzNumber } = require('../services/numbering');

const TEST_YEAR = 8888;

afterEach(async () => {
  await pool.query('DELETE FROM wz_number_counters WHERE year = $1', [TEST_YEAR]);
});

afterAll(async () => {
  await pool.end();
});

describe('nextWzNumber', () => {
  it('starts at sequence 1 and formats the number', async () => {
    const result = await nextWzNumber(TEST_YEAR);
    expect(result).toEqual({ number: `WZ/000001/${TEST_YEAR}`, sequence: 1 });
  });

  it('increments on each call for the same year', async () => {
    await nextWzNumber(TEST_YEAR);
    const second = await nextWzNumber(TEST_YEAR);
    expect(second).toEqual({ number: `WZ/000002/${TEST_YEAR}`, sequence: 2 });
  });

  it('never issues a duplicate sequence under concurrent calls', async () => {
    const results = await Promise.all(
      Array.from({ length: 20 }, () => nextWzNumber(TEST_YEAR))
    );
    const sequences = results.map((r) => r.sequence).sort((a, b) => a - b);
    expect(sequences).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });
});
