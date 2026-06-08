// BE/routes/public.routes.js (Tệp mới)
const express = require('express');
const fs = require('fs');
const path = require('path');
const Invitation = require('../models/invitation.model');

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
// Thêm route này vào BE/routes/public.routes.js
router.get('/events/:eventId', catchAsync(async (req, res, next) => {
    const { eventId } = req.params;
    
    
    // 1. Phân loại Bot và User thật (Bot Detection)
    const userAgent = req.headers['user-agent'] || '';
    const isBot = /zalo|facebookexternalhit|twitterbot|googlebot|crawler/i.test(userAgent);
    
    const indexPath = path.resolve(__dirname, '../../../frontend/build/index.html');

    // 2. TỐI ƯU HIỆU NĂNG: Nếu là người thật (browser) -> Serve luôn file tĩnh để React tự render.
    if (!isBot) {
        if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
        return res.status(404).send('Không tìm thấy sự kiện.');
    }

    // 3. NẾU LÀ BOT (Zalo/Facebook): Query DB và xử lý thẻ Meta
    const invitation = await Invitation.findById(eventId)
        .select('imgSrc content settings.title settings.description settings.heroImages')
        .lean();

    if (!invitation) {
        if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
        return res.status(404).send('Không tìm thấy sự kiện.');
    }

    fs.readFile(indexPath, 'utf8', (err, htmlData) => {
        if (err) return res.status(500).send('Lỗi máy chủ');

        const cleanText = (text) => text ? text.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim() : '';

        const title = cleanText(invitation.settings?.title) || 'Thiệp mời sự kiện - iCards';
        const description = cleanText(invitation.settings?.description) || 'Bạn nhận được một lời mời trân trọng!';
        
        // 4. LẤY ẢNH BÌA MẶT TRƯỚC (Trang đầu tiên trong editor)
        let coverImage = 'https://icards.com.vn/default-share-thumbnail.jpg'; // Ảnh dự phòng
        
        if (invitation.content && invitation.content.length > 0 && invitation.content[0].backgroundImage) {
            // Lấy chính xác ảnh background của trang số 1 trong mảng content Canvas
            coverImage = invitation.content[0].backgroundImage;
        } else if (invitation.imgSrc) {
            coverImage = invitation.imgSrc;
        } else if (invitation.settings?.heroImages?.main) {
            coverImage = invitation.settings.heroImages.main;
        }

        const shareUrl = `https://icards.com.vn/events/${eventId}`;

        // 5. Ghi đè vào các placeholder của React index.html
        const injectedHtml = htmlData
            .replace(/__META_TITLE__/g, title)
            .replace(/__OG_TITLE__/g, title)
            .replace(/__OG_DESCRIPTION__/g, description)
            .replace(/__META_DESCRIPTION__/g, description) 
            .replace(/__OG_IMAGE__/g, coverImage)
            .replace(/__OG_URL__/g, shareUrl);

        res.send(injectedHtml);
    });
}));
router.get('/seo-invitation/:slug', catchAsync(async (req, res, next) => {
    const { slug } = req.params;

    // 1. Tìm thiệp theo slug 
    // MỚI: Thêm select('imgSrc content') để lấy chính xác dữ liệu cấu trúc Canvas
    const invitation = await Invitation.findOne({ slug })
        .select('imgSrc content settings.title settings.description settings.heroImages')
        .lean();

    // 2. Trỏ đường dẫn tuyệt đối đến file index.html tĩnh của ReactJS
    const indexPath = path.resolve(__dirname, '../../../frontend/build/index.html');

    // Nếu không tìm thấy thiệp, trả file mặc định
    if (!invitation) {
        if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
        return res.status(404).send('Không tìm thấy giao diện nền tảng.');
    }

    fs.readFile(indexPath, 'utf8', (err, htmlData) => {
        if (err) {
            console.error('Lỗi khi đọc file index.html:', err);
            return res.status(500).send('Internal Server Error');
        }

        // 3. Chuẩn bị Data & Dọn dẹp Text
        const cleanText = (text) => {
            if (!text) return '';
            return text
                .replace(/{LờiXưngHô}/g, 'Bạn')
                .replace(/{TênKháchMời}/g, '')
                .replace(/<[^>]*>?/gm, '') // Xóa thẻ HTML (ví dụ: <p>Mô tả...</p>) nếu có
                .replace(/\s+/g, ' ')
                .replace(' !', '!')
                .trim();
        };

        const title = cleanText(invitation.settings?.title) || 'Thiệp mời sự kiện - iCards';
        
        // Data description của bạn đang là "<p>Mô tả chi tiết...</p>", regex bóc thẻ HTML ở trên sẽ xử lý sạch sẽ
        const description = cleanText(invitation.description || invitation.settings?.description) || 'Bạn nhận được một lời mời trân trọng!';
        
        // 4. LẤY ẢNH BÌA MẶT TRƯỚC (THUMBNAIL) TỪ CANVAS DATA
        // Tìm backgroundImage của trang đầu tiên (Trang 1) trong mảng content
        let firstPageBackgroundImage = null;
        if (invitation.content && invitation.content.length > 0) {
            firstPageBackgroundImage = invitation.content[0].backgroundImage;
        }

        // Thứ tự ưu tiên lấy ảnh hiển thị cho Zalo:
        // Ưu tiên 1: Lấy imgSrc (ảnh R2 như bạn gửi trong payload)
        // Ưu tiên 2: Lấy backgroundImage của Page 1 trong Canvas
        // Ưu tiên 3: Lấy ảnh cô dâu/chú rể (heroImages.main)
        // Ưu tiên 4: Fallback về ảnh mặc định của iCards
        const coverImage = invitation.imgSrc 
            || firstPageBackgroundImage
            || invitation.settings?.heroImages?.main 
            || 'https://icards.com.vn/default-share-thumbnail.jpg';

        const shareUrl = `https://icards.com.vn/invitation/${slug}`;

        // 5. Bơm (Inject) dữ liệu vào thẻ Meta
        const injectedHtml = htmlData
            .replace(/__OG_TITLE__/g, title)
            .replace(/__OG_DESCRIPTION__/g, description)
            .replace(/__OG_IMAGE__/g, coverImage)
            .replace(/__OG_URL__/g, shareUrl);

        // 6. Trả file HTML hoàn thiện cho Zalo
        res.send(injectedHtml);
    });
}));



module.exports = router;