const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const FormData = require('form-data');
const { TABLE_NAMES } = require('../constants');

const PETS_BASE_URL = process.env.PETS_BASE_URL;

const getAllPdfTemplates = async () => {
  return await db(TABLE_NAMES.PDF_TEMPLATES).select(
    'id',
    'name',
    'version',
    'storage_location',
    'template_uuid',
    'file_name',
    'content_type',
    'notes'
  );
};

const uploadToPets = async (fileBuffer, filename, mimetype) => {
  const form = new FormData();
  form.append('template', fileBuffer, {
    filename: filename,
    contentType: mimetype,
  });

  try {
    response = await fetch(`${PETS_BASE_URL}/api/v2/template`, {
      method: 'POST',
      headers: form.getHeaders(),
      body: form,
    });
  } catch (err) {
    throw new Error(
      'Unable to connect to PETS. The PETS service may be unavailable or not running.'
    );
  }

  if (!response.ok) {
    throw new Error(`PETS service error: ${response.status}`);
  }

  const templateUuid = (await response.text()).trim();
  return templateUuid;
};

const createPdfTemplate = async ({
  name,
  version,
  storageLocation,
  templateUuid = null,
  templateData = null,
  fileName = null,
  contentType = null,
  notes = null,
}) => {
  const id = uuidv4();

  await db(TABLE_NAMES.PDF_TEMPLATES).insert({
    id,
    name,
    version,
    storage_location: storageLocation,
    template_uuid: templateUuid,
    template_data: templateData,
    file_name: fileName,
    content_type: contentType,
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

const getPdfTemplateFileById = async (id) => {
  return await db(TABLE_NAMES.PDF_TEMPLATES)
    .select(
      'id',
      'name',
      'version',
      'storage_location',
      'template_uuid',
      'template_data',
      'file_name',
      'content_type'
    )
    .where({ id })
    .first();
};

const getPdfTemplateFileByName = async (name, version) => {
  const query = db(TABLE_NAMES.PDF_TEMPLATES)
    .select(
      'id',
      'name',
      'version',
      'storage_location',
      'template_uuid',
      'template_data',
      'file_name',
      'content_type'
    )
    .where({ name });

  if (version) {
    query.where({ version });
  } else {
    query.orderByRaw('version::int DESC');
  }

  return await query.first();
};

const pdfTemplateExists = async (name, version) => {
  return !!(await db(TABLE_NAMES.PDF_TEMPLATES)
    .where({ name, version })
    .first());
};

module.exports = {
  getAllPdfTemplates,
  uploadToPets,
  createPdfTemplate,
  getPdfTemplateById,
  downloadTemplateFromPets,
  renderPdfWithPets,
  getPdfTemplateFileById,
  getPdfTemplateFileByName,
  pdfTemplateExists,
};
