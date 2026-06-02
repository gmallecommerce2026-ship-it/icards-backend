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