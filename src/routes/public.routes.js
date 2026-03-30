// BE/routes/public.routes.js (Tệp mới)
const express = require('express');
const router = express.Router();

// Import các tệp route dành cho người dùng công khai
const pageRoutes = require('./page.routes');
const pageCategoryRoutes = require('./pageCategory.routes');
const fontRoutes = require('./font.routes');
const invitationTemplateRoutes = require('./invitationTemplate.routes');
const topicRoutes = require('./topic.routes');

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