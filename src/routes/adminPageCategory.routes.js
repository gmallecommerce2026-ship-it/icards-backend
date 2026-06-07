// BE/routes/adminPageCategory.routes.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/pageCategory.controller');
// Nhớ import middleware xác thực admin của bạn, ví dụ:
// const { isAuthenticated, restrictTo } = require('../middleware/auth.middleware');

// Áp dụng middleware cho tất cả các route bên dưới (Tuỳ thuộc vào file cấu hình của bạn)
// router.use(isAuthenticated, restrictTo('admin')); 

router.route('/')
    .get(categoryController.getAllCategoriesAdmin)
    .post(categoryController.createCategory);

router.route('/update-order')
    .put(categoryController.updateCategoryOrder); // API này được Frontend gọi qua /admin/page-categories/update-order

router.route('/:id')
    .put(categoryController.updateCategory)
    .delete(categoryController.deleteCategory);

module.exports = router;