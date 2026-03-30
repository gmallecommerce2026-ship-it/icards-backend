// BE/routes/user.routes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { upload, resizeImage, uploadImageToCloudflare } = require('../middleware/upload.middleware');
const {
    validatePasswordChange 
} = require('../utils/validators');

router.get('/', protect, authorize('admin'), userController.getUsers);
router.get('/me', protect, userController.getMe);
router.get('/me/personal-images', protect, userController.getMyPersonalImages);

router.put('/me', protect, userController.updateMe);
router.put('/me/change-password', protect, validatePasswordChange, userController.changePassword);
router.put('/me/avatar', protect, upload.single('avatar'), resizeImage, uploadImageToCloudflare, userController.updateAvatar);

router.post('/me/upload-images', protect, upload.array('images', 10), userController.uploadUserImages);

router.get('/:id', protect, authorize('admin'), userController.getUser);

module.exports = router;