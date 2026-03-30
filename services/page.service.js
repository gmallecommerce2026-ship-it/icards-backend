// TrainData/BE/services/page.service.js
const Page = require('../models/page.model');
require('../models/topic.model');
require('../models/pageCategory.model');
require('../models/user.model');


// Chỉ lấy trang đã được xuất bản
const getPageBySlug = (slug) => {
    return Page.findOne({ slug, isPublished: true })
        .populate('author', 'name')
        .populate('category', 'name slug')
        .populate('topics', 'name slug')
        // === THÊM DÒNG NÀY ===
        .populate('relatedTemplate', 'name thumbnail slug code price'); 
        // Lấy tên, ảnh, slug, mã, giá của template
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