const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protectedRoute } = require('@bcgov/citz-imb-sso-express');
const formController = require('../controllers/formController');
const pdfController = require('../controllers/pdfController');

const upload = multer();

router.post('/forms', formController.createForm);
router.get('/forms/:id', formController.getFormById);
router.get('/forms/form_id/:form_id', formController.getFormByFormId);
router.get('/forms-list', protectedRoute(), formController.getAllForms);
router.put('/forms/update', protectedRoute(), formController.updateFormDeployment);

router.get('/pdf-templates-list', protectedRoute(), pdfController.getAllPdfTemplates);
router.post(
  '/newPETStemplate',
  protectedRoute(),
  upload.single('libre_office_template'),
  pdfController.uploadPdfTemplate
);
router.get('/template/:template_uuid', protectedRoute(), pdfController.downloadTemplate);
router.post('/pdfRender/:id', protectedRoute(), pdfController.renderPdf);

module.exports = router;
