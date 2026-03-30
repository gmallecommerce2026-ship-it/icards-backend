// BE/services/masterGuest.service.js
const MasterGuest = require('../models/masterGuest.model');

/**
 * Lấy toàn bộ danh bạ khách mời của một người dùng.
 * @param {string} userId - ID của người dùng.
 * @returns {Promise<Array>} Danh sách khách mời.
 */
const getGuestsByUserId = async (userId) => {
    return await MasterGuest.find({ user: userId }).sort({ name: 1 });
};

/**
 * Tự động thêm hoặc cập nhật một khách mời vào danh bạ.
 * Sẽ không tạo bản ghi mới nếu khách mời có email đã tồn tại.
 * @param {string} userId - ID của người dùng.
 * @param {object} guestData - Dữ liệu khách mời ({ name, email, phone }).
 */
const addOrUpdateGuest = async (userId, guestData) => {
    // Chỉ xử lý những khách mời có email
    if (!guestData.email) {
        return;
    }

    const filter = { user: userId, email: guestData.email.toLowerCase() };
    const update = {
        name: guestData.name,
        phone: guestData.phone || '', // Đảm bảo có giá trị mặc định
    };

    // findOneAndUpdate với option `upsert: true` sẽ:
    // 1. Tìm một bản ghi khớp với `filter`.
    // 2. Nếu tìm thấy, cập nhật nó với dữ liệu trong `update`.
    // 3. Nếu không tìm thấy, tạo một bản ghi mới dựa trên cả `filter` và `update`.
    await MasterGuest.findOneAndUpdate(filter, update, {
        new: true,
        upsert: true,
        runValidators: true,
    });
};

module.exports = {
    getGuestsByUserId,
    addOrUpdateGuest,
};