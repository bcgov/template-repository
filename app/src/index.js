require('dotenv').config();

const fetch = require('node-fetch');
const express = require('express');
const path = require('path');
const formRoutes = require('./formRoutes');
const { protectedRoute } = require('@bcgov/citz-imb-sso-express');
const { sso } = require('@bcgov/citz-imb-sso-express');

// Debug log to verify app startup
console.log('Starting application...');

// Debug log to verify environment variables
console.log('Environment variables:', {
  APP_PORT: process.env.APP_PORT,
  POSTGRES_HOST: process.env.POSTGRES_HOST,
  POSTGRES_USER: process.env.POSTGRES_USER,
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
  POSTGRES_DB: process.env.POSTGRES_DB,
  POSTGRES_PORT: process.env.POSTGRES_PORT,
});

const app = express();
const port = process.env.APP_PORT;

// Debug log to verify port configuration
console.log('Configured port:', port);

global.fetch = fetch;

console.log('Setting up SSO...');
sso(app, {
  afterUserLogin: (user) => {
    console.log(`User logged in: ${user.display_name}`);
  },
  afterUserLogout: (user) => {
    console.log(`User logged out: ${user.display_name}`);
  },
});
console.log('SSO setup complete.');

// Health check
app.get('/health', (req, res) => {
  console.log('Health check endpoint hit.');
  res.status(200).send('OK');
});

app.use(express.json());

// Debug log before setting up form routes
console.log('Setting up form routes...');
app.use('/api', protectedRoute(), formRoutes);
console.log('Form routes setup complete.');

// Debug middleware for incoming requests
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

app.use(express.static(path.join(__dirname, '../client/build')));

// Debug log for handling wildcard route
console.log('Setting up wildcard route for static files...');
app.get('*', (req, res) => {
  console.log('Wildcard route hit.');
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Starting the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
