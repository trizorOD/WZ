const pdfParse = require('pdf-parse');
const { generateWzPdf } = require('../services/pdf');

describe('generateWzPdf', () => {
  it('produces a PDF containing the document number, client, and items', async () => {
    const buffer = await generateWzPdf({
      number: 'WZ/000001/2026',
      issuedAt: '2026-07-22',
      dispatchDate: '2026-07-23',
      client: { name: 'Example Sp. z o.o.', address: 'ul. Testowa 1, 00-001 Warszawa' },
      issuedByName: 'Jan Kowalski',
      note: '',
      items: [{ sku: 'WX-1', name: 'Whisky X', quantity: 6, unit: 'szt.' }],
    });

    expect(buffer.slice(0, 4).toString()).toBe('%PDF');

    const parsed = await pdfParse(buffer);
    expect(parsed.text).toContain('WZ/000001/2026');
    expect(parsed.text).toContain('Example Sp. z o.o.');
    expect(parsed.text).toContain('Whisky X');
    expect(parsed.text).toContain('Jan Kowalski');
  });
});
