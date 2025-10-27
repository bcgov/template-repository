const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { TABLE_NAMES, DEPLOYMENT_STATUS, DEPLOYMENT_PRIORITY } = require('../constants');

// Handles two payload formats: v1 (root level fields) and v2 (nested under formversion)
const normalizeFormData = (body) => {
  let formData;

  if (body.formversion) {
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
      data: fv.elements,
      interface: fv.interface,
      scripts: fv.scripts,
      styles: fv.styles,
    };
  } else {
    formData = {
      id: body.id,
      version: body.version,
      ministry_id: body.ministry_id,
      last_modified: body.lastModified || body.last_modified,
      title: body.title,
      form_id: body.form_id,
      deployed_to: body.deployed_to || DEPLOYMENT_STATUS.NONE,
      dataSources: body.dataSources,
      data: body.data?.items || body.data,
      interface: body.interface,
      scripts: body.scripts,
      styles: body.styles,
    };
  }

  if (!formData.id) {
    formData.id = uuidv4();
  }

  return formData;
};

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
    scripts: formData.scripts ? JSON.stringify(formData.scripts) : null,
    styles: formData.styles ? JSON.stringify(formData.styles) : null,
  });

  return { id: formData.id };
};

const getFormById = async (id) => {
  return await db(TABLE_NAMES.FORM_TEMPLATES).where({ id }).first();
};

// Returns form with highest deployment priority (prod > test > dev) and latest version
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

const getAllForms = async () => {
  return await db(TABLE_NAMES.FORM_TEMPLATES).select('*');
};

// Clears deployed_to for other versions with same form_id and deployment status
const updateFormDeployment = async (formId, id, deployedTo, pdfTemplateId) => {
  await db(TABLE_NAMES.FORM_TEMPLATES)
    .where({ form_id: formId })
    .andWhereNot({ id })
    .andWhere({ deployed_to: deployedTo })
    .update({ deployed_to: DEPLOYMENT_STATUS.NONE });

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
