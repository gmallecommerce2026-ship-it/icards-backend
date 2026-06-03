// BE/routes/public.routes.js (Tệp mới)
const express = require('express');
const router = express.Router();

// Import các tệp route dành cho người dùng công khai
const pageRoutes = require('./page.routes');
const pageCategoryRoutes = require('./pageCategory.routes');
const fontRoutes = require('./font.routes');
const invitationTemplateRoutes = require('./invitationTemplate.routes');
const topicRoutes = require('./topic.routes');
const templateBlockService = require('../services/templateBlock.service');
const catchAsync = require('../utils/catchAsync');
const templateBlockController = require('../controllers/templateBlock.controller');
// Thêm route này vào cùng với các public routes khác
router.get('/template-blocks', catchAsync(async (req, res, next) => {
    // Tái sử dụng lại service đã viết
    const blocks = await templateBlockService.getAllBlocks();
    
    // Chỉ trả về các khối đang được bật (isActive: true)
    const activeBlocks = blocks.filter(block => block.isActive);

    res.status(200).json({
        success: true,
        data: activeBlocks
    });
}));
router.get('/template-blocks', templateBlockController.getPublicBlocks);

// Route phục vụ trang xem chi tiết toàn bộ thiệp của bộ sưu tập đó khi click vào
router.get('/template-blocks/slug/:slug', templateBlockController.getBlockBySlug);
// Gắn các route cụ thể vào router công khai này
// - Yêu cầu đến /public/pages sẽ được xử lý bởi pageRoutes
// - Yêu cầu đến /public/page-categories sẽ được xử lý bởi pageCategoryRoutes
// v.v.
router.use('/pages', pageRoutes);
router.use('/page-categories', pageCategoryRoutes);
router.use('/fonts', fontRoutes);
router.use('/invitation-templates', invitationTemplateRoutes);
router.use('/topics', topicRoutes);


module.exports = router;