// Backend-1/controllers/page.controller.js
const Page = require('../models/page.model');
const pageService = require('../services/page.service');
const Product = require('../models/product.model');

const getPublicPageBySlug = async (req, res, next) => {
    try {
        // 1. Lấy thông tin bài viết hiện tại (Đã được populate injectedBlocks ở Service)
        const page = await pageService.getPageBySlug(req.params.slug);
        if (!page) {
            return res.status(404).json({ message: 'Trang không tồn tại hoặc chưa được xuất bản.' });
        }

        // 2. Lấy danh sách sản phẩm gợi ý (5 sản phẩm mới nhất để dưới cuối bài)
        const relatedProducts = await Product.find({})
            .select('title price images imgSrc slug') 
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        // 3. Lấy danh sách bài viết mới nhất (cho Sidebar)
        const latestPosts = await Page.find({
            isPublished: true,
            isBlog: true,            
            _id: { $ne: page._id }   
        })
        .select('title slug createdAt thumbnail category') // Bổ sung thumbnail, category cho giao diện sidebar Frontend
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

        // 4. Chuẩn bị dữ liệu trả về
        // Nhờ hàm .toObject(), mảng injectedBlocks chứa data sản phẩm nội tuyến sẽ được giữ nguyên
        const responseData = {
            ...page.toObject(),
            relatedProducts: relatedProducts // Override lại bằng 5 SP mới nhất theo logic gốc
        };

        res.status(200).json({ 
            status: 'success', 
            data: responseData,
            related: {
                latestPosts: latestPosts 
            }
        });

    } catch (error) {
        next(error);
    }
};

const getPublicPages = async (req, res, next) => {
    try {
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