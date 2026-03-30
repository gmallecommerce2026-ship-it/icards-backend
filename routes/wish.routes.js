const express = require('express');
const router = express.Router();
const wishController = require('../controllers/wish.controller');
const { protect } = require('../middleware/auth.middleware');
const { param } = require('express-validator');

// Khóa bảo vệ bằng token (chỉ user đã đăng nhập mới được thao tác)
router.use(protect);

// 1. GET /wish/:id/wishes (Lấy danh sách lời chúc cho Admin)
router.get(
    '/:id/wishes',
    param('id').isMongoId().withMessage('ID thiệp mời không hợp lệ.'),
    wishController.getAdminWishes
);

// 2. PUT /wish/:id/wishes/:wishId/status (Đổi trạng thái Ẩn/Hiện)
router.put(
    '/:id/wishes/:wishId/status',
    param('id').isMongoId().withMessage('ID thiệp mời không hợp lệ.'),
    param('wishId').isMongoId().withMessage('ID lời chúc không hợp lệ.'),
    wishController.updateWishStatus
);

// 3. DELETE /wish/:id/wishes/:wishId (Xóa lời chúc)
router.delete(
    '/:id/wishes/:wishId',
    param('id').isMongoId().withMessage('ID thiệp mời không hợp lệ.'),
    param('wishId').isMongoId().withMessage('ID lời chúc không hợp lệ.'),
    wishController.deleteWish
);

module.exports = router;