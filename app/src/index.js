require('dotenv').config();

const fetch = require('node-fetch');
const express = require('express');
const path = require('path');
const formRoutes = require('./routes/formRoutes');
const { protectedRoute } = require('@bcgov/citz-imb-sso-express');
const { sso } = require('@bcgov/citz-imb-sso-express');
const { HTTP_STATUS } = require('./constants');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const port = process.env.APP_PORT;

global.fetch = fetch;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

sso(app, {
  afterUserLogin: (user) => {
    console.log(`User logged in: ${user.display_name}`);
  },
  afterUserLogout: (user) => {
    console.log(`User logged out: ${user.display_name}`);
  },
});

app.use((req, res, next) => {
  if (!(req.method === 'GET' && req.path === '/health')) {
    console.log(`Incoming request: ${req.method} ${req.url}`);
  }
  next();
});

app.get('/health', (_req, res) => {
  res.sendStatus(HTTP_STATUS.OK);
});

app.use('/api', protectedRoute(), formRoutes);

app.use(express.static(path.join(__dirname, '../client/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
