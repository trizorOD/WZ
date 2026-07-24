// wz-api/app.js
const path = require('path');
const express = require('express');
const authRouter = require('./routes/auth');
const productsRouter = require('./routes/products');
const clientsRouter = require('./routes/clients');
const wzDocumentsRouter = require('./routes/wzDocuments');
const adminUsersRouter = require('./routes/adminUsers');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRouter);
app.use('/products', productsRouter);
app.use('/clients', clientsRouter);
app.use('/wz-documents', wzDocumentsRouter);
app.use('/admin/users', adminUsersRouter);

// Safety net: Express 4 does not forward a rejected promise from an async
// handler to this error middleware automatically, so every route also wraps
// its own body in try/catch. This exists in case a future handler forgets
// to, so a failure still returns a clean response instead of hanging.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
