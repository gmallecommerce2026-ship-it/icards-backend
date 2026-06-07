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
const getAllCategoriesAdmin = async (req, res, next) => {
    try {
        const categories = await pageCategoryService.getAllCategories();
        res.status(200).json({ status: 'success', data: categories });
    } catch (error) {
        next(error);
    }
};

const createCategory = async (req, res, next) => {
    try {
        const newCategory = await pageCategoryService.createCategory(req.body);
        res.status(201).json({ status: 'success', data: newCategory });
    } catch (error) {
        next(error);
    }
};

const updateCategory = async (req, res, next) => {
    try {
        const updatedCategory = await pageCategoryService.updateCategory(req.params.id, req.body);
        res.status(200).json({ status: 'success', data: updatedCategory });
    } catch (error) {
        next(error);
    }
};

const deleteCategory = async (req, res, next) => {
    try {
        await pageCategoryService.deleteCategory(req.params.id);
        res.status(204).json({ status: 'success', data: null });
    } catch (error) {
        next(error);
    }
};

const updateCategoryOrder = async (req, res, next) => {
    try {
        await pageCategoryService.updateCategoryOrder(req.body.categories);
        res.status(200).json({ status: 'success', message: 'Cập nhật thứ tự thành công' });
    } catch (error) {
        next(error);
    }
};
module.exports = {
    getPublicPageCategories,
    getAllCategoriesAdmin,
    createCategory,
    updateCategory,
    deleteCategory,
    updateCategoryOrder
};