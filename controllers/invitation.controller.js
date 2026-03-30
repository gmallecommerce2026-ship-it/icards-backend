// BE/controllers/invitation.controller.js
const invitationService = require('../services/invitation.service');
const mongoose = require('mongoose');
const sharp = require('sharp');
const { uploadFileToR2 } = require('../services/r2.service.js'); 
const _ = require('lodash');

const processInvitationPayload = async (req) => {
    const { slug } = req.body;
    const content = req.body.content ? req.body.content : [];
    const design = req.body.design ? req.body.design : {};
    let settings = req.body.settings ? req.body.settings : {};
    const files = req.files || {};

    const uploadedUrlsByField = {};

    const allFiles = Object.values(files).flat();

    const uploadPromises = allFiles.map(async (file) => {
        const processedBuffer = await sharp(file.buffer)
            .resize({ width: 1920, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 85 })
            .toBuffer();
        const { url } = await uploadFileToR2(processedBuffer, 'image/webp'); 
        
        if (!uploadedUrlsByField[file.fieldname]) {
            uploadedUrlsByField[file.fieldname] = [];
        }
        uploadedUrlsByField[file.fieldname].push(url);
    });

    await Promise.all(uploadPromises);

    const processArrayWithImages = (array, imageFieldName, fileFieldKey) => {
        if (!array || !Array.isArray(array)) return array;
        let urlIndex = 0;
        return array.map(item => {
            if (item && item[imageFieldName] && typeof item[imageFieldName] === 'string' && item[imageFieldName].startsWith('__FILE_PLACEHOLDER_') && uploadedUrlsByField[fileFieldKey]?.[urlIndex]) {
                const newUrl = uploadedUrlsByField[fileFieldKey][urlIndex];
                urlIndex++;
                return { ...item, [imageFieldName]: newUrl };
            }
            return item;
        });
    };

    settings.events = processArrayWithImages(settings.events, 'imageUrl', 'eventImages');
    settings.participants = processArrayWithImages(settings.participants, 'imageUrl', 'participantImages');
    settings.loveStory = processArrayWithImages(settings.loveStory, 'imageUrl', 'loveStoryImages');
    settings.qrCodes = processArrayWithImages(settings.qrCodes, 'url', 'qrCodeImageUrls');

    if (uploadedUrlsByField.galleryImages) {
        settings.galleryImages = [...(settings.galleryImages || []), ...uploadedUrlsByField.galleryImages];
    }
    if (uploadedUrlsByField.bannerImages) {
        const existingUrls = (settings.bannerImages || []).map(img => (typeof img === 'string' ? img : img.url)).filter(Boolean);
        settings.bannerImages = [...existingUrls, ...uploadedUrlsByField.bannerImages];
    }

    const singleImageFields = ['groomImageUrl', 'brideImageUrl', 'heroImages_main', 'heroImages_sub1', 'heroImages_sub2'];
    singleImageFields.forEach(fieldName => {
        if (uploadedUrlsByField[fieldName]?.[0]) {
            const path = fieldName.replace(/_/g, '.');
            _.set(settings, path, uploadedUrlsByField[fieldName][0]);
        }
    });

    return { slug, content, design, settings };
};

const createInvitation = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { templateId } = req.body;
        const { slug, content, design, settings } = await processInvitationPayload(req);

        const newInvitation = await invitationService.createInvitationFromTemplate(
            userId, templateId, slug, content, design, settings
        );
        res.status(201).json({
            status: 'success',
            message: 'Thiệp mời đã được tạo thành công!',
            data: newInvitation
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Slug này đã được sử dụng. Vui lòng chọn một slug khác.' });
        }
        if (error.message.includes('Không tìm thấy mẫu thiệp')) {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};

const updateInvitation = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const invitationId = req.params.id;
        const updateData = await processInvitationPayload(req);

        const updatedInvitation = await invitationService.updateInvitation(invitationId, userId, updateData);
        if (!updatedInvitation) {
            return res.status(404).json({ message: 'Không tìm thấy thiệp hoặc bạn không có quyền.' });
        }
        res.status(200).json({
            status: 'success',
            message: 'Thiệp mời đã được cập nhật thành công!',
            data: updatedInvitation
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Slug này đã được sử dụng.' });
        }
        next(error);
    }
};

// ... Các hàm controller khác không thay đổi ...
const getMyInvitations = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const invitations = await invitationService.getInvitationsByUserId(userId);
        res.status(200).json({
            status: 'success',
            results: invitations.length,
            data: invitations
        });
    } catch (error) {
        next(error);
    }
};

const getInvitation = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const invitationId = req.params.id;
        const invitation = await invitationService.getInvitationByIdAndUser(invitationId, userId);
        if (!invitation) {
            return res.status(404).json({ message: 'Không tìm thấy thiệp hoặc bạn không có quyền.' });
        }
        res.status(200).json({
            status: 'success',
            data: invitation
        });
    } catch (error) {
        next(error);
    }
};

const deleteInvitation = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const invitationId = req.params.id;
        const success = await invitationService.deleteInvitation(invitationId, userId);
        if (!success) {
            return res.status(404).json({ message: 'Không tìm thấy thiệp hoặc bạn không có quyền.' });
        }
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

const addGuest = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const invitationId = req.params.id;
        const guestData = req.body;
        const invitation = await invitationService.getInvitationByIdAndUser(invitationId, userId);
        if (!invitation) {
            return res.status(404).json({ message: 'Không tìm thấy thiệp hoặc bạn không có quyền.' });
        }
        if (guestData.email) {
            const emailExists = invitation.guests.some(
                guest => guest.email && guest.email.toLowerCase() === guestData.email.toLowerCase()
            );
            if (emailExists) {
                return res.status(409).json({ message: 'Email này đã tồn tại trong danh sách khách mời của bạn.' });
            }
        }
        const updatedInvitation = await invitationService.addGuestToInvitation(invitationId, userId, guestData);
        res.status(201).json({
            status: 'success',
            message: 'Khách mời đã được thêm thành công!',
            data: updatedInvitation.guests[updatedInvitation.guests.length - 1]
        });
    } catch (error) {
        next(error);
    }
};

const addGuestsInBulk = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const invitationId = req.params.id;
        const { guests } = req.body;
        if (!Array.isArray(guests) || guests.length === 0) {
            return res.status(400).json({ message: 'Dữ liệu khách mời không hợp lệ hoặc rỗng.' });
        }
        const result = await invitationService.addGuestsInBulkToInvitation(invitationId, userId, guests);
        res.status(201).json({
            status: 'success',
            message: `Đã thêm thành công ${result.addedCount} / ${guests.length} khách mời.`,
            data: result.invitation
        });
    } catch (error) {
        if (error.message.includes('Không tìm thấy thiệp')) {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};

const updateGuest = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { id: invitationId, guestId } = req.params;
        const guestUpdateData = req.body;
        const updatedInvitation = await invitationService.updateGuestInInvitation(invitationId, guestId, userId, guestUpdateData);
        if (!updatedInvitation) {
            return res.status(404).json({ message: 'Không tìm thấy thiệp hoặc khách mời.' });
        }
        res.status(200).json({
            status: 'success',
            message: 'Khách mời đã được cập nhật thành công!',
            data: updatedInvitation.guests.id(guestId)
        });
    } catch (error) {
        next(error);
    }
};

const removeGuest = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { id: invitationId, guestId } = req.params;
        const updatedInvitation = await invitationService.removeGuestFromInvitation(invitationId, guestId, userId);
        if (!updatedInvitation) { 
            return res.status(404).json({ message: 'Không tìm thấy thiệp hoặc khách mời.' });
        }
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

const getPublicInvitationBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const { guestId } = req.query;
        const invitation = await invitationService.getInvitationBySlug(slug, guestId);
        if (!invitation) {
            return res.status(404).json({ message: 'Không tìm thấy thiệp mời.' });
        }
        if (invitation.settings && invitation.settings.password) {
            return res.status(200).json({
                status: 'success',
                message: 'Thiệp mời yêu cầu mật khẩu.',
                data: { requiresPassword: true, _id: invitation._id, slug: invitation.slug, template: invitation.template }
            });
        }
        res.status(200).json({
            status: 'success',
            data: invitation
        });
    } catch (error) {
        next(error);
    }
};

const getPublicInvitationById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { guestId } = req.query;
        const invitation = await invitationService.getPublicInvitationById(id, guestId);
        if (!invitation) {
            return res.status(404).json({ message: 'Không tìm thấy thiệp mời.' });
        }
        if (invitation.settings && invitation.settings.password) {
            return res.status(200).json({
                status: 'success',
                message: 'Thiệp mời yêu cầu mật khẩu.',
                data: { requiresPassword: true, _id: invitation._id, slug: invitation.slug, template: invitation.template }
            });
        }
        res.status(200).json({
            status: 'success',
            data: invitation
        });
    } catch (error) {
        if (error.message.includes('ID thiệp mời không hợp lệ')) {
            return res.status(400).json({ message: error.message });
        }
        next(error);
    }
};

const addWish = async (req, res, next) => {
    try {
        const invitationId = req.params.id;
        const wishData = req.body;
        const invitation = await invitationService.addWishToInvitation(invitationId, wishData);
        res.status(201).json({
            status: 'success',
            message: 'Lời chúc đã được thêm thành công!',
            data: invitation.wishes[invitation.wishes.length - 1]
        });
    } catch (error) {
        if (error.message.includes('Không tìm thấy thiệp') || error.message.includes('Chủ nhân thiệp không cho phép')) {
            return res.status(400).json({ message: error.message });
        }
        next(error);
    }
};

const updateInvitationSettings = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const invitationId = req.params.id;
        
        // SỬA Ở ĐÂY: Gán toàn bộ req.body cho settingsData
        const settingsData = req.body.settingsData;

        // SỬA Ở ĐÂY: Kiểm tra xem req.body có rỗng không
        if (!settingsData || Object.keys(settingsData).length === 0) {
            return res.status(400).json({ message: 'Không tìm thấy dữ liệu cài đặt.' });
        }

        // Dữ liệu 'settingsData' (chính là req.body) được gửi đi
        const updatedInvitation = await invitationService.updateInvitationSettings(
            invitationId, 
            userId, 
            settingsData 
        );

        if (!updatedInvitation) {
            return res.status(404).json({ message: 'Không tìm thấy thiệp hoặc bạn không có quyền.' });
        }

        res.status(200).json({
            status: 'success',
            message: 'Cài đặt thiệp đã được cập nhật thành công!',
            data: updatedInvitation
        });

    } catch (error) {
        next(error);
    }
};

const bulkDeleteGuests = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const invitationId = req.params.id;
        const { guestIds } = req.body;
        if (!Array.isArray(guestIds) || guestIds.length === 0) {
            return res.status(400).json({ message: 'Vui lòng cung cấp danh sách ID khách mời.' });
        }
        const result = await invitationService.bulkDeleteGuestsFromInvitation(invitationId, userId, guestIds);
        res.status(200).json({
            status: 'success',
            message: `Đã xóa thành công ${result.deletedCount} khách mời.`,
            data: result.invitation
        });
    } catch (error) {
        if (error.message.includes('Không tìm thấy thiệp')) {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};

const bulkSendEmail = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const invitationId = req.params.id;
        const { guestIds } = req.body;
        if (!Array.isArray(guestIds) || guestIds.length === 0) {
            return res.status(400).json({ message: 'Vui lòng cung cấp danh sách ID khách mời.' });
        }
        const result = await invitationService.bulkSendEmailToGuests(invitationId, userId, guestIds);
        res.status(200).json({
            status: 'success',
            message: `Đã gửi ${result.successCount} email thành công và ${result.failedCount} email thất bại.`,
            data: result.invitation
        });
    } catch (error) {
        if (error.message.includes('Không tìm thấy thiệp')) {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};

const bulkUpdateGuests = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const invitationId = req.params.id;
        const { guestIds, updateData } = req.body;
        if (!Array.isArray(guestIds) || guestIds.length === 0 || !updateData) {
            return res.status(400).json({ message: 'Dữ liệu không hợp lệ. Vui lòng cung cấp danh sách ID khách mời và dữ liệu cập nhật.' });
        }
        const updatedInvitation = await invitationService.bulkUpdateGuestsInInvitation(invitationId, userId, guestIds, updateData);
        res.status(200).json({
            status: 'success',
            message: 'Cập nhật khách mời hàng loạt thành công.',
            data: updatedInvitation
        });
    } catch (error) {
        if (error.message.includes('Không tìm thấy thiệp')) {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};

const getGuestGroups = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const invitationId = req.params.id;
        const groups = await invitationService.getGuestGroupsByInvitationId(invitationId, userId);
        res.status(200).json({
            status: 'success',
            results: groups.length,
            data: groups,
        });
    } catch (error) {
        if (error.message.includes('Không tìm thấy thiệp')) {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};

const addGuestGroup = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const invitationId = req.params.id;
        const { name, salutation } = req.body;
        const updatedInvitation = await invitationService.addGuestGroupToInvitation(invitationId, userId, { name, salutation });
        res.status(201).json({
            status: 'success',
            message: 'Nhóm khách mời đã được thêm thành công!',
            data: updatedInvitation.guestGroups[updatedInvitation.guestGroups.length - 1],
        });
    } catch (error) {
        if (error.message.includes('Không tìm thấy thiệp')) {
            return res.status(404).json({ message: error.message });
        }
        if (error.message.includes('Tên nhóm đã tồn tại')) {
            return res.status(409).json({ message: error.message });
        }
        next(error);
    }
};

const updateGuestGroup = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const invitationId = req.params.id;
        const groupId = req.params.groupId;
        const { name, salutation } = req.body;
        const updatedInvitation = await invitationService.updateGuestGroupInInvitation(invitationId, groupId, userId, { name, salutation });
        if (!updatedInvitation) {
            return res.status(404).json({ message: 'Không tìm thấy thiệp hoặc nhóm khách mời.' });
        }
        res.status(200).json({
            status: 'success',
            message: 'Nhóm khách mời đã được cập nhật thành công!',
            data: updatedInvitation.guestGroups.id(groupId),
        });
    } catch (error) {
        if (error.message.includes('Không tìm thấy thiệp') || error.message.includes('Không tìm thấy nhóm')) {
            return res.status(404).json({ message: error.message });
        }
        if (error.message.includes('Tên nhóm đã tồn tại')) {
            return res.status(409).json({ message: error.message });
        }
        next(error);
    }
};

const removeGuestGroup = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const invitationId = req.params.id;
        const groupId = req.params.groupId;
        const updatedInvitation = await invitationService.removeGuestGroupFromInvitation(invitationId, groupId, userId);
        if (!updatedInvitation) {
            return res.status(404).json({ message: 'Không tìm thấy thiệp hoặc nhóm khách mời.' });
        }
        res.status(204).send();
    } catch (error) {
        if (error.message.includes('Không tìm thấy thiệp') || error.message.includes('Không tìm thấy nhóm')) {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};

const sendInvitationEmailToGuest = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { id: invitationId, guestId } = req.params;
        const updatedGuest = await invitationService.sendInvitationEmailToGuest(invitationId, guestId, userId);
        res.status(200).json({
            status: 'success',
            message: 'Email đã được gửi thành công.',
            data: updatedGuest,
        });
    } catch (error) {
        if (error.message.includes('Không tìm thấy thiệp') || error.message.includes('Không tìm thấy khách mời')) {
            return res.status(404).json({ message: error.message });
        }
        if (error.message.includes('Khách mời không có địa chỉ email')) {
            return res.status(400).json({ message: error.message });
        }
        // Sửa đổi ở đây: Bắt lỗi gửi email thất bại và trả về status 500
        if (error.message.includes('Gửi email thất bại')) {
            return res.status(500).json({ message: error.message });
        }
        next(error);
    }
};

const submitRsvp = async (req, res, next) => {
    try {
        const { invitationId, guestId } = req.params;
        const { status, attendingCount } = req.body;
        if (!status || !['pending', 'attending', 'declined'].includes(status)) {
            return res.status(400).json({ message: 'Trạng thái RSVP không hợp lệ.' });
        }
        if (status === 'attending' && (typeof attendingCount !== 'number' || attendingCount < 1)) {
            return res.status(400).json({ message: 'Số lượng người tham dự phải là số dương khi trạng thái là "attending".' });
        }
        const updatedGuest = await invitationService.updateGuestRsvp(invitationId, guestId, { status, attendingCount });
        if (!updatedGuest) {
            return res.status(404).json({ message: 'Không tìm thấy thiệp hoặc khách mời.' });
        }
        res.status(200).json({
            success: true,
            message: 'Phản hồi RSVP đã được cập nhật thành công.',
            data: updatedGuest,
        });
    } catch (error) {
        if (error.message.includes('Không tìm thấy thiệp') || error.message.includes('Không tìm thấy thông tin khách mời')) {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};
const getPublicWishes = async (req, res, next) => {
    try {
        const { id } = req.params;
        const invitation = await invitationService.getPublicInvitationById(id);
        if (!invitation) {
            return res.status(404).json({ message: 'Không tìm thấy thiệp mời.' });
        }
        
        let wishes = invitation.wishes || [];
        // Chỉ lấy các lời chúc có trạng thái 'approved' (hoặc chưa có trạng thái)
        wishes = wishes.filter(w => !w.status || w.status === 'approved');
        
        // Sắp xếp lời chúc mới nhất lên đầu
        wishes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.status(200).json({ status: 'success', data: wishes });
    } catch (error) {
        next(error);
    }
};

const getAdminWishes = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const invitationId = req.params.id;
        
        const invitation = await invitationService.getInvitationByIdAndUser(invitationId, userId);
        if (!invitation) {
            return res.status(404).json({ message: 'Không tìm thấy thiệp hoặc bạn không có quyền.' });
        }

        let wishes = invitation.wishes || [];
        wishes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.status(200).json({ status: 'success', data: wishes });
    } catch (error) {
        next(error);
    }
};

const updateWishStatus = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { id: invitationId, wishId } = req.params;
        const { status } = req.body;

        // Import model trực tiếp để dùng hàm .save() của Mongoose
        const Invitation = require('../models/invitation.model');
        
        const invitation = await Invitation.findOne({ _id: invitationId, user: userId });
        if (!invitation) {
            return res.status(404).json({ message: 'Không tìm thấy thiệp hoặc bạn không có quyền.' });
        }

        const wish = invitation.wishes.id(wishId);
        if (!wish) {
            return res.status(404).json({ message: 'Không tìm thấy lời chúc.' });
        }

        wish.status = status;
        await invitation.save();

        res.status(200).json({ 
            status: 'success', 
            message: 'Cập nhật trạng thái thành công', 
            data: wish 
        });
    } catch (error) {
        next(error);
    }
};

const deleteWish = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { id: invitationId, wishId } = req.params;

        const Invitation = require('../models/invitation.model');
        const invitation = await Invitation.findOne({ _id: invitationId, user: userId });
        
        if (!invitation) {
            return res.status(404).json({ message: 'Không tìm thấy thiệp hoặc bạn không có quyền.' });
        }

        // Xóa lời chúc khỏi mảng
        invitation.wishes.pull({ _id: wishId });
        await invitation.save();

        res.status(200).json({ 
            status: 'success', 
            message: 'Đã xóa lời chúc thành công' 
        });
    } catch (error) {
        next(error);
    }
};
const getWishes = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const invitationId = req.params.id;

        const invitation = await invitationService.getInvitationByIdAndUser(invitationId, userId);
        if (!invitation) {
            return res.status(404).json({ message: 'Không tìm thấy thiệp hoặc bạn không có quyền.' });
        }

        res.status(200).json({
            status: 'success',
            data: invitation.wishes || []
        });
    } catch (error) {
        next(error);
    }
};

const removeWish = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { id: invitationId, wishId } = req.params;
        
        const invitation = await invitationService.getInvitationByIdAndUser(invitationId, userId);
        if (!invitation) return res.status(404).json({ message: 'Không tìm thấy thiệp.' });
        
        const wishIndex = invitation.wishes.findIndex(w => w._id.toString() === wishId);
        if (wishIndex === -1) return res.status(404).json({ message: 'Không tìm thấy lời chúc.' });
        
        invitation.wishes.splice(wishIndex, 1);
        await invitation.save();

        res.status(204).send();
    } catch (error) {
        next(error);
    }
};
module.exports = {
    createInvitation,
    getMyInvitations,
    getInvitation,
    updateInvitation,
    deleteInvitation,
    addGuest,
    addGuestsInBulk,
    updateGuest,
    removeGuest,
    getPublicInvitationBySlug,
    addWish,
    updateInvitationSettings,
    getGuestGroups,
    addGuestGroup,
    updateGuestGroup,
    removeGuestGroup,
    sendInvitationEmailToGuest,
    getPublicInvitationById,
    submitRsvp,
    bulkDeleteGuests,
    bulkUpdateGuests,
    bulkSendEmail,
    getPublicWishes,
    getAdminWishes,
    updateWishStatus,
    deleteWish,
    getWishes,
    removeWish,
};