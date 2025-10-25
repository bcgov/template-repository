const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const FormData = require('form-data');
const { TABLE_NAMES } = require('../constants');

const PETS_BASE_URL = process.env.PETS_BASE_URL;

const getAllPdfTemplates = async () => {
  return await db(TABLE_NAMES.PDF_TEMPLATES).select('*');
};

const uploadToPets = async (fileBuffer, filename, mimetype) => {
  const form = new FormData();
  form.append('template', fileBuffer, {
    filename: filename,
    contentType: mimetype,
  });

  const response = await fetch(`${PETS_BASE_URL}/api/v2/template`, {
    method: 'POST',
    headers: form.getHeaders(),
    body: form,
  });

  if (!response.ok) {
    throw new Error(`PETS service error: ${response.status}`);
  }

  const templateUuid = (await response.text()).trim();
  return templateUuid;
};

const createPdfTemplate = async (name, version, templateUuid, notes = null) => {
  const id = uuidv4();

  await db(TABLE_NAMES.PDF_TEMPLATES).insert({
    id,
    name,
    version,
    template_uuid: templateUuid,
    notes,
  });

  return { id };
};

const getPdfTemplateById = async (id) => {
  return await db(TABLE_NAMES.PDF_TEMPLATES)
    .select('template_uuid')
    .where({ id })
    .first();
};

const downloadTemplateFromPets = async (templateUuid) => {
  const petsUrl = `${PETS_BASE_URL}/api/v2/template/${templateUuid}?download=true`;
  const response = await fetch(petsUrl);

  if (!response.ok) {
    const error = new Error(`PETS returned ${response.status}`);
    error.statusCode = 500;
    throw error;
  }

  const contentType = response.headers.get('content-type') || 'application/octet-stream';

  return {
    body: response.body,
    contentType,
  };
};

const renderPdfWithPets = async (templateUuid, data) => {
  const payload = {
    ...data,
    options: {
      convertTo: 'pdf',
      overwrite: true,
    },
  };

  const petsUrl = `${PETS_BASE_URL}/api/v2/template/${templateUuid}/render`;
  const response = await fetch(petsUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = new Error(`PETS returned ${response.status}`);
    error.statusCode = 500;
    throw error;
  }

  const contentType = response.headers.get('content-type') || 'application/octet-stream';

  return {
    body: response.body,
    contentType,
    templateUuid,
  };
};

module.exports = {
  getAllPdfTemplates,
  uploadToPets,
  createPdfTemplate,
  getPdfTemplateById,
  downloadTemplateFromPets,
  renderPdfWithPets,
};
