// Backend-1/controllers/page.controller.js
const Page = require('../models/page.model');
const pageService = require('../services/page.service');
const Product = require('../models/product.model');

const getPublicPageBySlug = async (req, res, next) => {
    try {
        // 1. Lấy thông tin bài viết hiện tại
        const page = await pageService.getPageBySlug(req.params.slug);
        if (!page) {
            return res.status(404).json({ message: 'Trang không tồn tại hoặc chưa được xuất bản.' });
        }

        // 2. [MỚI] Lấy danh sách sản phẩm gợi ý (Ví dụ: 5 sản phẩm mới nhất)
        // Bạn có thể đổi logic sort hoặc filter theo category nếu muốn
        const relatedProducts = await Product.find({})
            .select('title price images imgSrc slug') // Chỉ lấy các trường cần thiết để tối ưu
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        // 3. [MỚI] Lấy danh sách bài viết mới nhất (cho Sidebar)
        const latestPosts = await Page.find({
            isPublished: true,
            isBlog: true,            // Chỉ lấy các trang là Blog
            _id: { $ne: page._id }   // Loại trừ bài viết hiện tại
        })
        .select('title slug createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

        // 4. Chuẩn bị dữ liệu trả về
        // Frontend đang đọc: const relatedProducts = blog.relatedProducts || [];
        // => Ta gộp relatedProducts vào object page
        const responseData = {
            ...page.toObject(),
            relatedProducts: relatedProducts 
        };

        res.status(200).json({ 
            status: 'success', 
            data: responseData,
            related: {
                latestPosts: latestPosts // Dữ liệu cho phần "Bài viết mới nhất"
            }
        });

    } catch (error) {
        next(error);
    }
};

// SỬA ĐỔI: Truyền query params xuống service
const getPublicPages = async (req, res, next) => {
    try {
        // req.query chứa: { isBlog, category, search, limit, ... }
        const pages = await pageService.getPublicPages(req.query);
        res.status(200).json({ status: 'success', data: pages });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPublicPageBySlug,
    getPublicPages,
};