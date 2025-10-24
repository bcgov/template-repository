/**
 * Form Controller
 * Handles HTTP requests/responses for form template operations
 */

const formService = require('../services/formService');
const { HTTP_STATUS } = require('../constants');

/**
 * POST /api/forms
 * Create a new form template
 */
const createForm = async (req, res) => {
  try {
    const formData = formService.normalizeFormData(req.body);
    const result = await formService.createForm(formData);

    res.status(HTTP_STATUS.CREATED).send({
      id: result.id,
      message: 'Form template created successfully!',
    });
  } catch (err) {
    console.error(err);

    if (err.statusCode === 409) {
      return res.status(HTTP_STATUS.CONFLICT).send({
        id: err.data?.id,
        message: err.message,
      });
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Error creating form template');
  }
};

/**
 * GET /api/forms/:id
 * Get form template by UUID
 */
const getFormById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await formService.getFormById(id);

    if (result) {
      res.status(HTTP_STATUS.OK).json(result);
    } else {
      res.status(HTTP_STATUS.NOT_FOUND).send('Form template not found');
    }
  } catch (err) {
    console.error(err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Error retrieving form template');
  }
};

/**
 * GET /api/forms/form_id/:form_id
 * Get form template by form_id with deployment priority
 */
const getFormByFormId = async (req, res) => {
  try {
    const { form_id } = req.params;
    const result = await formService.getFormByFormId(form_id);

    if (result) {
      res.status(HTTP_STATUS.OK).json(result);
    } else {
      res.status(HTTP_STATUS.NOT_FOUND).send('Form template not found');
    }
  } catch (err) {
    console.error('Error retrieving form template:', err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Error retrieving form template');
  }
};

/**
 * GET /api/forms-list
 * Get all form templates
 */
const getAllForms = async (req, res) => {
  try {
    const result = await formService.getAllForms();

    if (result.length > 0) {
      res.status(HTTP_STATUS.OK).json(result);
    } else {
      res.status(HTTP_STATUS.NOT_FOUND).send('No form templates found');
    }
  } catch (err) {
    console.error(err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Error retrieving form templates');
  }
};

/**
 * PUT /api/forms/update
 * Update form deployment status
 */
const updateFormDeployment = async (req, res) => {
  try {
    const { form_id, id, deployed_to, pdf_template_id } = req.body;

    const updated = await formService.updateFormDeployment(
      form_id,
      id,
      deployed_to,
      pdf_template_id
    );

    if (updated) {
      res.status(HTTP_STATUS.OK).send({
        id,
        message: 'Form version updated successfully!',
      });
    } else {
      res.status(HTTP_STATUS.NOT_FOUND).send('Form template not found');
    }
  } catch (err) {
    console.error(err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Error updating deployed status');
  }
};

module.exports = {
  createForm,
  getFormById,
  getFormByFormId,
  getAllForms,
  updateFormDeployment,
};
