// src/controllers/ai.controller.js
const aiService = require('../services/ai.service');

const generateTetCard = async (req, res, next) => {
    try {
        const { faceImageUrl, prompt } = req.body;

        // Validate cơ bản
        if (!faceImageUrl) {
            return res.status(400).json({ message: 'Vui lòng cung cấp URL ảnh khuôn mặt (faceImageUrl).' });
        }
        if (!prompt) {
            return res.status(400).json({ message: 'Vui lòng nhập mô tả (prompt).' });
        }

        // Gọi Service
        const result = await aiService.generateHybridTetCard(faceImageUrl, prompt);

        res.status(200).json({
            status: 'success',
            message: 'Tạo thiệp Tết thành công!',
            data: result
        });

    } catch (error) {
        if (error.message === "EXHAUSTED_BALANCE") {
            return res.status(402).json({ 
                message: 'Hệ thống AI đang bảo trì tài nguyên (Hết credit). Vui lòng thử lại sau hoặc liên hệ Admin.' 
            });
        }
        next(error);
    }
};

module.exports = {
    generateTetCard
};