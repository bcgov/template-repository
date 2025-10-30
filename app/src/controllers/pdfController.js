const pdfService = require('../services/pdfService');
const { HTTP_STATUS } = require('../constants');

const getAllPdfTemplates = async (req, res, next) => {
  try {
    const result = await pdfService.getAllPdfTemplates();
    res.status(HTTP_STATUS.OK).json(result);
  } catch (err) {
    next(err);
  }
};

const uploadPdfTemplate = async (req, res, next) => {
  try {
    const { pdf_template_name, pdf_template_version, pdf_template_notes } = req.body;
    const file = req.file;

    if (!file || !pdf_template_name || !pdf_template_version) {
      const error = new Error('name, version and template file are all required');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    const templateUuid = await pdfService.uploadToPets(
      file.buffer,
      file.originalname,
      file.mimetype
    );

    const result = await pdfService.createPdfTemplate(
      pdf_template_name,
      pdf_template_version,
      templateUuid,
      pdf_template_notes
    );

    return res.status(HTTP_STATUS.CREATED).json({
      id: result.id,
      message: 'PDF template saved successfully',
    });
  } catch (err) {
    next(err);
  }
};

const downloadTemplate = async (req, res, next) => {
  try {
    const { template_uuid } = req.params;
    const { body, contentType } = await pdfService.downloadTemplateFromPets(template_uuid);

    res.setHeader('Content-Type', contentType);

    const extension =
      contentType.includes('opendocument')
        ? 'odt'
        : contentType.includes('wordprocessingml')
        ? 'docx'
        : 'bin';

    res.setHeader('Content-Disposition', `attachment; filename="${template_uuid}.${extension}"`);

    body.pipe(res);
  } catch (err) {
    next(err);
  }
};

const renderPdf = async (req, res, next) => {
  try {
    const { id } = req.params;
    const template = await pdfService.getPdfTemplateById(id);

    if (!template) {
      const error = new Error('PDF template not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    const { body, contentType, templateUuid } = await pdfService.renderPdfWithPets(
      template.template_uuid,
      req.body
    );

    res.setHeader('Content-Type', contentType);

    const extension =
      contentType.includes('opendocument')
        ? 'odt'
        : contentType.includes('wordprocessingml')
        ? 'docx'
        : 'bin';

    res.setHeader('Content-Disposition', `attachment; filename="${templateUuid}.${extension}"`);

    body.pipe(res);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllPdfTemplates,
  uploadPdfTemplate,
  downloadTemplate,
  renderPdf,
};
