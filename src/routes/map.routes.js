// Backend/routes/map.routes.js
const express = require('express');
const router = express.Router();
const mapController = require('../controllers/map.controller');
const { protect } = require('../middleware/auth.middleware');

// Bảo vệ tất cả các route bên dưới
router.use(protect);

// Endpoint để FE lấy API key
router.get('/config', mapController.getMapsConfig);

// Endpoint để FE tìm kiếm tọa độ
router.get('/geocode', mapController.geocodeAddress);

module.exports = router;