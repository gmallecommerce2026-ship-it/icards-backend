// AdminDBBackend/controllers/templateBlock.controller.js
const templateBlockService = require('../services/templateBlock.service');
const catchAsync = require('../utils/catchAsync');

exports.getBlocks = catchAsync(async (req, res, next) => {
    const blocks = await templateBlockService.getAllBlocks();
    res.status(200).json({
        success: true,
        results: blocks.length,
        data: blocks
    });
});
/**
 * API lấy danh sách khối hiển thị ngoài Trang chủ (Giao diện Client)
 * GET /api/v1/public/template-blocks
 */
exports.getPublicBlocks = catchAsync(async (req, res, next) => {
    const blocks = await templateBlockService.getPublicActiveBlocks();
    
    res.status(200).json({
        success: true,
        results: blocks.length,
        data: blocks
    });
});

/**
 * API lấy chi tiết một khối thiệp theo Slug để hiển thị danh sách thiệp bên trong bộ sưu tập
 * GET /api/v1/public/template-blocks/slug/:slug
 */
exports.getBlockBySlug = catchAsync(async (req, res, next) => {
    const block = await templateBlockService.getBlockBySlug(req.params.slug);
    
    res.status(200).json({
        success: true,
        data: block
    });
});
exports.getBlockById = catchAsync(async (req, res, next) => {
    const block = await templateBlockService.getBlockById(req.params.id);
    res.status(200).json({
        success: true,
        data: block
    });
});

exports.createBlock = catchAsync(async (req, res, next) => {
    const newBlock = await templateBlockService.createBlock(req.body);
    res.status(201).json({
        success: true,
        data: newBlock
    });
});

exports.updateBlock = catchAsync(async (req, res, next) => {
    const updatedBlock = await templateBlockService.updateBlock(req.params.id, req.body);
    res.status(200).json({
        success: true,
        data: updatedBlock
    });
});

exports.deleteBlock = catchAsync(async (req, res, next) => {
    await templateBlockService.deleteBlock(req.params.id);
    res.status(200).json({
        success: true,
        message: 'Xóa khối giao diện thành công'
    });
});

exports.reorderBlocks = catchAsync(async (req, res, next) => {
    await templateBlockService.reorderBlocks(req.body.blocks);
    res.status(200).json({
        success: true,
        message: 'Cập nhật thứ tự các khối giao diện thành công!'
    });
});