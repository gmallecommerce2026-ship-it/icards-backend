// TrainData/BE/controllers/font.controller.js
const Font = require('../models/font.model'); // Giả sử bạn đã copy model sang BE

exports.getPublicFonts = async (req, res, next) => {
    try {
        const fonts = await Font.find({ isActive: true }).select('name url category').sort({ name: 1 });
        res.status(200).json({ status: 'success', data: fonts });
    } catch (error) {
        next(error);
    }
};