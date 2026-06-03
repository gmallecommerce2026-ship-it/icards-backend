// File: src/routes/templateBlock.routes.js
const express = require('express');
const router = express.Router();
const templateBlockController = require('../controllers/templateBlock.controller');

// NẾU BẠN CÓ MIDDLEWARE XÁC THỰC ADMIN, HÃY IMPORT VÀ SỬ DỤNG Ở ĐÂY
// Ví dụ: const isAuthenticated = require('../middleware/isAuthenticated');
// router.use(isAuthenticated);
router.get('/template-blocks', templateBlockController.getPublicBlocks);
router.get('/slug/:slug', templateBlockController.getBlockBySlug);
router.route('/')
    .get(templateBlockController.getBlocks)
    .post(templateBlockController.createBlock);

router.put('/reorder', templateBlockController.reorderBlocks);

router.route('/:id')
    .get(templateBlockController.getBlockById)
    .put(templateBlockController.updateBlock)
    .delete(templateBlockController.deleteBlock);

// XUẤT RA ROUTER ĐỂ EXPRESS ĐỌC ĐƯỢC
module.exports = router;