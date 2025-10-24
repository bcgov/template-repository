/**
 * Form Service
 * Business logic for form template operations
 */

const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { TABLE_NAMES, DEPLOYMENT_STATUS, DEPLOYMENT_PRIORITY } = require('../constants');

/**
 * Normalize form data from different payload formats
 * @param {Object} body - Request body
 * @returns {Object} Normalized form data
 */
const normalizeFormData = (body) => {
  let formData;

  if (body.formversion) {
    // Version 2: nested under formversion
    const fv = body.formversion;
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
      id: body.id,
      version: body.version,
      ministry_id: body.ministry_id,
      last_modified: body.lastModified || body.last_modified,
      title: body.title,
      form_id: body.form_id,
      deployed_to: body.deployed_to || DEPLOYMENT_STATUS.NONE,
      dataSources: body.dataSources,
      data: body.data?.items || body.data, // handle data.items or direct data
      interface: body.interface,
    };
  }

  // Generate UUID if not provided
  if (!formData.id) {
    formData.id = uuidv4();
  }

  return formData;
};

/**
 * Create a new form template
 * @param {Object} formData - Normalized form data
 * @returns {Promise<Object>} Created form with id
 * @throws {Error} If form already exists
 */
const createForm = async (formData) => {
  const existingForm = await db(TABLE_NAMES.FORM_TEMPLATES)
    .where({ id: formData.id })
    .first();

  if (existingForm) {
    const error = new Error('Form template already exists');
    error.statusCode = 409;
    error.data = { id: formData.id };
    throw error;
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

  return { id: formData.id };
};

/**
 * Get form template by UUID
 * @param {string} id - Form template UUID
 * @returns {Promise<Object|null>} Form template or null if not found
 */
const getFormById = async (id) => {
  return await db(TABLE_NAMES.FORM_TEMPLATES).where({ id }).first();
};

/**
 * Get form template by form_id with deployment priority
 * Returns the form with highest deployment priority (prod > test > dev) and latest version
 * @param {string} formId - Form ID
 * @returns {Promise<Object|null>} Form template or null if not found
 */
const getFormByFormId = async (formId) => {
  return await db(TABLE_NAMES.FORM_TEMPLATES)
    .where({ form_id: formId })
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
};

/**
 * Get all form templates
 * @returns {Promise<Array>} Array of all form templates
 */
const getAllForms = async () => {
  return await db(TABLE_NAMES.FORM_TEMPLATES).select('*');
};

/**
 * Update form deployment status
 * Clears deployed_to for other versions of the same form_id with same deployment status
 * @param {string} formId - Form ID
 * @param {string} id - Form template UUID to update
 * @param {string} deployedTo - New deployment status
 * @param {string} pdfTemplateId - PDF template ID (optional)
 * @returns {Promise<boolean>} True if updated, false if not found
 */
const updateFormDeployment = async (formId, id, deployedTo, pdfTemplateId) => {
  // Clear deployed_to for other forms with the same form_id and deployment status
  await db(TABLE_NAMES.FORM_TEMPLATES)
    .where({ form_id: formId })
    .andWhereNot({ id })
    .andWhere({ deployed_to: deployedTo })
    .update({ deployed_to: DEPLOYMENT_STATUS.NONE });

  // Update the deployed_to status for the specified form
  const result = await db(TABLE_NAMES.FORM_TEMPLATES)
    .where({ id })
    .update({ deployed_to: deployedTo, pdf_template_id: pdfTemplateId });

  return result > 0;
};

module.exports = {
  normalizeFormData,
  createForm,
  getFormById,
  getFormByFormId,
  getAllForms,
  updateFormDeployment,
};
