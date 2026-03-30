// BE/services/pageCategory.service.js
const PageCategory = require('../models/pageCategory.model');

/**
 * Lấy tất cả danh mục trang, đã được sắp xếp theo thứ tự.
 */
const getAllCategories = () => PageCategory.find().sort('order');

module.exports = {
    getAllCategories,
};