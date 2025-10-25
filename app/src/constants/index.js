const TABLE_NAMES = {
  FORM_TEMPLATES: 'form_templates',
  PDF_TEMPLATES: 'pdf_templates',
};

const DEPLOYMENT_STATUS = {
  PROD: 'prod',
  TEST: 'test',
  DEV: 'dev',
  NONE: '',
};

// Lower number = higher priority
const DEPLOYMENT_PRIORITY = {
  [DEPLOYMENT_STATUS.PROD]: 1,
  [DEPLOYMENT_STATUS.TEST]: 2,
  [DEPLOYMENT_STATUS.DEV]: 3,
  [DEPLOYMENT_STATUS.NONE]: 4,
};

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

const API_ROUTES = {
  HEALTH: '/health',
  FORMS: '/api/forms',
  FORMS_LIST: '/api/forms-list',
  FORMS_UPDATE: '/api/forms/update',
  PDF_TEMPLATES_LIST: '/api/pdf-templates-list',
  NEW_PETS_TEMPLATE: '/api/newPETStemplate',
  TEMPLATE: '/api/template',
  PDF_RENDER: '/api/pdfRender',
};

module.exports = {
  TABLE_NAMES,
  DEPLOYMENT_STATUS,
  DEPLOYMENT_PRIORITY,
  HTTP_STATUS,
  API_ROUTES,
};
