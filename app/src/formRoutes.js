const express = require('express');
const router = express.Router();
const db = require('./db');
const { protectedRoute } = require('@bcgov/citz-imb-sso-express');
const multer = require('multer');
const FormData = require('form-data');
const { v4: uuidv4 } = require('uuid');
const {
  TABLE_NAMES,
  DEPLOYMENT_STATUS,
  DEPLOYMENT_PRIORITY,
  HTTP_STATUS,
} = require('./constants');

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
        deployed_to: fv.deployed_to || DEPLOYMENT_STATUS.NONE,
        dataSources: fv.dataSources,
        data: fv.elements, // elements array becomes data
        interface: fv.interface,
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
        deployed_to: req.body.deployed_to || DEPLOYMENT_STATUS.NONE,
        dataSources: req.body.dataSources,
        data: req.body.data?.items || req.body.data, // handle data.items or direct data
        interface: req.body.interface,
      };
    }

    if (!formData.id) {
      formData.id = uuidv4();
    }

    const existingForm = await db(TABLE_NAMES.FORM_TEMPLATES).where({ id: formData.id }).first();

    if (existingForm) {
      return res.status(HTTP_STATUS.CONFLICT).send({ id: formData.id, message: 'Form template already exists' });
    }

    await db(TABLE_NAMES.FORM_TEMPLATES).insert({
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
    });

    res.status(HTTP_STATUS.CREATED).send({ id: formData.id, message: 'Form template created successfully!' });

  } catch (err) {
    console.error(err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Error creating form template');
  }
});

// GET request to retrieve a form template by UUID
router.get('/forms/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db(TABLE_NAMES.FORM_TEMPLATES).where({ id }).first();

    if (result) {
      res.status(HTTP_STATUS.OK).json(result);
    } else {
      res.status(HTTP_STATUS.NOT_FOUND).send('Form template not found');
    }
  } catch (err) {
    console.error(err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Error retrieving form template');
  }
});

// GET request to retrieve the form template by deployment status or latest version
router.get('/forms/form_id/:form_id', async (req, res) => {
  const { form_id } = req.params;

  try {
    const result = await db(TABLE_NAMES.FORM_TEMPLATES)
      .where({ form_id })
      .orderByRaw(`
        CASE
          WHEN deployed_to = '${DEPLOYMENT_STATUS.PROD}' THEN ${DEPLOYMENT_PRIORITY[DEPLOYMENT_STATUS.PROD]}
          WHEN deployed_to = '${DEPLOYMENT_STATUS.TEST}' THEN ${DEPLOYMENT_PRIORITY[DEPLOYMENT_STATUS.TEST]}
          WHEN deployed_to = '${DEPLOYMENT_STATUS.DEV}' THEN ${DEPLOYMENT_PRIORITY[DEPLOYMENT_STATUS.DEV]}
          ELSE ${DEPLOYMENT_PRIORITY[DEPLOYMENT_STATUS.NONE]}
        END,
        CAST(version AS INTEGER) DESC
      `)
      .first();

    if (result) {
      res.status(HTTP_STATUS.OK).json(result);
    } else {
      res.status(HTTP_STATUS.NOT_FOUND).send('Form template not found');
    }
  } catch (err) {
    console.error('Error retrieving form template:', err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Error retrieving form template');
  }
});

// GET request to list all form templates
router.get('/forms-list', protectedRoute(), async (req, res) => {
  try {
    const result = await db(TABLE_NAMES.FORM_TEMPLATES).select('*');

    if (result.length > 0) {
      res.status(HTTP_STATUS.OK).json(result);
    } else {
      res.status(HTTP_STATUS.NOT_FOUND).send('No form templates found');
    }
  } catch (err) {
    console.error(err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Error retrieving form templates');
  }
});

// GET request to list all pdf templates
router.get('/pdf-templates-list', protectedRoute(), async (req, res) => {
  try {
    const result = await db(TABLE_NAMES.PDF_TEMPLATES).select('*');

    if (result.length > 0) {
      res.status(HTTP_STATUS.OK).json(result);
    } else {
      res.status(HTTP_STATUS.NOT_FOUND).send('No pdf templates found');
    }
  } catch (err) {
    console.error(err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Error retrieving pdf templates');
  }
});

// PUT request to update the deployed status of a form
router.put('/forms/update', protectedRoute(), async (req, res) => {
  const { form_id, id, deployed_to, pdf_template_id } = req.body;

  try {
    // Clear deployed_to for other forms with the same form_id
    await db(TABLE_NAMES.FORM_TEMPLATES)
      .where({ form_id })
      .andWhereNot({ id })
      .andWhere({ deployed_to })
      .update({ deployed_to: DEPLOYMENT_STATUS.NONE });

    // Update the deployed_to status for the specified form
    const result = await db(TABLE_NAMES.FORM_TEMPLATES)
      .where({ id })
      .update({ deployed_to, pdf_template_id });

    if (result > 0) {
      res.status(HTTP_STATUS.OK).send({ id, message: 'Form version updated successfully!' });
    } else {
      res.status(HTTP_STATUS.NOT_FOUND).send('Form template not found');
    }
  } catch (err) {
    console.error(err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Error updating deployed status');
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
          .status(HTTP_STATUS.BAD_REQUEST)
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
      await db(TABLE_NAMES.PDF_TEMPLATES).insert({
        id,
        name: pdf_template_name,
        version: pdf_template_version,
        template_uuid,
        notes: pdf_template_notes || null
      });

      return res
        .status(HTTP_STATUS.CREATED)
        .json({ id, message: 'PDF template saved successfully' });
    } catch (err) {
      console.error(err);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
);

router.get('/template/:template_uuid', protectedRoute(), async (req, res) => {
  try {
    const { template_uuid } = req.params;

    const petsUrl = `${PETS_BASE_URL}/api/v2/template/${template_uuid}?download=true`;
    const petsRes = await fetch(petsUrl);

    if (!petsRes.ok) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send(`PETS returned ${petsRes.status}`);
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
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Internal error fetching template');
  }
});

router.post('/pdfRender/:id', protectedRoute(), async (req, res) => {
  try {
    const { id } = req.params;

    // 2) look up the real template_uuid in your table
    const row = await db(TABLE_NAMES.PDF_TEMPLATES)
                      .select('template_uuid')
                      .where({ id })
                      .first();

    if (!row) {
      return res.status(HTTP_STATUS.NOT_FOUND).send('PDF template not found');
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
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send(`PETS returned ${petsRes.status}`);
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
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Internal error fetching template');
  }
});



module.exports = router;
