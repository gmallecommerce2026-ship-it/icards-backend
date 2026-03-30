const express = require('express');
const router = express.Router();
const { getDesignAssets, seedInitialAssets } = require('../controllers/designAsset.controller');

// Route chính để lấy tài nguyên. vd: GET /api/design-assets?type=icon
router.get('/', getDesignAssets);

// Route để seed dữ liệu, bạn nên bảo vệ route này sau này
router.post('/seed', seedInitialAssets);

module.exports = router;