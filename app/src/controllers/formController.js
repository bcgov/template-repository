const formService = require('../services/formService');
const { HTTP_STATUS } = require('../constants');

const createForm = async (req, res, next) => {
  try {
    const formData = formService.normalizeFormData(req.body);
    const result = await formService.createForm(formData);

    res.status(HTTP_STATUS.CREATED).send({
      id: result.id,
      message: 'Form template created successfully!',
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
      err.message = 'Error creating form template';
    }
    if (err.statusCode === HTTP_STATUS.CONFLICT) {
      err.details = { id: err.data?.id };
    }
    next(err);
  }
};

const getFormById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await formService.getFormById(id);

    if (result) {
      res.status(HTTP_STATUS.OK).json(result);
    } else {
      const error = new Error('Form template not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }
  } catch (err) {
    next(err);
  }
};

const getFormByFormId = async (req, res, next) => {
  try {
    const { form_id } = req.params;
    const result = await formService.getFormByFormId(form_id);

    if (result) {
      res.status(HTTP_STATUS.OK).json(result);
    } else {
      const error = new Error('Form template not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }
  } catch (err) {
    next(err);
  }
};

const getAllForms = async (req, res, next) => {
  try {
    const result = await formService.getAllForms();
    res.status(HTTP_STATUS.OK).json(result);
  } catch (err) {
    next(err);
  }
};

const updateFormDeployment = async (req, res, next) => {
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
      const error = new Error('Form template not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createForm,
  getFormById,
  getFormByFormId,
  getAllForms,
  updateFormDeployment,
};
