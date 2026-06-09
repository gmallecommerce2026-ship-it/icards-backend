// BE/services/invitationTemplate.service.js

const InvitationTemplate = require('../models/invitationTemplate.model');
// Thay thế R2 service bằng Cloudflare Images service
const { uploadFileToCloudflare, deleteFileFromCloudflare, getImageIdFromUrl } = require('./cloudflare.service.js');
const sharp = require('sharp');
const _ = require('lodash');

/**
 * Lấy danh sách mẫu thiệp (có filter và sắp xếp).
 * @param {object} filter - Điều kiện lọc từ Mongoose.
 * @returns {Query}
 */
const queryInvitationTemplates = (filter) => {
  return InvitationTemplate.find({ ...filter, isActive: true }).sort({ displayOrder: 1, createdAt: -1 });
};

/**
 * Lấy chi tiết một mẫu thiệp bằng ID.
 * @param {string} id - ID của mẫu thiệp.
 * @returns {Promise<Document>}
 */
const getTemplateById = async (id) => {
  return await InvitationTemplate.findById(id);
};

/**
 * Xử lý và tải lên các file ảnh cho mẫu thiệp.
 * @param {object} files - Đối tượng files từ multer.
 * @param {object} payload - Dữ liệu thô từ body.
 */
const processTemplateFiles = async (files, payload) => {
    if (!files) return;

    // Xử lý ảnh đại diện
    if (files.image && files.image[0]) {
        const buffer = await sharp(files.image[0].buffer)
            .resize({ width: 400, height: 400, fit: 'inside' })
            .webp({ quality: 90 })
            .toBuffer();
        // Sử dụng Cloudflare Images
        const { url } = await uploadFileToCloudflare(buffer);
        payload.imgSrc = url;
    }

    // Xử lý ảnh xem trước (preview)
    if (files.previewImage && files.previewImage[0]) {
        if (!payload.previewData) payload.previewData = {};
        const buffer = await sharp(files.previewImage[0].buffer)
            .resize({ width: 800, fit: 'inside' })
            .webp({ quality: 85 })
            .toBuffer();
        // Sử dụng Cloudflare Images
        const { url } = await uploadFileToCloudflare(buffer);
        payload.previewData.imageUrl = url;
    }
}

/**
 * Tạo một mẫu thiệp mới.
 * @param {object} payload - Dữ liệu từ controller.
 * @param {object} files - Các file tải lên từ multer.
 * @returns {Promise<Document>}
 */
const createTemplate = async (payload, files) => {
    await processTemplateFiles(files, payload);
    return await InvitationTemplate.create(payload);
};

/**
 * Cập nhật một mẫu thiệp bằng ID.
 * @param {string} id - ID của mẫu thiệp.
 * @param {object} payload - Dữ liệu cập nhật.
 * @param {object} files - Các file tải lên.
 * @returns {Promise<Document>}
 */
const updateTemplateById = async (id, payload, files) => {
    await processTemplateFiles(files, payload);
    return await InvitationTemplate.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
};

/**
 * Xóa một mẫu thiệp bằng ID.
 * @param {string} id - ID của mẫu thiệp.
 */
const deleteTemplateById = async (id) => {
    const template = await InvitationTemplate.findById(id);
    if (template && template.imgSrc) {
        // Lấy ID ảnh từ URL và xóa khỏi Cloudflare Images
        const imageId = getImageIdFromUrl(template.imgSrc);
        if (imageId) {
            await deleteFileFromCloudflare(imageId);
        }
    }
    return await InvitationTemplate.findByIdAndDelete(id);
};

// Các hàm lấy danh mục, nhóm, loại...
const getUniqueCategories = async () => await InvitationTemplate.distinct('category');
const getUniqueGroupsForCategory = async (category) => await InvitationTemplate.distinct('group', { category: category });
const getUniqueTypesForCategoryAndGroup = async (category, group) => await InvitationTemplate.distinct('type', { category, group });

module.exports = {
  queryInvitationTemplates,
  getTemplateById,
  createTemplate,
  updateTemplateById,
  deleteTemplateById,
  getUniqueCategories,
  getUniqueGroupsForCategory,
  getUniqueTypesForCategoryAndGroup,
};