const designAssetService = require('../services/designAsset.service');

/**
 * Controller để lấy các tài nguyên thiết kế.
 * Lấy loại tài nguyên từ query string (vd: /api/design-assets?type=icon)
 */
const getDesignAssets = async (req, res, next) => {
    try {
        const { type } = req.query; // Lấy 'type' từ query params
        const assets = await designAssetService.getAssetsByType(type);
        res.status(200).json({
            status: 'success',
            results: assets.length,
            data: assets,
        });
    } catch (error) {
        
    }
};

// Controller để seed dữ liệu (chỉ dùng cho mục đích phát triển)
const seedInitialAssets = async (req, res, next) => {
    try {
        await designAssetService.seedAssets();
        res.status(200).json({ message: 'Design assets database seeded successfully!' });
    } catch (error) {
    }
};

module.exports = {
    getDesignAssets,
    seedInitialAssets,
};