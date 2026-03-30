// BE/controllers/masterGuest.controller.js
const masterGuestService = require('../services/masterGuest.service');

/**
 * Controller để lấy danh bạ khách mời của người dùng đang đăng nhập.
 */
const getMyMasterGuests = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const guests = await masterGuestService.getGuestsByUserId(userId);
        res.status(200).json({
            status: 'success',
            results: guests.length,
            data: guests,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMyMasterGuests,
};