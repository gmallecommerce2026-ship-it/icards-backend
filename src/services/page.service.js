// Backend-1/services/page.service.js
const Page = require('../models/page.model');
require('../models/topic.model');
require('../models/pageCategory.model');
require('../models/user.model');

// ==========================================
// ĐỒNG BỘ MỚI: Require Product model để populate
// ==========================================
require('../models/product.model'); 

// Chỉ lấy trang đã được xuất bản
const getPageBySlug = (slug) => {
    return Page.findOne({ slug, isPublished: true })
        .populate('author', 'name')
        .populate('category', 'title name slug _id') // Bổ sung name đề phòng model dùng name
        .populate('topics', 'name slug')
        .populate('relatedTemplate', 'name thumbnail slug code price')
        // ==========================================
        // ĐỒNG BỘ MỚI: Kéo thông tin Sản phẩm nội tuyến
        // ==========================================
        .populate({
            path: 'injectedBlocks.productId',
            select: 'title price imgSrc images slug'
        });
};

const getPublicPages = (query) => {
    // Nếu muốn hiển thị icon template ở danh sách bài viết thì thêm populate ở đây
    return Page.find({ isPublished: true })
               .sort({ createdAt: -1 })
               .populate('category', 'name slug'); 
};

module.exports = {
    getPageBySlug,
    getPublicPages,
};