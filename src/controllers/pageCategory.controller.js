// BE/controllers/pageCategory.controller.js
const pageCategoryService = require('../services/pageCategory.service');

/**
 * Controller để xử lý yêu cầu công khai, lấy tất cả danh mục trang.
 */
const getPublicPageCategories = async (req, res, next) => {
    try {
        const categories = await pageCategoryService.getAllCategories();
        res.status(200).json({ status: 'success', data: categories });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPublicPageCategories,
};