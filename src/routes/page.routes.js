// TrainData/BE/routes/page.routes.js
const express = require('express');
const router = express.Router();

// THAY ĐỔI Ở ĐÂY: Import từ controller cục bộ của BE
const { getPublicPageBySlug, getPublicPages } = require('../controllers/page.controller'); // ++ THÊM getPublicPages ++

// ++ ROUTE MỚI: Lấy tất cả các trang/blog công khai ++
router.get('/', getPublicPages);

router.get('/:slug', getPublicPageBySlug);

module.exports = router;