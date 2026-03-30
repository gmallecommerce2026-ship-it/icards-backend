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

// ==========================================
// === CÁC ROUTE CÔNG KHAI (KHÔNG CẦN ĐĂNG NHẬP) ===
// ==========================================

router.get(
    '/slug/:slug',
    param('slug').trim().notEmpty().withMessage('Slug là bắt buộc.'),
    invitationController.getPublicInvitationBySlug
);

router.get(
    '/public/:id',
    param('id').isMongoId().withMessage('ID thiệp mời không hợp lệ.'),
    invitationController.getPublicInvitationById
);

router.put(
    '/:invitationId/guests/:guestId/rsvp',
    param('invitationId').isMongoId().withMessage('ID thiệp mời không hợp lệ.'),
    param('guestId').isMongoId().withMessage('ID khách mời không hợp lệ.'),
    invitationController.submitRsvp
);

// Khách gửi lời chúc mới
router.post(
    '/:id/wishes',
    param('id').isMongoId().withMessage('ID thiệp mời không hợp lệ.'),
    validateWish,
    invitationController.addWish
);

// ==========================================
// === CÁC ROUTE BẢO VỆ (YÊU CẦU ĐĂNG NHẬP) ===
// ==========================================
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

// --- Quản lý Thiệp mời ---
router.route('/')
    .post(invitationUpload, validateInvitationCreation, invitationController.createInvitation)
    .get(invitationController.getMyInvitations);

router.route('/:id')
    .get(param('id').isMongoId(), invitationController.getInvitation)
    .put(param('id').isMongoId(), invitationUpload, validateInvitationUpdate, invitationController.updateInvitation)
    .delete(param('id').isMongoId(), invitationController.deleteInvitation);

router.put(
    '/:id/settings',
    param('id').isMongoId().withMessage('ID thiệp mời không hợp lệ.'),
    validateInvitationSettings,
    invitationController.updateInvitationSettings 
);

// --- Quản lý Lời chúc (Cho Admin/Chủ thiệp) ---

// Lấy danh sách lời chúc
router.get(
    '/:id/wishes',
    param('id').isMongoId().withMessage('ID thiệp mời không hợp lệ.'),
    invitationController.getWishes 
);

// Xóa một lời chúc
router.delete(
    '/:id/wishes/:wishId',
    param('id').isMongoId().withMessage('ID thiệp mời không hợp lệ.'),
    param('wishId').isMongoId().withMessage('ID lời chúc không hợp lệ.'),
    invitationController.removeWish 
);


// --- Quản lý Khách mời ---
router.route('/:id/guests')
    .post(param('id').isMongoId(), validateGuest, invitationController.addGuest);

router.post('/:id/guests/bulk', param('id').isMongoId(), invitationController.addGuestsInBulk);
router.post('/:id/guests/bulk-delete', param('id').isMongoId(), invitationController.bulkDeleteGuests);
router.post('/:id/guests/bulk-send-email', param('id').isMongoId(), invitationController.bulkSendEmail);
router.put('/:id/guests/bulk-update', param('id').isMongoId(), invitationController.bulkUpdateGuests);

router.route('/:id/guests/:guestId')
    .put(param('id').isMongoId(), param('guestId').isMongoId(), validateGuest, invitationController.updateGuest)
    .delete(param('id').isMongoId(), param('guestId').isMongoId(), invitationController.removeGuest);

router.put('/:id/guests/:guestId/send-email', param('id').isMongoId(), param('guestId').isMongoId(), invitationController.sendInvitationEmailToGuest);

// --- Quản lý Nhóm khách mời ---
router.route('/:id/guest-groups')
    .get(param('id').isMongoId(), invitationController.getGuestGroups)
    .post(param('id').isMongoId(), validateGuestGroup, invitationController.addGuestGroup);

router.route('/:id/guest-groups/:groupId')
    .put(param('id').isMongoId(), param('groupId').isMongoId(), validateGuestGroup, invitationController.updateGuestGroup)
    .delete(param('id').isMongoId(), param('groupId').isMongoId(), invitationController.removeGuestGroup);

module.exports = router;