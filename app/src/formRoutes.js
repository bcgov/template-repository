const express = require('express');
const { Pool } = require('pg');
const router = express.Router();
require('dotenv').config();


const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
});

// POST request to add a new form template
router.post('/forms', async (req, res) => {
  const { id, version, ministry_id, lastModified, title, form_id, dataSources, data } = req.body;

  const dataSourcesString = JSON.stringify(dataSources);

  try {

    const existingForm = await pool.query('SELECT id FROM form_templates WHERE id = $1', [id]);

    // If the form already exists
    if (existingForm.rows.length > 0) {
      return res.status(409).send({ id, message: 'Form template already exists' });
    }

    await pool.query('INSERT INTO form_templates (id, version, ministry_id, last_modified, title, form_id, dataSources, data) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [id, version, ministry_id, lastModified, title, form_id, dataSourcesString, data]);
    res.status(201).send({ id, message: 'Form template created successfully!' });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating form template');
  }
});

// GET request to retrieve a form template by UUID
router.get('/forms/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM form_templates WHERE id = $1', [id]);

    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).send('Form template not found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving form template');
  }
});

// GET request to retrieve the form template id with the latest version
router.get('/forms/form_id/:form_id', async (req, res) => {
  const { form_id } = req.params;

  try {
    const result = await pool.query(`SELECT * FROM form_templates WHERE form_id = $1 ORDER BY version DESC LIMIT 1`, [form_id]);

    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).send('Form template not found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving form template');
  }
});

// GET request to list all form templates 
router.get('/forms-list', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM form_templates');

    if (result.rows.length > 0) {
      res.status(200).json(result.rows);
    } else {
      res.status(404).send('No form templates found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving form templates');
  }
});

module.exports = router;
