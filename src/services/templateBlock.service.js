const TemplateBlock = require('../models/templateBlock.model');
const AppError = require('../utils/AppError');

class TemplateBlockService {
    /**
     * Lấy tất cả các khối hiển thị (Đã populate thông tin thiệp mời bên trong)
     * @returns {Promise<Array>} Danh sách các khối đã sắp xếp
     */
    async getAllBlocks() {
        return await TemplateBlock.find()
            .populate({
                path: 'templates',
                select: 'title imgSrc category group type isActive displayOrder'
            })
            .sort({ displayOrder: 1, createdAt: -1 });
    }

    /**
     * Lấy chi tiết một khối bằng ID
     * @param {string} id - ID của khối cần tìm
     * @returns {Promise<Object>} Đối tượng khối tìm được
     */
    async getBlockById(id) {
        const block = await TemplateBlock.findById(id).populate('templates');
        if (!block) {
            throw new AppError('Không tìm thấy khối giao diện này', 404);
        }
        return block;
    }

    /**
     * Tạo mới khối giao diện (Bộ sưu tập)
     * @param {Object} blockData - Dữ liệu khởi tạo khối
     * @returns {Promise<Object>} Khối vừa tạo thành công
     */
    async createBlock(blockData) {
        const { title, slug, description, isActive, templates } = blockData;

        // Kiểm tra trùng lặp slug cấu hình hệ thống
        const existingBlock = await TemplateBlock.findOne({ slug });
        if (existingBlock) {
            throw new AppError('Đường dẫn (Slug) này đã tồn tại trên hệ thống', 400);
        }

        return await TemplateBlock.create({
            title,
            slug,
            description,
            isActive,
            templates
        });
    }

    /**
     * Cập nhật thông tin khối và danh sách ID mẫu thiệp bên trong
     * @param {string} id - ID khối cần sửa
     * @param {Object} updateData - Dữ liệu mới cập nhật
     * @returns {Promise<Object>} Khối sau khi cập nhật thành công
     */
    async updateBlock(id, updateData) {
        const { title, slug, description, isActive, templates } = updateData;

        if (slug) {
            const duplicate = await TemplateBlock.findOne({ slug, _id: { $ne: id } });
            if (duplicate) {
                throw new AppError('Đường dẫn (Slug) này đã bị trùng với một khối khác', 400);
            }
        }

        const updatedBlock = await TemplateBlock.findByIdAndUpdate(
            id,
            { title, slug, description, isActive, templates },
            { new: true, runValidators: true }
        ).populate('templates');

        if (!updatedBlock) {
            throw new AppError('Không tìm thấy khối giao diện để cập nhật', 404);
        }

        return updatedBlock;
    }

    /**
     * Xóa vĩnh viễn một khối cấu hình hiển thị
     * @param {string} id - ID khối cần xóa
     */
    async deleteBlock(id) {
        const block = await TemplateBlock.findByIdAndDelete(id);
        if (!block) {
            throw new AppError('Không tìm thấy khối giao diện để xóa', 404);
        }
        return true;
    }

    /**
     * Cập nhật thứ tự hiển thị của nhiều khối cùng lúc (Bulk Update vị trí kéo thả)
     * @param {Array<string>} blockIds - Mảng chứa các chuỗi ID đã sắp xếp từ Frontend
     */
    async reorderBlocks(blockIds) {
        if (!Array.isArray(blockIds)) {
            throw new AppError('Dữ liệu mảng ID truyền vào không hợp lệ', 400);
        }

        // Tối ưu hóa hiệu năng high-concurrency bằng bulkWrite đơn lẻ thay vì chạy vòng lặp tuần tự
        const bulkOps = blockIds.map((id, index) => ({
            updateOne: {
                filter: { _id: id },
                update: { $set: { displayOrder: index + 1 } }
            }
        }));

        await TemplateBlock.bulkWrite(bulkOps);
        return true;
    }
}

module.exports = new TemplateBlockService();