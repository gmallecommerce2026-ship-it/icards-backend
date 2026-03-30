// Backend-1/controllers/page.controller.js
const pageService = require('../services/page.service');

const getPublicPageBySlug = async (req, res, next) => {
    try {
        const page = await pageService.getPageBySlug(req.params.slug);
        if (!page) {
            return res.status(404).json({ message: 'Trang không tồn tại hoặc chưa được xuất bản.' });
        }
        res.status(200).json({ status: 'success', data: page });
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