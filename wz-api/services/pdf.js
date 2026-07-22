const PDFDocument = require('pdfkit');
const config = require('../config');

function generateWzPdf(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text(`WZ nr ${data.number}`);
    doc.moveDown();

    doc.fontSize(10);
    doc.text(`Wystawiony przez: ${config.issuer.name}`);
    doc.text(config.issuer.address);
    doc.moveDown();

    doc.text(`Odbiorca: ${data.client.name}`);
    doc.text(data.client.address);
    doc.moveDown();

    doc.text(`Data wystawienia: ${data.issuedAt}`);
    doc.text(`Data wydania: ${data.dispatchDate}`);
    doc.moveDown();

    doc.fontSize(11).text('Lp.  Kod towaru   Nazwa towaru   Ilosc   Jednostka');
    doc.fontSize(10);
    data.items.forEach((item, index) => {
      doc.text(`${index + 1}.  ${item.sku}   ${item.name}   ${item.quantity}   ${item.unit}`);
    });
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
