const express = require('express');
const router = express.Router();
const invitationController = require('../controllers/invitation.controller');
const { protect } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');
const {
    validateGuest,
    validateWish,
    validateGuestGroup,
    validateInvitationSettings,
    validateInvitationCreation, 
    validateInvitationUpdate, 
} = require('../utils/validators');
const { param } = require('express-validator');
const wishController = require('../controllers/wish.controller');
// === CÁC ROUTE CÔNG KHAI ===
router.get('/slug/:slug', param('slug').trim().notEmpty(), invitationController.getPublicInvitationBySlug);
router.get('/public/:id', param('id').isMongoId(), invitationController.getPublicInvitationById);
router.put('/:invitationId/guests/:guestId/rsvp', param('invitationId').isMongoId(), param('guestId').isMongoId(), invitationController.submitRsvp);
router.post('/:id/wishes', param('id').isMongoId(), validateWish, invitationController.addWish); // Khách gửi lời chúc

// === CÁC ROUTE YÊU CẦU ĐĂNG NHẬP ===
router.use(protect);

const invitationUpload = upload.fields([
    { name: 'groomImageUrl', maxCount: 1 },
    { name: 'brideImageUrl', maxCount: 1 },
    { name: 'heroImages_main', maxCount: 1 },
    { name: 'heroImages_sub1', maxCount: 1 },
    { name: 'heroImages_sub2', maxCount: 1 },
    { name: 'galleryImages', maxCount: 20 }, 
    { name: 'bannerImages', maxCount: 10 },
    { name: 'qrCodeImageUrls', maxCount: 10 },
    { name: 'eventImages', maxCount: 10 },
    { name: 'participantImages', maxCount: 20 },
    { name: 'loveStoryImages', maxCount: 20 },
]);

// --- Lời chúc (Quản lý) ---
// 1. Lấy danh sách lời chúc cho Admin
router.get('/:id/wishes', 
    param('id').isMongoId(), 
    wishController.getAdminWishes
); 

// 2. Cập nhật trạng thái (Ẩn/hiện) lời chúc
router.put('/:id/wishes/:wishId', 
    param('id').isMongoId(), 
    param('wishId').isMongoId(), 
    wishController.updateWishStatus
);

// 3. Xóa lời chúc
router.delete('/:id/wishes/:wishId', 
    param('id').isMongoId(), 
    param('wishId').isMongoId(), 
    wishController.deleteWish
);

// --- Thiệp mời ---
router.route('/')
    .post(invitationUpload, validateInvitationCreation, invitationController.createInvitation)
    .get(invitationController.getMyInvitations);

router.route('/:id')
    .get(param('id').isMongoId(), invitationController.getInvitation)
    .put(param('id').isMongoId(), invitationUpload, validateInvitationUpdate, invitationController.updateInvitation)
    .delete(param('id').isMongoId(), invitationController.deleteInvitation);

router.put('/:id/settings', param('id').isMongoId(), validateInvitationSettings, invitationController.updateInvitationSettings);

// --- Khách mời ---
router.route('/:id/guests').post(param('id').isMongoId(), validateGuest, invitationController.addGuest);
router.post('/:id/guests/bulk', param('id').isMongoId(), invitationController.addGuestsInBulk);
router.post('/:id/guests/bulk-delete', param('id').isMongoId(), invitationController.bulkDeleteGuests);
router.post('/:id/guests/bulk-send-email', param('id').isMongoId(), invitationController.bulkSendEmail);
router.put('/:id/guests/bulk-update', param('id').isMongoId(), invitationController.bulkUpdateGuests);
router.route('/:id/guests/:guestId')
    .put(param('id').isMongoId(), param('guestId').isMongoId(), validateGuest, invitationController.updateGuest)
    .delete(param('id').isMongoId(), param('guestId').isMongoId(), invitationController.removeGuest);
router.put('/:id/guests/:guestId/send-email', param('id').isMongoId(), param('guestId').isMongoId(), invitationController.sendInvitationEmailToGuest);

// --- Nhóm khách mời ---
router.route('/:id/guest-groups')
    .get(param('id').isMongoId(), invitationController.getGuestGroups)
    .post(param('id').isMongoId(), validateGuestGroup, invitationController.addGuestGroup);
router.route('/:id/guest-groups/:groupId')
    .put(param('id').isMongoId(), param('groupId').isMongoId(), validateGuestGroup, invitationController.updateGuestGroup)
    .delete(param('id').isMongoId(), param('groupId').isMongoId(), invitationController.removeGuestGroup);

module.exports = router;