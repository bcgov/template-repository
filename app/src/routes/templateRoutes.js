const express = require('express');
const router = express.Router();
const pdfController = require('../controllers/pdfController');

router.get(
  '/:form_name',
  pdfController.downloadPdfTemplateByFormName
);

module.exports = router;
