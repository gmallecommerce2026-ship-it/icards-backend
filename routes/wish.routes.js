const express = require('express');
const router = express.Router();
const wishController = require('../controllers/wish.controller');
const { protect } = require('../middleware/auth.middleware');

// 1. API cho KHÁCH (Public) - Lấy danh sách đã duyệt
router.get('/admin/:id', protect, wishController.getAdminWishes);
router.get('/public/:id', wishController.getPublicWishes);

// 2. API cho QUẢN TRỊ (Admin) - Lấy tất cả danh sách lời chúc

// 3. Các API thao tác update/delete
// (Lưu ý: controller đang dùng "const { wishId } = req.params;" nên param phải là :wishId)
router.put('/:wishId', protect, wishController.updateWishStatus);
router.delete('/:wishId', protect, wishController.deleteWish);

module.exports = router;