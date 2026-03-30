const express = require('express');
const router = express.Router();
const wishController = require('../controllers/wish.controller.js');
const { isAuthenticated } = require('../middleware/auth.middleware');
const invitationController = require('../controllers/invitation.controller');
const { protect } = require('../middleware/auth.middleware'); // Middleware xác thực người dùng
const { upload } = require('../middleware/upload.middleware');
const {
    validateInvitation,
    validateGuest,
    validateWish,
    validateGuestGroup,
    validateInvitationSettings,
    validateInvitationCreation, 
    validateInvitationUpdate, 
} = require('../utils/validators');
const { param } = require('express-validator');

// === Route công khai ===
// Lấy thiệp mời công khai bằng slug, không cần đăng nhập
router.get(
    '/slug/:slug',
    param('slug').trim().notEmpty().withMessage('Slug là bắt buộc.'), // Basic validation for slug
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
    // Thêm validation cho body của RSVP nếu cần (status, attendingCount)
    invitationController.submitRsvp
);

// Gửi lời chúc cho một thiệp mời, không cần đăng nhập
router.post(
    '/:id/wishes',
    param('id').isMongoId().withMessage('ID thiệp mời không hợp lệ.'),
    validateWish, // Áp dụng validation cho lời chúc
    invitationController.addWish
);

router.get(
    '/public/:id/wishes',
    param('id').isMongoId().withMessage('ID thiệp mời không hợp lệ.'),
    invitationController.getPublicWishes
);

router.get(
    '/:id/wishes',
    param('id').isMongoId().withMessage('ID thiệp mời không hợp lệ.'),
    invitationController.getPublicWishes // Đảm bảo hàm getWishes đã được định nghĩa trong controller
);
// === Các Route cần xác thực (bảo vệ) ===
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
    // --- Thêm field cho ảnh người tham gia ---
    { name: 'participantImages', maxCount: 20 },
    { name: 'loveStoryImages', maxCount: 20 },
]);


    
// CRUD cho khách mời trong một thiệp (chỉ chủ sở hữu mới có quyền)
router.route('/:id/guests')
    .post(
        param('id').isMongoId().withMessage('ID thiệp mời không hợp lệ.'),
        validateGuest, // Thêm validateGuest
        invitationController.addGuest
    );

router.post(
    '/:id/guests/bulk',
    param('id').isMongoId().withMessage('ID thiệp mời không hợp lệ.'),
    invitationController.addGuestsInBulk
);

router.post(
    '/:id/guests/bulk-delete',
    param('id').isMongoId().withMessage('ID thiệp mời không hợp lệ.'),
    invitationController.bulkDeleteGuests
);

// Route để gửi email hàng loạt
router.post(
    '/:id/guests/bulk-send-email',
    param('id').isMongoId().withMessage('ID thiệp mời không hợp lệ.'),
    invitationController.bulkSendEmail
);

// Route để cập nhật hàng loạt (ví dụ: thêm vào nhóm)
router.put(
    '/:id/guests/bulk-update',
    param('id').isMongoId().withMessage('ID thiệp mời không hợp lệ.'),
    invitationController.bulkUpdateGuests
);

router.route('/:id/guests/:guestId')
    .put(
        param('id').isMongoId().withMessage('ID thiệp mời không hợp lệ.'),
        param('guestId').isMongoId().withMessage('ID khách mời không hợp lệ.'),
        validateGuest, 
        invitationController.updateGuest
    )
    .delete(
        param('id').isMongoId().withMessage('ID thiệp mời không hợp lệ.'),
        param('guestId').isMongoId().withMessage('ID khách mời không hợp lệ.'),
        invitationController.removeGuest
    );


router.put(
    '/:id/guests/:guestId/send-email',
    param('id').isMongoId().withMessage('ID thiệp mời không hợp lệ.'),
    param('guestId').isMongoId().withMessage('ID khách mời không hợp lệ.'),
    invitationController.sendInvitationEmailToGuest
);
router.put(
    '/:id/settings',
    param('id').isMongoId().withMessage('ID thiệp mời không hợp lệ.'),
    validateInvitationSettings, // <-- Thêm validator đã import
    invitationController.updateInvitationSettings 
);

// MỚI: Routes để quản lý nhóm khách mời
router.route('/:id/guest-groups')
    .get(
        param('id').isMongoId().withMessage('ID thiệp mời không hợp lệ.'),
        invitationController.getGuestGroups
    )
    .post(
        param('id').isMongoId().withMessage('ID thiệp mời không hợp lệ.'),
        validateGuestGroup, 
        invitationController.addGuestGroup
    );

router.route('/:id/guest-groups/:groupId')
    .put(
        param('id').isMongoId().withMessage('ID thiệp mời không hợp lệ.'),
        param('groupId').isMongoId().withMessage('ID nhóm khách mời không hợp lệ.'),
        validateGuestGroup, 
        invitationController.updateGuestGroup
    )
    .delete(
        param('id').isMongoId().withMessage('ID thiệp mời không hợp lệ.'),
        param('groupId').isMongoId().withMessage('ID nhóm khách mời không hợp lệ.'),
        invitationController.removeGuestGroup
    );

router.get(
    '/:id/wishes',
    param('id').isMongoId().withMessage('ID thiệp mời không hợp lệ.'),
    invitationController.getAdminWishes
);

router.route('/:id/wishes/:wishId')
    .put(
        param('id').isMongoId().withMessage('ID thiệp mời không hợp lệ.'),
        param('wishId').isMongoId().withMessage('ID lời chúc không hợp lệ.'),
        invitationController.updateWishStatus
    )
    .delete(
        param('id').isMongoId().withMessage('ID thiệp mời không hợp lệ.'),
        param('wishId').isMongoId().withMessage('ID lời chúc không hợp lệ.'),
        invitationController.deleteWish
    );

// CRUD cho thiệp mời của người dùng
router.route('/')
    // Sửa ở đây: Thêm middleware `invitationUpload` và `validateInvitationCreation`
    .post(invitationUpload, validateInvitationCreation, invitationController.createInvitation)
    .get(invitationController.getMyInvitations);

router.route('/:id')
    .get(param('id').isMongoId(), invitationController.getInvitation)
    // Sửa ở đây: Thêm middleware `invitationUpload` và `validateInvitationUpdate`
    .put(
        param('id').isMongoId(),
        invitationUpload,
        validateInvitationUpdate, 
        invitationController.updateInvitation
    )
    .delete(param('id').isMongoId(), invitationController.deleteInvitation);
module.exports = router;