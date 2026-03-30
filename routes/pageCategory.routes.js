// BE/routes/pageCategory.routes.js
const express = require('express');
const router = express.Router();
const { getPublicPageCategories } = require('../controllers/pageCategory.controller');

// Route này sẽ xử lý GET /api/public/page-categories
router.get('/', getPublicPageCategories);

module.exports = router;