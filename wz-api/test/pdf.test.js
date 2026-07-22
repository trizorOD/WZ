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

  it('renders Polish diacritics correctly instead of corrupting them', async () => {
    const buffer = await generateWzPdf({
      number: 'WZ/000002/2026',
      issuedAt: '2026-07-22',
      dispatchDate: '2026-07-23',
      client: { name: 'Żabka Łódź Sp. z o.o.', address: 'ul. Świętokrzyska 1, Kraków' },
      issuedByName: 'Jan Kowalski',
      note: 'ąęłńóśźż ĄĘŁŃÓŚŹŻ',
      items: [{ sku: 'WX-1', name: 'Żółta Górka', quantity: 6, unit: 'szt.' }],
    });

    expect(buffer.slice(0, 4).toString()).toBe('%PDF');

    const parsed = await pdfParse(buffer);
    expect(parsed.text).toContain('Żabka Łódź Sp. z o.o.');
    expect(parsed.text).toContain('ul. Świętokrzyska 1, Kraków');
    expect(parsed.text).toContain('Żółta Górka');
    expect(parsed.text).toContain('ąęłńóśźż ĄĘŁŃÓŚŹŻ');
  });

  it('places the recipient on the left and the issuer on the right, on the same row', async () => {
    const buffer = await generateWzPdf({
      number: 'WZ/000003/2026',
      issuedAt: '2026-07-22',
      dispatchDate: '2026-07-23',
      client: { name: 'Example Sp. z o.o.', address: 'ul. Testowa 1, 00-001 Warszawa' },
      issuedByName: 'Jan Kowalski',
      note: '',
      items: [{ sku: 'WX-1', name: 'Whisky X', quantity: 6, unit: 'szt.' }],
    });

    let items = [];
    await pdfParse(buffer, {
      pagerender: async (pageData) => {
        const content = await pageData.getTextContent();
        items = content.items.map((item) => ({
          str: item.str,
          x: item.transform[4],
          y: item.transform[5],
        }));
        return '';
      },
    });

    const odbiorcaLabel = items.find((i) => i.str === 'Odbiorca:');
    const wystawionyLabel = items.find((i) => i.str === 'Wystawiony przez:');

    expect(odbiorcaLabel).toBeDefined();
    expect(wystawionyLabel).toBeDefined();
    expect(odbiorcaLabel.y).toBeCloseTo(wystawionyLabel.y, 0);
    expect(odbiorcaLabel.x).toBeLessThan(wystawionyLabel.x);
  });

  it('does not wrap a long numeric SKU onto a second line that overlaps the next row', async () => {
    const buffer = await generateWzPdf({
      number: 'WZ/000004/2026',
      issuedAt: '2026-07-22',
      dispatchDate: '2026-07-23',
      client: { name: 'Example Sp. z o.o.', address: 'ul. Testowa 1, 00-001 Warszawa' },
      issuedByName: 'Jan Kowalski',
      note: '',
      items: [
        { sku: '9512870000976', name: 'Islay Whisky Set', quantity: 2, unit: 'szt.' },
        { sku: '9512870000832', name: 'Nikka Coffey Malt Whisky 45% 0.7l Box', quantity: 1, unit: 'szt.' },
        { sku: '3700597306383', name: 'Nikka Days Whisky 40% 0,7l Box', quantity: 3, unit: 'szt.' },
      ],
    });

    let items = [];
    await pdfParse(buffer, {
      pagerender: async (pageData) => {
        const content = await pageData.getTextContent();
        items = content.items.map((item) => ({ str: item.str, x: item.transform[4], y: item.transform[5] }));
        return '';
      },
    });

    // Each 13-digit SKU must appear as a single, unbroken text run — if the
    // column were too narrow it would wrap into two shorter fragments
    // instead, neither of which equals the full SKU string.
    expect(items.some((i) => i.str === '9512870000976')).toBe(true);
    expect(items.some((i) => i.str === '9512870000832')).toBe(true);
    expect(items.some((i) => i.str === '3700597306383')).toBe(true);

    // The three row markers must be in strictly descending y order (PDF
    // y-axis points up), proving rows never collapse into or overlap
    // whatever the previous row's content wrapped to.
    const rowOne = items.find((i) => i.str === '1.');
    const rowTwo = items.find((i) => i.str === '2.');
    const rowThree = items.find((i) => i.str === '3.');
    expect(rowOne.y).toBeGreaterThan(rowTwo.y);
    expect(rowTwo.y).toBeGreaterThan(rowThree.y);
  });
});
