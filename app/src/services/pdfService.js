/**
 * PDF Service
 * Business logic for PDF template operations and PETS integration
 */

const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const FormData = require('form-data');
const { TABLE_NAMES } = require('../constants');

const PETS_BASE_URL = process.env.PETS_BASE_URL;

/**
 * Get all PDF templates
 * @returns {Promise<Array>} Array of all PDF templates
 */
const getAllPdfTemplates = async () => {
  return await db(TABLE_NAMES.PDF_TEMPLATES).select('*');
};

/**
 * Upload template to PETS service
 * @param {Buffer} fileBuffer - Template file buffer
 * @param {string} filename - Original filename
 * @param {string} mimetype - File MIME type
 * @returns {Promise<string>} Template UUID from PETS
 * @throws {Error} If PETS service returns an error
 */
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

/**
 * Create a new PDF template record
 * @param {string} name - Template name
 * @param {string} version - Template version
 * @param {string} templateUuid - UUID from PETS
 * @param {string} notes - Optional notes
 * @returns {Promise<Object>} Created template with id
 */
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

/**
 * Get PDF template by ID
 * @param {string} id - PDF template ID
 * @returns {Promise<Object|null>} PDF template or null if not found
 */
const getPdfTemplateById = async (id) => {
  return await db(TABLE_NAMES.PDF_TEMPLATES)
    .select('template_uuid')
    .where({ id })
    .first();
};

/**
 * Download template file from PETS
 * @param {string} templateUuid - Template UUID
 * @returns {Promise<Object>} Response with body stream and content type
 * @throws {Error} If PETS service returns an error
 */
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

/**
 * Render PDF using PETS template
 * @param {string} templateUuid - Template UUID
 * @param {Object} data - Data to render
 * @returns {Promise<Object>} Response with body stream and content type
 * @throws {Error} If PETS service returns an error
 */
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
