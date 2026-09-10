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
    const {
      pdf_template_name,
      pdf_template_version,
      pdf_template_notes,
      storage_location,
    } = req.body;

    const file = req.file;

    if (!file || !pdf_template_name || !pdf_template_version) {
      const error = new Error(
        'name, version and template file are all required'
      );
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    if (!['pets', 'template_repository'].includes(storage_location)) {
      const error = new Error('Invalid storage location');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    if (await pdfService.pdfTemplateExists(pdf_template_name,pdf_template_version)) {
      const error = new Error(`Version ${pdf_template_version} already exists for ${pdf_template_name}`);
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    let templateUuid = null;
    let templateData = null;

    if (storage_location === 'pets') {
      // Store template in PETS
      templateUuid = await pdfService.uploadToPets(
        file.buffer,
        file.originalname,
        file.mimetype
      );
    } else {
      // Store template in PDF Table
      templateData = file.buffer;
    }

    const result = await pdfService.createPdfTemplate({
      name: pdf_template_name,
      version: pdf_template_version,
      storageLocation: storage_location,
      templateUuid,
      templateData,
      fileName: file.originalname,
      contentType: file.mimetype,
      notes: pdf_template_notes,
    });

    return res.status(HTTP_STATUS.CREATED).json({
      id: result.id,
      storage_location,
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

const downloadPdfTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;

    const template = await pdfService.getPdfTemplateFileById(id);

    if (!template) {
      const error = new Error('PDF template not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    if (template.storage_location === 'pets') {
      const { body, contentType } =
        await pdfService.downloadTemplateFromPets(template.template_uuid);

      res.setHeader('Content-Type', contentType);

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${template.file_name || template.name}"`
      );

      return body.pipe(res);
    }

    res.setHeader(
      'Content-Type',
      template.content_type || 'application/octet-stream'
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${template.file_name || template.name}"`
    );

    return res.send(template.template_data);
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

const downloadPdfTemplateByFormName = async (req, res, next) => {
  try {
    const template = await pdfService.getPdfTemplateFileByName(
      req.params.form_name,
      req.query.version
    );

    if (!template) {
      const error = new Error('PDF template not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${template.file_name}"`
    );

    if (template.storage_location === 'pets') {
      const { body, contentType } =
        await pdfService.downloadTemplateFromPets(template.template_uuid);

      res.setHeader('Content-Type', contentType);
      return body.pipe(res);
    }

    res.setHeader(
      'Content-Type',
      template.file_name.endsWith('.docx')
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/vnd.oasis.opendocument.text'
    );


    return res.send(template.template_data);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllPdfTemplates,
  uploadPdfTemplate,
  downloadTemplate,
  renderPdf,
  downloadPdfTemplate,
  downloadPdfTemplateByFormName
};
