const express = require('express');
const router = express.Router();
const db = require('./db');
const { protectedRoute } = require('@bcgov/citz-imb-sso-express');

// POST request to add a new form template
router.post('/forms', async (req, res) => {
  const { id, version, ministry_id, lastModified, title, form_id, deployed_to, dataSources, data } = req.body;

  try {
    const existingForm = await db('form_templates').where({ id }).first();

    if (existingForm) {
      return res.status(409).send({ id, message: 'Form template already exists' });
    }

    await db('form_templates').insert({
      id,
      version,
      ministry_id,
      last_modified: lastModified,
      title,
      form_id,
      deployed_to,
      dataSources: JSON.stringify(dataSources),
      data,
    });

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
    const result = await db('form_templates').where({ id }).first();

    if (result) {
      res.status(200).json(result);
    } else {
      res.status(404).send('Form template not found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving form template');
  }
});

// GET request to retrieve the form template by deployment status or latest version
router.get('/forms/form_id/:form_id', async (req, res) => {
  const { form_id } = req.params;

  try {
    const result = await db('form_templates')
      .where({ form_id })
      .orderByRaw(`
        CASE 
          WHEN deployed_to = 'prod' THEN 1
          WHEN deployed_to = 'test' THEN 2
          WHEN deployed_to = 'dev' THEN 3
          ELSE 4
        END,
        CAST(version AS INTEGER) DESC
      `)
      .first();

    if (result) {
      res.status(200).json(result);
    } else {
      res.status(404).send('Form template not found');
    }
  } catch (err) {
    console.error('Error retrieving form template:', err);
    res.status(500).send('Error retrieving form template');
  }
});

// GET request to list all form templates
router.get('/forms-list', protectedRoute(), async (req, res) => {
  try {
    const result = await db('form_templates').select('*');

    if (result.length > 0) {
      res.status(200).json(result);
    } else {
      res.status(404).send('No form templates found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving form templates');
  }
});

// PUT request to update the deployed status of a form
router.put('/forms/update', protectedRoute(), async (req, res) => {
  const { form_id, id, deployed_to } = req.body;

  try {
    // Clear deployed_to for other forms with the same form_id
    await db('form_templates')
      .where({ form_id })
      .andWhereNot({ id })
      .update({ deployed_to: "" });

    // Update the deployed_to status for the specified form
    const result = await db('form_templates')
      .where({ id })
      .update({ deployed_to });

    if (result > 0) {
      res.status(200).send({ id, message: 'Deployed status updated successfully!' });
    } else {
      res.status(404).send('Form template not found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating deployed status');
  }
});

module.exports = router;
