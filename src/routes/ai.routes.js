// src/routes/ai.routes.js
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { protect } = require('../middleware/auth.middleware');

// Bảo vệ route này, user phải đăng nhập mới được tạo ảnh
router.post('/generate-tet', protect, aiController.generateTetCard);

module.exports = router;