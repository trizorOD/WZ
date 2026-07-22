const PDFDocument = require('pdfkit');
const config = require('../config');

const fontPath = require.resolve('dejavu-fonts-ttf/ttf/DejaVuSans.ttf');

function generateWzPdf(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.font(fontPath);

    doc.fontSize(18).text(`WZ nr ${data.number}`);
    doc.moveDown();

    // Two-column header: recipient on the left, issuer on the right.
    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const colGap = 20;
    const colWidth = (right - left - colGap) / 2;
    const leftX = left;
    const rightX = left + colWidth + colGap;
    const headerTop = doc.y;

    doc.fontSize(10);
    doc.text('Odbiorca:', leftX, headerTop, { width: colWidth });
    doc.text(data.client.name, leftX, doc.y, { width: colWidth });
    doc.text(data.client.address, leftX, doc.y, { width: colWidth });
    const leftBottom = doc.y;

    doc.text('Wystawiony przez:', rightX, headerTop, { width: colWidth });
    doc.text(config.issuer.name, rightX, doc.y, { width: colWidth });
    doc.text(config.issuer.address, rightX, doc.y, { width: colWidth });
    const rightBottom = doc.y;

    doc.x = left;
    doc.y = Math.max(leftBottom, rightBottom);
    doc.moveDown();

    doc.text(`Data wystawienia: ${data.issuedAt}`);
    doc.text(`Data wydania: ${data.dispatchDate}`);
    doc.moveDown();

    // Item table.
    const colLp = left;
    const colKod = colLp + 25;
    const colNazwa = colKod + 110;
    const colIlosc = colNazwa + 190;
    const colJednostka = colIlosc + 50;
    const kodWidth = colNazwa - colKod - 10;
    const nazwaWidth = colIlosc - colNazwa - 10;
    const iloscWidth = colJednostka - colIlosc - 10;
    const jednostkaWidth = right - colJednostka;

    function drawRow(y, lp, kod, nazwa, ilosc, jednostka) {
      doc.text(lp, colLp, y, { width: colKod - colLp });
      doc.text(kod, colKod, y, { width: kodWidth });
      doc.text(nazwa, colNazwa, y, { width: nazwaWidth });
      doc.text(ilosc, colIlosc, y, { width: iloscWidth });
      doc.text(jednostka, colJednostka, y, { width: jednostkaWidth });
    }

    doc.fontSize(10);
    const tableTop = doc.y;
    drawRow(tableTop, 'Lp.', 'Kod towaru', 'Nazwa towaru', 'Ilosc', 'Jednostka');
    let rowY = tableTop + doc.heightOfString('Lp.', { width: colKod - colLp }) + 4;
    doc.moveTo(left, rowY).lineTo(right, rowY).stroke();
    rowY += 6;

    data.items.forEach((item, index) => {
      const rowHeight = Math.max(
        doc.heightOfString(item.sku, { width: kodWidth }),
        doc.heightOfString(item.name, { width: nazwaWidth }),
        12
      );
      drawRow(rowY, `${index + 1}.`, item.sku, item.name, String(item.quantity), item.unit);
      rowY += rowHeight + 6;
    });

    doc.moveTo(left, rowY).lineTo(right, rowY).stroke();
    doc.x = left;
    doc.y = rowY + 10;
    doc.moveDown();

    const totalQuantity = data.items.reduce((sum, item) => sum + Number(item.quantity), 0);
    doc.text(`Suma: ${totalQuantity}`);
    doc.moveDown();

    if (data.note) {
      doc.text(`Uwagi: ${data.note}`);
      doc.moveDown();
    }

    doc.text(`Wystawil(a): ${data.issuedByName}`);
    doc.moveDown(3);

    doc.text('Podpis osoby wydajacej: ..........................          Podpis osoby odbierajacej towar: ..........................');

    doc.end();
  });
}

module.exports = { generateWzPdf };
