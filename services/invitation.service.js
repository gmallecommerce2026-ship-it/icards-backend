const Invitation = require('../models/invitation.model');
const InvitationTemplate = require('../models/invitationTemplate.model'); // Import model template
const nodemailer = require('nodemailer'); // Uncomment if using Nodemailer
const mongoose = require('mongoose');
const masterGuestService = require('./masterGuest.service');
/**
 * [MỚI]
 * Lấy một thiệp mời công khai bằng slug của nó.
 * Hàm này không yêu cầu xác thực người dùng.
 * @param {string} slug - Slug của thiệp mời.
 * @returns {Promise<Document|null>} Thiệp mời nếu tìm thấy.
 */
const getInvitationBySlug = async (slug, guestId = null) => { // Thêm guestId làm tham số
    const invitation = await Invitation.findOne({ slug: slug }).populate('template', 'title');
    
    if (!invitation) {
        return null; // Trả về null nếu không tìm thấy thiệp
    }

    // Nếu có mật khẩu, logic kiểm tra sẽ ở controller/frontend
    if (invitation.settings.password) {
        // ...
    }

    // Nếu có guestId, tìm khách mời cụ thể và trả về
    if (guestId && mongoose.Types.ObjectId.isValid(guestId)) {
        const guest = invitation.guests.id(guestId);
        if (guest) {
            // Tạo một object mới để không thay đổi bản gốc và chỉ trả về những gì cần thiết
            const publicInvitation = invitation.toObject();
            publicInvitation.guestDetails = guest.toObject();
            return publicInvitation;
        }
    }

    return invitation; // Trả về thiệp gốc nếu không có guestId hoặc không tìm thấy guest
};



/**
 * Tạo một thiệp mời mới từ template.
 * @param {string} userId - ID người dùng.
 * @param {string} templateId - ID của mẫu thiệp được chọn.
 * @param {string} slug - Slug duy nhất cho URL.
 * @param {object} content - Dữ liệu nội dung thiệp từ người dùng.
 * @param {object} design - Tùy chỉnh thiết kế từ người dùng.
 * @param {object} settings - Các cài đặt cho thiệp.
 * @returns {Promise<Document>} Thiệp mời vừa được tạo.
 */
const createInvitationFromTemplate = async (userId, templateId, slug, content, design, settings) => {
    const template = await InvitationTemplate.findById(templateId);
    if (!template) {
        throw new Error('Không tìm thấy mẫu thiệp.');
    }

    const finalDesign = {
        ...(template.templateData?.design || {}),
        ...(design || {}),
    };

    const newInvitation = new Invitation({
        user: userId,
        template: templateId,
        slug: slug,
        content: content, // content (là pages array) được truyền trực tiếp
        design: finalDesign,
        settings: settings || { showWishList: true, showGuestList: false },
    });

    return await newInvitation.save();
};

/**
 * Cập nhật một thiệp mời.
 * @param {string} invitationId - ID của thiệp mời.
 * @param {string} userId - ID của người dùng.
 * @param {object} updateData - Dữ liệu cần cập nhật.
 * @returns {Promise<Document|null>} Thiệp mời đã được cập nhật.
 */
const updateInvitation = async (invitationId, userId, updateData) => {
    const updatePayload = {}; // Đổi tên từ allowedUpdates

    // Các trường này có thể ghi đè an toàn
    if (updateData.slug) updatePayload.slug = updateData.slug;
    if (updateData.content) updatePayload.content = updateData.content;
    if (updateData.design) updatePayload.design = updateData.design;

    // --- BẮT ĐẦU SỬA LỖI ---
    // if (updateData.settings) allowedUpdates.settings = updateData.settings; // <-- XÓA DÒNG NÀY

    // [MỚI] Sử dụng ký pháp dấu chấm để HỢP NHẤT (merge) đối tượng 'settings'
    // thay vì ghi đè toàn bộ.
    if (updateData.settings) {
        for (const key in updateData.settings) {
            if (Object.prototype.hasOwnProperty.call(updateData.settings, key)) {
                // Thao tác này sẽ tạo ra các key như:
                // 'settings.title', 'settings.groomName', 'settings.groomNameStyle', v.v.
                updatePayload[`settings.${key}`] = updateData.settings[key];
            }
        }
    }
    // --- KẾT THÚC SỬA LỖI ---

    return await Invitation.findOneAndUpdate(
        { _id: invitationId, user: userId },
        { $set: updatePayload }, // <-- Sử dụng updatePayload đã được xử lý
        { new: true, runValidators: true }
    );
};

const getInvitationsByUserId = async (userId) => {
    return await Invitation.find({ user: userId }).populate('template', 'title imgSrc');
};

const getInvitationByIdAndUser = async (invitationId, userId) => {
    return await Invitation.findOne({ _id: invitationId, user: userId }).populate('template');
};

const deleteInvitation = async (invitationId, userId) => {
    const result = await Invitation.deleteOne({ _id: invitationId, user: userId });
    return result.deletedCount > 0;
};

// --- Quản lý Khách mời ---

const addGuestToInvitation = async (invitationId, userId, guestData) => {
    const invitation = await Invitation.findOne({ _id: invitationId, user: userId });
    if (!invitation) {
        return null;
    }
    invitation.guests.push(guestData);

    try {
        await masterGuestService.addOrUpdateGuest(userId, guestData);
    } catch (syncError) {
        console.error(`Lỗi đồng bộ danh bạ cho email ${guestData.email}:`, syncError);
    }

    return await invitation.save();
};


/**
 * [MỚI]
 * Thêm hàng loạt khách mời vào thiệp mời.
 * @param {string} invitationId - ID của thiệp.
 * @param {string} userId - ID của chủ thiệp.
 * @param {Array<object>} newGuests - Mảng các khách mời mới.
 * @returns {Promise<{invitation: Document, addedCount: number}>} Thiệp mời đã được cập nhật và số lượng khách đã thêm.
 */
const addGuestsInBulkToInvitation = async (invitationId, userId, newGuests) => {
    const invitation = await Invitation.findOne({ _id: invitationId, user: userId });
    if (!invitation) {
        throw new Error('Không tìm thấy thiệp hoặc bạn không có quyền.');
    }

    const existingEmails = new Set(invitation.guests.map(g => g.email).filter(Boolean));
    let addedCount = 0;
    const guestsToSync = []; // <-- Tạo mảng để lưu khách mời cần đồng bộ

    newGuests.forEach(guestData => {
        if (!guestData.name || String(guestData.name).trim() === "") {
            return;
        }
        if (guestData.email && existingEmails.has(guestData.email)) {
            return;
        }
        invitation.guests.push(guestData);
        if (guestData.email) {
            existingEmails.add(guestData.email);
            guestsToSync.push(guestData); // <-- Thêm vào mảng đồng bộ
        }
        addedCount++;
    });

    const updatedInvitation = await invitation.save();

    // Sau khi lưu thiệp mời, đồng bộ tất cả khách mời mới vào danh bạ
    if (guestsToSync.length > 0) {
        console.log(`Đang đồng bộ ${guestsToSync.length} khách mời vào danh bạ...`);
        // Chạy đồng bộ mà không cần đợi (fire-and-forget) để không làm chậm phản hồi
        Promise.all(guestsToSync.map(guest => masterGuestService.addOrUpdateGuest(userId, guest)))
            .catch(syncError => console.error('Lỗi khi đồng bộ hàng loạt vào danh bạ:', syncError));
    }

    return { invitation: updatedInvitation, addedCount };
};


/**
 * [MỚI]
 * Cập nhật thông tin một khách mời trong thiệp.
 * @param {string} invitationId - ID của thiệp.
 * @param {string} guestId - ID của khách mời cần cập nhật.
 * @param {string} userId - ID của chủ thiệp.
 * @param {object} guestUpdateData - Dữ liệu mới của khách mời.
 * @returns {Promise<Document|null>} Thiệp mời đã được cập nhật.
 */
const updateGuestInInvitation = async (invitationId, guestId, userId, guestUpdateData) => {
    const invitation = await Invitation.findOne({ _id: invitationId, user: userId });
    if (!invitation) {
        return null;
    }
    const guest = invitation.guests.id(guestId);
    if (!guest) {
        return null;
    }
    guest.set(guestUpdateData);
    return await invitation.save();
};

/**
 * [MỚI]
 * Xóa một khách mời khỏi thiệp.
 * @param {string} invitationId - ID của thiệp.
 * @param {string} guestId - ID của khách mời cần xóa.
 * @param {string} userId - ID của chủ thiệp.
 * @returns {Promise<Document|null>} Thiệp mời đã được cập nhật.
 */
const removeGuestFromInvitation = async (invitationId, guestId, userId) => {
    const invitation = await Invitation.findOne({ _id: invitationId, user: userId });
    if (!invitation) {
        throw new Error('Không tìm thấy thiệp hoặc bạn không có quyền.');
    }

    // Find the index of the guest to remove
    const guestIndex = invitation.guests.findIndex(g => g._id.toString() === guestId);
    if (guestIndex === -1) {
        throw new Error('Không tìm thấy khách mời.'); // Guest not found
    }

    // Remove the guest using splice
    invitation.guests.splice(guestIndex, 1);
    
    return await invitation.save();
};

// --- Quản lý Lời chúc ---

/**
 * [MỚI]
 * Thêm một lời chúc vào thiệp (công khai).
 * @param {string} invitationId - ID của thiệp.
 * @param {object} wishData - Dữ liệu lời chúc (author, message).
 * @returns {Promise<Document|null>} Thiệp mời đã được cập nhật.
 */
const addWishToInvitation = async (invitationId, wishData) => {
    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
        throw new Error('Không tìm thấy thiệp.');
    }
    if (!invitation.settings.showWishList) {
        throw new Error('Chủ nhân thiệp không cho phép gửi lời chúc.');
    }
    invitation.wishes.push(wishData);
    return await invitation.save();
};

// MỚI: Function để cập nhật cài đặt thiệp

const updateInvitationSettings = async (invitationId, userId, settingsData) => {
    
    // Tạo một object update trống
    const updatePayload = {};

    // Dùng vòng lặp để biến đổi settingsData thành "dot notation"
    // Ví dụ: { title: 'Mới' } sẽ trở thành { 'settings.title': 'Mới' }
    for (const key in settingsData) {
        // Đảm bảo chỉ lặp qua các thuộc tính của chính object
        if (Object.prototype.hasOwnProperty.call(settingsData, key)) {
            // Gán giá trị vào payload mới với key có tiền tố 'settings.'
            updatePayload[`settings.${key}`] = settingsData[key];
        }
    }

    // Bây giờ updatePayload có dạng: { 'settings.title': '...', 'settings.groomName': '...' }
    // Lệnh $set với payload này sẽ chỉ cập nhật các trường con này,
    // và giữ nguyên các trường khác trong 'settings'.

    return await Invitation.findOneAndUpdate(
        { _id: invitationId, user: userId },
        { $set: updatePayload }, // <-- Sử dụng updatePayload đã được xử lý
        { new: true, runValidators: true }
    );
};



// --- MỚI: Quản lý Nhóm khách mời ---

/**
 * Thêm một nhóm khách mời mới vào thiệp.
 * @param {string} invitationId - ID của thiệp.
 * @param {string} userId - ID của chủ thiệp.
 * @param {object} groupData - Dữ liệu nhóm (name, salutation).
 * @returns {Promise<Document|null>} Thiệp mời đã được cập nhật.
 */
const addGuestGroupToInvitation = async (invitationId, userId, groupData) => {
    const invitation = await Invitation.findOne({ _id: invitationId, user: userId });
    if (!invitation) {
        throw new Error('Không tìm thấy thiệp hoặc bạn không có quyền.');
    }

    // Kiểm tra trùng tên nhóm trong thiệp này
    const existingGroup = invitation.guestGroups.find(g => g.name === groupData.name);
    if (existingGroup) {
        throw new Error('Tên nhóm đã tồn tại.');
    }

    invitation.guestGroups.push(groupData);
    return await invitation.save();
};

/**
 * Lấy tất cả nhóm khách mời của một thiệp.
 * @param {string} invitationId - ID của thiệp.
 * @param {string} userId - ID của chủ thiệp.
 * @returns {Promise<Array>} Mảng các nhóm khách mời.
 */
const getGuestGroupsByInvitationId = async (invitationId, userId) => {
    const invitation = await Invitation.findOne({ _id: invitationId, user: userId }).select('guestGroups');
    if (!invitation) {
        throw new Error('Không tìm thấy thiệp hoặc bạn không có quyền.');
    }
    return invitation.guestGroups;
};

/**
 * Cập nhật thông tin một nhóm khách mời trong thiệp.
 * @param {string} invitationId - ID của thiệp.
 * @param {string} groupId - ID của nhóm cần cập nhật.
 * @param {string} userId - ID của chủ thiệp.
 * @param {object} updateData - Dữ liệu mới của nhóm (name, salutation).
 * @returns {Promise<Document|null>} Thiệp mời đã được cập nhật.
 */
const updateGuestGroupInInvitation = async (invitationId, groupId, userId, updateData) => {
    const invitation = await Invitation.findOne({ _id: invitationId, user: userId });
    if (!invitation) {
        throw new Error('Không tìm thấy thiệp hoặc bạn không có quyền.');
    }

    const group = invitation.guestGroups.id(groupId);
    if (!group) {
        throw new Error('Không tìm thấy nhóm khách mời.');
    }

    // Kiểm tra trùng tên nếu tên đang được cập nhật
    if (updateData.name && updateData.name !== group.name) {
        const existingGroup = invitation.guestGroups.find(g => g.name === updateData.name && g._id.toString() !== groupId);
        if (existingGroup) {
            throw new Error('Tên nhóm đã tồn tại.');
        }
    }

    group.set(updateData);
    return await invitation.save();
};

/**
 * Xóa một nhóm khách mời khỏi thiệp.
 * @param {string} invitationId - ID của thiệp.
 * @param {string} groupId - ID của nhóm cần xóa.
 * @param {string} userId - ID của chủ thiệp.
 * @returns {Promise<Document|null>} Thiệp mời đã được cập nhật.
 */
const removeGuestGroupFromInvitation = async (invitationId, groupId, userId) => {
    const invitation = await Invitation.findOne({ _id: invitationId, user: userId });
    if (!invitation) {
        throw new Error('Không tìm thấy thiệp hoặc bạn không có quyền.');
    }

    // Find the index of the group to remove
    const groupIndex = invitation.guestGroups.findIndex(g => g._id.toString() === groupId);
    if (groupIndex === -1) {
        throw new Error('Không tìm thấy nhóm khách mời.'); // Group not found
    }

    // Remove the group using splice
    invitation.guestGroups.splice(groupIndex, 1);
    
    return await invitation.save();
};

/**
 * MỚI: Gửi email thiệp mời đến một khách mời cụ thể.
 * @param {string} invitationId - ID của thiệp mời.
 * @param {string} guestId - ID của khách mời.
 * @param {string} userId - ID của chủ thiệp.
 * @returns {Promise<Object>} Trả về thông tin khách mời đã được cập nhật trạng thái email.
 */
const sendInvitationEmailToGuest = async (invitationId, guestId, userId) => {
    const invitation = await Invitation.findOne({ _id: invitationId, user: userId });
    if (!invitation) {
        throw new Error('Không tìm thấy thiệp hoặc bạn không có quyền.');
    }

    const guest = invitation.guests.id(guestId);
    if (!guest) {
        throw new Error('Không tìm thấy khách mời.');
    }

    if (!guest.email) {
        throw new Error('Khách mời không có địa chỉ email.');
    }

    const { title, description, salutationStyle, useGlobalSalutation } = invitation.settings; // MỚI
    const { name, salutation, _id: finalGuestId } = guest;

    const finalSalutation = useGlobalSalutation
        ? salutationStyle
        : (salutation || salutationStyle);
    
        const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const destinationUrl = `${frontendBaseUrl}/events/${invitation._id}?guestId=${finalGuestId}`;

    const finalSubject = (title || 'Bạn có một lời mời mới!').replace('{TênKháchMời}', name).replace('{LờiXưngHô}', finalSalutation);

    const personalizedBody = `
        <p><b>${finalSalutation} ${name},</b></p>
    `;

    const finalBody = (description || 'Bạn vừa nhận được một lời mời sự kiện.').replace(/\n/g, '<br>');

    const fullHtmlBody = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${finalSubject}</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                width: 100% !important;
                background-color: #f4f4f4;
                font-family: 'Roboto', Arial, sans-serif;
            }
            .container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
            }
            .content {
                padding: 30px;
                text-align: center;
                font-size: 16px;
                line-height: 1.6;
                color: #333333;
            }
            .header {
                padding: 20px 0;
                text-align: center;
                background-color: #ffffff;
            }
            .header p {
                max-width: 180px;
            }
            .button {
                display: inline-block;
                padding: 12px 25px;
                margin-top: 25px;
                font-family: 'Roboto', Arial, sans-serif;
                font-size: 16px;
                font-weight: bold;
                color: #ffffff !important;
                background-color: #f7a600; /* Màu cam chủ đạo của website */
                border-radius: 5px;
                text-decoration: none;
                transition: background-color 0.3s ease;
            }
            .button:hover {
                background-color: #e69500; /* Màu cam đậm hơn khi hover */
            }
            .footer {
                text-align: center;
                padding: 20px;
                font-size: 12px;
                color: #999999;
            }
        </style>
    </head>
    <body>
        <table width="100%" border="0" cellspacing="0" cellpadding="20" style="background-color: #f4f4f4;">
            <tr>
                <td align="center">
                    <table class="container" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                            <td class="header">
                                <p>iCards</p>
                            </td>
                        </tr>

                        <tr>
                            <td class="content">
                                ${personalizedBody}
                                <p style="margin: 0;">${finalBody}</p>
                                <a href="${destinationUrl}" class="button">
                                    Tìm hiểu thêm về chúng tôi
                                </a>
                            </td>
                        </tr>
                        
                        <tr>
                            <td class="footer">
                                ©${new Date().getFullYear()} - iCards. All rights reserved.
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
    // ---- END: NÂNG CẤP TOÀN BỘ GIAO DIỆN EMAIL ----

    const transporter = nodemailer.createTransport({
        service: 'gmail', 
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: guest.email,
        subject: finalSubject,
        html: fullHtmlBody, 
    };

    try {
        await transporter.sendMail(mailOptions);
        guest.emailStatus = 'Đã gửi';
        await invitation.save();
        return guest;
    } catch (error) {
        console.error('Lỗi khi gửi email:', error);
        guest.emailStatus = 'Thất bại';
        await invitation.save();
        throw new Error(`Gửi email thất bại. Lỗi từ máy chủ: ${error.response || 'Không xác định'}`);
    }
};
/**
 * [MỚI]
 * Lấy một thiệp mời công khai bằng ID của nó, kèm thông tin khách mời nếu có.
 * @param {string} invitationId - ID của thiệp mời.
 * @param {string} guestId - ID của khách mời (tùy chọn).
 * @returns {Promise<Document|null>} Thiệp mời và thông tin khách mời.
 */
const getPublicInvitationById = async (invitationId, guestId = null) => {
    if (!mongoose.Types.ObjectId.isValid(invitationId)) {
        throw new Error('ID thiệp mời không hợp lệ.');
    }

    const invitation = await Invitation.findById(invitationId).populate('template');

    if (!invitation) {
        return null;
    }

    let guestDetails = null;
    if (guestId && mongoose.Types.ObjectId.isValid(guestId)) {
        const guest = invitation.guests.id(guestId);
        if (guest) {
            guestDetails = guest.toObject(); 
        }
    }
    
    // TRẢ VỀ DỮ LIỆU ĐẦY ĐỦ BAO GỒM CẢ TEMPLATE
    const publicInvitationData = {
        _id: invitation._id,
        slug: invitation.slug,
        settings: invitation.settings,
        content: invitation.content,
        design: invitation.design,
        guestDetails: guestDetails,
        template: invitation.template,
    };

    return publicInvitationData;
};


/**
 * Cập nhật trạng thái tham dự (RSVP) cho một khách mời cụ thể.
 * Hàm này không yêu cầu xác thực người dùng (userId).
 * @param {string} invitationId ID của thiệp mời.
 * @param {string} guestId ID của khách mời.
 * @param {object} rsvpData Dữ liệu phản hồi ({ status, attendingCount }).
 * @returns {Promise<Document|null>}
 */
const updateGuestRsvp = async (invitationId, guestId, rsvpData) => {
    // Tìm thiệp mời chỉ bằng ID, không cần userId
    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
        throw new Error('Không tìm thấy thiệp mời.');
    }

    // Tìm khách mời trong thiệp đó
    const guest = invitation.guests.id(guestId);
    if (!guest) {
        throw new Error('Không tìm thấy thông tin khách mời.');
    }

    // Cập nhật các trường liên quan đến RSVP
    guest.status = rsvpData.status;
    guest.attendingCount = rsvpData.attendingCount;
    
    // Lưu lại sự thay đổi
    await invitation.save();
    return guest;
};


// ==========================================================
// === BẮT ĐẦU: SERVICES MỚI CHO BULK ACTIONS ===
// ==========================================================
/**
 * [MỚI]
 * Xóa hàng loạt khách mời khỏi thiệp.
 * @param {string} invitationId - ID của thiệp.
 * @param {string} userId - ID của chủ thiệp.
 * @param {Array<string>} guestIds - Mảng các ID của khách mời cần xóa.
 * @returns {Promise<{invitation: Document, deletedCount: number}>} Thiệp mời đã được cập nhật và số lượng khách đã xóa.
 */
const bulkDeleteGuestsFromInvitation = async (invitationId, userId, guestIds) => {
    const invitation = await Invitation.findOne({ _id: invitationId, user: userId });
    if (!invitation) {
        throw new Error('Không tìm thấy thiệp hoặc bạn không có quyền.');
    }

    const originalGuestCount = invitation.guests.length;

    // Lọc ra danh sách khách mời mới, loại bỏ những khách có ID trong guestIds
    invitation.guests = invitation.guests.filter(guest => !guestIds.includes(guest._id.toString()));

    const updatedInvitation = await invitation.save();
    const deletedCount = originalGuestCount - updatedInvitation.guests.length;

    return { invitation: updatedInvitation, deletedCount };
};

/**
 * [MỚI]
 * Cập nhật hàng loạt khách mời trong thiệp (ví dụ: đổi nhóm).
 * @param {string} invitationId - ID của thiệp.
 * @param {string} userId - ID của chủ thiệp.
 * @param {Array<string>} guestIds - Mảng các ID của khách mời cần cập nhật.
 * @param {object} updateData - Dữ liệu cần cập nhật (vd: { group: 'newGroupId' }).
 * @returns {Promise<Document>} Thiệp mời đã được cập nhật.
 */
const bulkUpdateGuestsInInvitation = async (invitationId, userId, guestIds, updateData) => {
    const invitation = await Invitation.findOne({ _id: invitationId, user: userId });
    if (!invitation) {
        throw new Error('Không tìm thấy thiệp hoặc bạn không có quyền.');
    }

    // Lặp qua danh sách khách mời và cập nhật những khách có trong guestIds
    invitation.guests.forEach(guest => {
        if (guestIds.includes(guest._id.toString())) {
            // Cập nhật các trường được cung cấp trong updateData
            // Ví dụ: guest.group = updateData.group;
            Object.assign(guest, updateData);
        }
    });

    return await invitation.save();
};

/**
 * [MỚI]
 * Gửi email hàng loạt cho nhiều khách mời.
 * @param {string} invitationId - ID của thiệp.
 * @param {string} userId - ID của chủ thiệp.
 * @param {Array<string>} guestIds - Mảng các ID của khách mời cần gửi email.
 * @returns {Promise<{invitation: Document, successCount: number, failedCount: number}>}
 */

const bulkSendEmailToGuests = async (invitationId, userId, guestIds) => {
    const invitation = await Invitation.findOne({ _id: invitationId, user: userId });
    if (!invitation) {
        throw new Error('Không tìm thấy thiệp hoặc bạn không có quyền.');
    }

    let successCount = 0;
    let failedCount = 0;

    // Lọc ra các khách mời cần gửi email
    const guestsToSend = invitation.guests.filter(guest => guestIds.includes(guest._id.toString()));

    // Dùng Promise.allSettled để gửi song song và không dừng lại khi có lỗi
    const emailPromises = guestsToSend.map(async (guest) => {
        // Tái sử dụng logic từ hàm gửi email đơn lẻ nhưng xử lý lỗi tại đây
        try {
            if (!guest.email) {
                throw new Error('Khách mời không có email.');
            }
            await sendInvitationEmailToGuest(invitationId, guest._id.toString(), userId);
            guest.emailStatus = 'Đã gửi';
            return { status: 'fulfilled' };
        } catch (error) {
            guest.emailStatus = 'Thất bại';
            return { status: 'rejected', reason: error.message };
        }
    });

    const results = await Promise.allSettled(emailPromises);

    results.forEach(result => {
        if (result.status === 'fulfilled') {
            successCount++;
        } else {
            failedCount++;
        }
    });

    // Lưu lại tất cả các thay đổi trạng thái email
    const updatedInvitation = await invitation.save();

    return { invitation: updatedInvitation, successCount, failedCount };
};
module.exports = {
    createInvitationFromTemplate,
    getInvitationBySlug,
    getInvitationsByUserId,
    getInvitationByIdAndUser,
    updateInvitation,
    deleteInvitation,
    addGuestToInvitation,
    addGuestsInBulkToInvitation, // THÊM EXPORT MỚI
    updateGuestInInvitation,
    removeGuestFromInvitation,
    addWishToInvitation,
    updateInvitationSettings, // NEW
    addGuestGroupToInvitation, // NEW
    getGuestGroupsByInvitationId, // NEW
    updateGuestGroupInInvitation, // NEW
    removeGuestGroupFromInvitation, // NEW
    sendInvitationEmailToGuest, // MỚI: Gửi email
    getPublicInvitationById,
    updateGuestRsvp,
    bulkDeleteGuestsFromInvitation,
    bulkUpdateGuestsInInvitation,
    bulkSendEmailToGuests,
};
