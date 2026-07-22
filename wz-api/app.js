const express = require('express');
const authRouter = require('./routes/auth');
const productsRouter = require('./routes/products');
const clientsRouter = require('./routes/clients');
const wzDocumentsRouter = require('./routes/wzDocuments');

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRouter);
app.use('/products', productsRouter);
app.use('/clients', clientsRouter);
app.use('/wz-documents', wzDocumentsRouter);

module.exports = app;
