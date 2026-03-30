// Backend/controllers/wish.controller.js
const Wish = require('../models/wish.model');
const Invitation = require('../models/invitation.model');

// ==========================================
// API DÀNH CHO KHÁCH (PUBLIC)
// ==========================================

// 1. Khách gửi lời chúc mới
exports.createWish = async (req, res, next) => {
    try {
        const { id: invitationId } = req.params;
        const { senderName, content } = req.body;

        // Kiểm tra thiệp có tồn tại không
        const invitation = await Invitation.findById(invitationId);
        if (!invitation) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thiệp mời' });
        }

        const newWish = await Wish.create({
            invitation: invitationId,
            senderName,
            content,
            status: 'approved' // Chỉnh thành 'pending' nếu muốn duyệt thủ công
        });

        res.status(201).json({
            success: true,
            data: newWish,
            message: 'Gửi lời chúc thành công'
        });
    } catch (error) {
        next(error);
    }
};

// 2. Lấy danh sách lời chúc hiển thị lên thiệp (Chỉ lấy status: 'approved')
exports.getPublicWishes = async (req, res, next) => {
    try {
        const { id: invitationId } = req.params;

        const wishes = await Wish.find({
            invitation: invitationId,
            status: 'approved'
        }).sort('-createdAt'); // Sắp xếp mới nhất lên đầu

        res.status(200).json({
            success: true,
            data: wishes
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// API DÀNH CHO QUẢN TRỊ VIÊN / CHỦ THIỆP
// ==========================================

// 3. Lấy TẤT CẢ lời chúc để quản lý (bao gồm cả ẩn/hiện)
exports.getAdminWishes = async (req, res, next) => {
    try {
        const { id: invitationId } = req.params;

        const wishes = await Wish.find({ invitation: invitationId }).sort('-createdAt');

        res.status(200).json({
            success: true,
            data: wishes
        });
    } catch (error) {
        next(error);
    }
};

// 4. Đổi trạng thái lời chúc (Ẩn/Hiện)
exports.updateWishStatus = async (req, res, next) => {
    try {
        const { wishId } = req.params;
        const { status } = req.body;

        if (!['pending', 'approved', 'hidden'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
        }

        const wish = await Wish.findByIdAndUpdate(
            wishId,
            { status },
            { new: true, runValidators: true }
        );

        if (!wish) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lời chúc' });
        }

        res.status(200).json({
            success: true,
            data: wish,
            message: 'Cập nhật trạng thái thành công'
        });
    } catch (error) {
        next(error);
    }
};

// 5. Xóa lời chúc
exports.deleteWish = async (req, res, next) => {
    try {
        const { wishId } = req.params;

        const wish = await Wish.findByIdAndDelete(wishId);

        if (!wish) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lời chúc' });
        }

        res.status(200).json({
            success: true,
            data: null,
            message: 'Đã xóa lời chúc'
        });
    } catch (error) {
        next(error);
    }
};