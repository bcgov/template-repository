const express = require('express');
const router = express.Router();
const db = require('./db');
const { protectedRoute } = require('@bcgov/citz-imb-sso-express');
const multer = require('multer');
const FormData = require('form-data');
const { v4: uuidv4 } = require('uuid');

const upload = multer();

const PETS_BASE_URL = process.env.PETS_BASE_URL;


// POST request to add a new form template
router.post('/forms', async (req, res) => {
  try {
    let formData;
    if (req.body.formversion) {
      // Version 2: nested under formversion
      const fv = req.body.formversion;
      formData = {
        id: fv.id,
        version: fv.version,
        ministry_id: fv.ministry_id,
        last_modified: fv.data?.updated_at || fv.data?.created_at,
        title: fv.name,
        form_id: fv.form_id,
        deployed_to: fv.deployed_to || '',
        dataSources: fv.dataSources,
        data: fv.elements, // elements array becomes data
        interface: fv.interface,
        scripts: fv.scripts || [],
        styles: fv.styles || [],
      };
    } else {
      // Version 1: fields at root level
      formData = {
        id: req.body.id,
        version: req.body.version,
        ministry_id: req.body.ministry_id,
        last_modified: req.body.lastModified || req.body.last_modified,
        title: req.body.title,
        form_id: req.body.form_id,
        deployed_to: req.body.deployed_to || '',
        dataSources: req.body.dataSources,
        data: req.body.data?.items || req.body.data, // handle data.items or direct data
        interface: req.body.interface,
        scripts: req.body.scripts || [],
        styles: req.body.styles || [],
      };
    }

    if (!formData.id) {
      formData.id = uuidv4();
    }

    const existingForm = await db('form_templates').where({ id: formData.id }).first();

    if (existingForm) {
      return res.status(409).send({ id: formData.id, message: 'Form template already exists' });
    }

    await db('form_templates').insert({
      id: formData.id,
      version: formData.version,
      ministry_id: formData.ministry_id,
      last_modified: formData.last_modified,
      title: formData.title,
      form_id: formData.form_id,
      deployed_to: formData.deployed_to,
      dataSources: formData.dataSources ? JSON.stringify(formData.dataSources) : null,
      data: formData.data ? JSON.stringify(formData.data) : JSON.stringify([]),
      interface: formData.interface ? JSON.stringify(formData.interface) : JSON.stringify([]),
      scripts: formData.scripts ? JSON.stringify(formData.scripts) : JSON.stringify([]),
      styles: formData.styles ? JSON.stringify(formData.styles) : JSON.stringify([]),
    });

    res.status(201).send({ id: formData.id, message: 'Form template created successfully!' });

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
      // Transform back to original format
      const response = {
        formversion: {
          id: result.id,
          name: result.title,
          form_id: result.form_id,
          version: result.version,
          status: 'draft',
          data: {
            form_id: result.form_id,
            form_developer: {},
            comments: '',
            created_at: result.last_modified,
            updated_at: result.last_modified
          },
          ministry_id: result.ministry_id,
          dataSources: typeof result.dataSources === 'string' ? JSON.parse(result.dataSources) : result.dataSources,
          interface: typeof result.interface === 'string' ? JSON.parse(result.interface) : result.interface,
          scripts: typeof result.scripts === 'string' ? JSON.parse(result.scripts) : (result.scripts || []),
          styles: typeof result.styles === 'string' ? JSON.parse(result.styles) : (result.styles || []),
          elements: typeof result.data === 'string' ? JSON.parse(result.data) : result.data
        }
      };
      res.status(200).json(response);
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
      // Transform back to original format
      const response = {
        formversion: {
          id: result.id,
          name: result.title,
          form_id: result.form_id,
          version: result.version,
          status: 'draft',
          data: {
            form_id: result.form_id,
            form_developer: {},
            comments: '',
            created_at: result.last_modified,
            updated_at: result.last_modified
          },
          ministry_id: result.ministry_id,
          dataSources: typeof result.dataSources === 'string' ? JSON.parse(result.dataSources) : result.dataSources,
          interface: typeof result.interface === 'string' ? JSON.parse(result.interface) : result.interface,
          scripts: typeof result.scripts === 'string' ? JSON.parse(result.scripts) : (result.scripts || []),
          styles: typeof result.styles === 'string' ? JSON.parse(result.styles) : (result.styles || []),
          elements: typeof result.data === 'string' ? JSON.parse(result.data) : result.data
        }
      };
      res.status(200).json(response);
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
    const results = await db('form_templates').select('*');

    if (results.length > 0) {
      // Transform each result back to original format
      const transformedResults = results.map(result => ({
        formversion: {
          id: result.id,
          name: result.title,
          form_id: result.form_id,
          version: result.version,
          status: 'draft',
          data: {
            form_id: result.form_id,
            form_developer: {},
            comments: '',
            created_at: result.last_modified,
            updated_at: result.last_modified
          },
          ministry_id: result.ministry_id,
          dataSources: typeof result.dataSources === 'string' ? JSON.parse(result.dataSources) : result.dataSources,
          interface: typeof result.interface === 'string' ? JSON.parse(result.interface) : result.interface,
          scripts: typeof result.scripts === 'string' ? JSON.parse(result.scripts) : (result.scripts || []),
          styles: typeof result.styles === 'string' ? JSON.parse(result.styles) : (result.styles || []),
          elements: typeof result.data === 'string' ? JSON.parse(result.data) : result.data
        }
      }));
      res.status(200).json(transformedResults);
    } else {
      res.status(404).send('No form templates found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving form templates');
  }
});

// GET request to list all pdf templates
router.get('/pdf-templates-list', protectedRoute(), async (req, res) => {
  try {
    const result = await db('pdf_templates').select('*');

    if (result.length > 0) {
      res.status(200).json(result);
    } else {
      res.status(404).send('No pdf templates found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving pdf templates');
  }
});

// PUT request to update the deployed status of a form
router.put('/forms/update', protectedRoute(), async (req, res) => {
  const { form_id, id, deployed_to,pdf_template_id } = req.body;

  try {
    // Clear deployed_to for other forms with the same form_id
    await db('form_templates')
      .where({ form_id })
      .andWhereNot({ id })
      .andWhere({ deployed_to })
      .update({ deployed_to: "" });

    // Update the deployed_to status for the specified form
    const result = await db('form_templates')
      .where({ id })
      .update({ deployed_to, pdf_template_id });

    if (result > 0) {
      res.status(200).send({ id, message: 'Form version updated successfully!' });
    } else {
      res.status(404).send('Form template not found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating deployed status');
  }
});

router.post('/newPETStemplate', protectedRoute(), upload.single('libre_office_template'), async (req, res) => {
    try {
      const {
        pdf_template_name,
        pdf_template_version,
        pdf_template_notes
      } = req.body;
      const file = req.file;
      if (!file || !pdf_template_name || !pdf_template_version) {
        return res
          .status(400)
          .send('name, version and template file are all required');
      }

      // 1) forward the file to the PETS service
      const form = new FormData();
      form.append('template', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });
      
      const petsRes = await fetch(`${PETS_BASE_URL}/api/v2/template`, {
        method: 'POST',
        headers: form.getHeaders(),
        body: form,
      });
      if (!petsRes.ok) {
        throw new Error(`PETS service error: ${petsRes.status}`);
      }
      const template_uuid = (await petsRes.text()).trim();

      // 2) insert into pdf_templates
      const id = uuidv4();
      await db('pdf_templates').insert({
        id,
        name: pdf_template_name,
        version: pdf_template_version,
        template_uuid,
        notes: pdf_template_notes || null
      });

      return res
        .status(201)
        .json({ id, message: 'PDF template saved successfully' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }
);

router.get('/template/:template_uuid', protectedRoute(), async (req, res) => {
  try {
    const { template_uuid } = req.params;

    const petsUrl = `${PETS_BASE_URL}/api/v2/template/${template_uuid}?download=true`;
    const petsRes = await fetch(petsUrl);

    if (!petsRes.ok) {
      return res.status(petsRes.status).send(`PETS returned ${petsRes.status}`);
    }

    const contentType = petsRes.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    // Determine extension based on content-type
    const extension = contentType.includes('opendocument') ? 'odt'
                    : contentType.includes('wordprocessingml') ? 'docx'
                    : 'bin';

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${template_uuid}.${extension}"`
    );

    petsRes.body.pipe(res);
  } catch (err) {
    console.error('Error proxying template download:', err);
    res.status(500).send('Internal error fetching template');
  }
});

router.post('/pdfRender/:id', protectedRoute(), async (req, res) => {
  try {
    const { id } = req.params;

    // 2) look up the real template_uuid in your table
    const row = await db('pdf_templates')
                      .select('template_uuid')
                      .where({ id })
                      .first();

    if (!row) {
      return res.status(404).send('PDF template not found');
    }

    const realUuid = row.template_uuid;

    const clientPayload = req.body;
 
    const payload = {
      ...clientPayload,
      options: {
        convertTo: "pdf",
        overwrite: true,
        // if the client also sent options, and you want to preserve them:
        // ...(clientPayload.options || {})
      }
    };

    const petsUrl = `${PETS_BASE_URL}/api/v2/template/${realUuid}/render`;
    const petsRes = await fetch(petsUrl, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        // add any auth headers here if PETS needs them
      },
      body:    JSON.stringify(payload),
    });

    if (!petsRes.ok) {
      return res.status(petsRes.status).send(`PETS returned ${petsRes.status}`);
    }

    const contentType = petsRes.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    // Determine extension based on content-type
    const extension = contentType.includes('opendocument') ? 'odt'
                    : contentType.includes('wordprocessingml') ? 'docx'
                    : 'bin';

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${realUuid}.${extension}"`
    );

    petsRes.body.pipe(res);
  } catch (err) {
    console.error('Error proxying template download:', err);
    res.status(500).send('Internal error fetching template');
  }
});



module.exports = router;
