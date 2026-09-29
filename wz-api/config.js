require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT || '3001', 10),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  baselinker: {
    token: process.env.BL_TOKEN,
    inventoryId: parseInt(process.env.BL_INVENTORY_ID || '0', 10),
  },
  mfNip: {
    baseUrl: process.env.MF_NIP_API_BASE_URL || 'https://wl-api.mf.gov.pl',
  },
  issuer: {
    name: process.env.ISSUER_NAME,
    address: process.env.ISSUER_ADDRESS,
  },
  pdfStorageDir: process.env.PDF_STORAGE_DIR || './storage/pdfs',
};
