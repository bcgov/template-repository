/**
 * PDF Controller
 * Handles HTTP requests/responses for PDF template operations
 */

const pdfService = require('../services/pdfService');
const { HTTP_STATUS } = require('../constants');

/**
 * GET /api/pdf-templates-list
 * Get all PDF templates
 */
const getAllPdfTemplates = async (req, res) => {
  try {
    const result = await pdfService.getAllPdfTemplates();

    if (result.length > 0) {
      res.status(HTTP_STATUS.OK).json(result);
    } else {
      res.status(HTTP_STATUS.NOT_FOUND).send('No pdf templates found');
    }
  } catch (err) {
    console.error(err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Error retrieving pdf templates');
  }
};

/**
 * POST /api/newPETStemplate
 * Upload a new PDF template to PETS
 */
const uploadPdfTemplate = async (req, res) => {
  try {
    const { pdf_template_name, pdf_template_version, pdf_template_notes } = req.body;
    const file = req.file;

    if (!file || !pdf_template_name || !pdf_template_version) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send('name, version and template file are all required');
    }

    // Upload to PETS service
    const templateUuid = await pdfService.uploadToPets(
      file.buffer,
      file.originalname,
      file.mimetype
    );

    // Save reference in database
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
    console.error(err);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
};

/**
 * GET /api/template/:template_uuid
 * Download template file from PETS
 */
const downloadTemplate = async (req, res) => {
  try {
    const { template_uuid } = req.params;
    const { body, contentType } = await pdfService.downloadTemplateFromPets(template_uuid);

    res.setHeader('Content-Type', contentType);

    // Determine extension based on content-type
    const extension =
      contentType.includes('opendocument')
        ? 'odt'
        : contentType.includes('wordprocessingml')
        ? 'docx'
        : 'bin';

    res.setHeader('Content-Disposition', `attachment; filename="${template_uuid}.${extension}"`);

    body.pipe(res);
  } catch (err) {
    console.error('Error proxying template download:', err);
    res.status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Internal error fetching template');
  }
};

/**
 * POST /api/pdfRender/:id
 * Render PDF using template
 */
const renderPdf = async (req, res) => {
  try {
    const { id } = req.params;

    // Look up the template UUID
    const template = await pdfService.getPdfTemplateById(id);

    if (!template) {
      return res.status(HTTP_STATUS.NOT_FOUND).send('PDF template not found');
    }

    // Render PDF with PETS
    const { body, contentType, templateUuid } = await pdfService.renderPdfWithPets(
      template.template_uuid,
      req.body
    );

    res.setHeader('Content-Type', contentType);

    // Determine extension based on content-type
    const extension =
      contentType.includes('opendocument')
        ? 'odt'
        : contentType.includes('wordprocessingml')
        ? 'docx'
        : 'bin';

    res.setHeader('Content-Disposition', `attachment; filename="${templateUuid}.${extension}"`);

    body.pipe(res);
  } catch (err) {
    console.error('Error proxying template download:', err);
    res.status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Internal error fetching template');
  }
};

module.exports = {
  getAllPdfTemplates,
  uploadPdfTemplate,
  downloadTemplate,
  renderPdf,
};
