// TrainData/BE/routes/font.routes.js
const express = require('express');
const router = express.Router();
const fontController = require('../controllers/font.controller');

router.get('/', fontController.getPublicFonts);

module.exports = router;