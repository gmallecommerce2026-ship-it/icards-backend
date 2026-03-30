// BE/routes/masterGuest.routes.js
const express = require('express');
const router = express.Router();
const masterGuestController = require('../controllers/masterGuest.controller');
const { protect } = require('../middleware/auth.middleware');

// Tất cả các route trong file này đều yêu cầu người dùng phải đăng nhập
router.use(protect);

// GET /api/master-guests/ -> Lấy danh bạ của tôi
router.route('/')
    .get(masterGuestController.getMyMasterGuests);

// (Bạn có thể thêm các route POST, PUT, DELETE ở đây trong tương lai nếu cần)

module.exports = router;