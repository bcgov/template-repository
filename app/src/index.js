require('dotenv').config();

const fetch = require('node-fetch');
const express = require('express');
const path = require('path');
const formRoutes = require('./formRoutes');
const { protectedRoute } = require('@bcgov/citz-imb-sso-express');
const { sso } = require('@bcgov/citz-imb-sso-express');

const app = express();
const port = process.env.APP_PORT;

global.fetch = fetch;

sso(app, {
  afterUserLogin: (user) => {
    console.log(`User logged in: ${user.display_name}`);
  },
  afterUserLogout: (user) => {
    console.log(`User logged out: ${user.display_name}`);
  },
});

//Health check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.use(express.json());

app.use('/api', protectedRoute(), formRoutes);

app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

app.use(express.static(path.join(__dirname, '../client/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

const host = process.env.HOST || 'localhost';
app.listen(port, host, () => {
  console.log(`Server running on http://${host}:${port}`);
});