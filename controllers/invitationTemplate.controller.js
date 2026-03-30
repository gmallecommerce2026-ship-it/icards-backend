const mongoose = require('mongoose'); // <--- THÊM DÒNG NÀY
const InvitationTemplate = require('../models/invitationTemplate.model');
const invitationTemplateService = require('../services/invitationTemplate.service');
const APIFeatures = require('../utils/apiFeature');

const ensureImageShape = (node) => {
    if (Array.isArray(node)) {
        return node.map(item => ensureImageShape(item));
    } else if (typeof node === 'object' && node !== null) {
        // LOGIC NHẬN DIỆN IMAGE BLOCK:
        // Bạn cần kiểm tra xem block này có phải là ảnh không.
        // Thông thường sẽ dựa vào type === 'image' hoặc có trường imgSrc/src.
        // Dưới đây là ví dụ kiểm tra phổ biến, bạn có thể điều chỉnh theo cấu trúc JSON thực tế của mình.
        const isImageBlock = node.type === 'image' || (node.style && node.src); 
        
        if (isImageBlock && !node.shape) {
            node.shape = 'square'; // SET MẶC ĐỊNH LÀ SQUARE
        }

        // Tiếp tục đệ quy sâu hơn (nếu block này chứa children)
        Object.keys(node).forEach(key => {
            node[key] = ensureImageShape(node[key]);
        });
    }
    return node;
};

const getInvitationTemplates = async (req, res, next) => {
    try {
        const { search } = req.query;
        let initialQuery = {};

        if (search) {
            initialQuery = {
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { category: { $regex: search, $options: 'i' } },
                    { tags: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const features = new APIFeatures(invitationTemplateService.queryInvitationTemplates(initialQuery), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();

        const templates = await features.query;

        res.status(200).json({
            status: 'success',
            results: templates.length,
            data: templates,
        });

    } catch (error) {
        next(error);
    }
};

const getTemplateFilters = async (req, res, next) => {
    try {
        const filters = await invitationTemplateService.getTemplateFilterData();
        res.status(200).json({
            status: 'success',
            data: filters,
        });
    } catch (error) {
        next(error);
    }
};


const seedTemplates = async (req, res, next) => {
    const allInvitations = [
        { category: 'Thiệp Mời', type: 'invitations', title: 'Thiệp Mời Floral Vintage', imgSrc: 'https://images.unsplash.com/photo-1552881244-a4f6d4a56a42?q=80&w=800' },
        { category: 'Thiệp Chúc Mừng', type: 'greeting-cards', title: 'Thiệp Sinh Nhật Rực Rỡ', imgSrc: 'https://images.unsplash.com/photo-1589418823849-5f11ff4c3b11?q=80&w=800' },
        { category: 'Thiệp Cảm Ơn', type: 'thank-you-cards', title: 'Thiệp Cảm Ơn Tối Giản', imgSrc: 'https://images.unsplash.com/photo-1562963053-4886b6209014?q=80&w=800' },
        { category: 'Thiệp Khác', type: 'other', title: 'Thiệp Tân Gia Hiện Đại', imgSrc: 'https://images.unsplash.com/photo-1600061524354-937b22144d13?q=80&w=800' },
        { category: 'Thiệp Mời', type: 'invitations', title: 'Thiệp Cưới Sang Trọng', imgSrc: 'https://images.unsplash.com/photo-1616139943484-9a3ba2c589b8?q=80&w=800' },
        { category: 'Thiệp Chúc Mừng', type: 'greeting-cards', title: 'Thiệp Chúc Mừng Năm Mới', imgSrc: 'https://images.unsplash.com/photo-1574856342045-1b3d7f694e84?q=80&w=800' },
        { category: 'Thiệp Cảm Ơn', type: 'thank-you-cards', title: 'Thiệp Tri Ân Đối Tác', imgSrc: 'https://images.unsplash.com/photo-1592328228393-201b9a28b14c?q=80&w=800' },
        { category: 'Thiệp Khác', type: 'other', title: 'Thiệp Tốt Nghiệp', imgSrc: 'https://images.unsplash.com/photo-1598024488390-9519b514b8a4?q=80&w=800' },
    ];
    try {
        await InvitationTemplate.deleteMany({});
        await InvitationTemplate.insertMany(allInvitations);
        res.status(200).json({ message: 'Database seeded successfully!' });
    } catch (error) {
        next(error);
    }
};

const getTemplateById = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID mẫu thiệp không hợp lệ.' });
        }
        const template = await invitationTemplateService.getTemplateById(req.params.id);
        if (!template) {
            return res.status(404).json({ message: 'Không tìm thấy mẫu thiệp.' });
        }
        res.status(200).json({ status: 'success', data: template });
    } catch (error) {
        next(error);
    }
};
const createTemplate = async (req, res, next) => {
    try {
        // Parse raw data
        let parsedTemplateData = JSON.parse(req.body.templateData);

        // --- BƯỚC CHUẨN HÓA DỮ LIỆU ---
        // Đảm bảo shape luôn tồn tại trước khi lưu
        parsedTemplateData = ensureImageShape(parsedTemplateData);

        const payload = {
            ...req.body,
            templateData: parsedTemplateData, // Sử dụng data đã được chuẩn hóa
            loveGiftsButton: req.body.loveGiftsButton ? JSON.parse(req.body.loveGiftsButton) : null,
            previewData: req.body.previewData ? JSON.parse(req.body.previewData) : null,
        };
        const newTemplate = await invitationTemplateService.createTemplate(payload, req.files);
        res.status(201).json({ status: 'success', data: newTemplate });
    } catch (error) {
        next(error);
    }
};
const updateTemplate = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID mẫu thiệp không hợp lệ.' });
        }

        if (typeof req.body.templateData !== 'string') {
            throw new Error('templateData phải là một chuỗi JSON.');
        }

        // Parse raw data
        let parsedTemplateData = JSON.parse(req.body.templateData);

        // --- BƯỚC CHUẨN HÓA DỮ LIỆU ---
        // Đảm bảo shape luôn tồn tại trước khi update
        parsedTemplateData = ensureImageShape(parsedTemplateData);

        const updatePayload = {
            ...req.body,
            templateData: parsedTemplateData, // Sử dụng data đã được chuẩn hóa
            loveGiftsButton: req.body.loveGiftsButton ? JSON.parse(req.body.loveGiftsButton) : null,
            previewData: req.body.previewData ? JSON.parse(req.body.previewData) : null,
        };

        const updatedTemplate = await invitationTemplateService.updateTemplateById(
            req.params.id,
            updatePayload,
            req.files
        );

        if (!updatedTemplate) {
            return res.status(404).json({ message: 'Không tìm thấy mẫu thiệp để cập nhật.' });
        }
        res.status(200).json({ status: 'success', data: updatedTemplate });

    } catch (error) {
        console.error("Lỗi trong controller updateTemplate:", error);
        next(error);
    }
};
const fixExistingTemplateShapes = async (req, res, next) => {
    try {
        console.log("Bắt đầu migration shape...");
        const templates = await InvitationTemplate.find({}); // Lấy tất cả template
        let count = 0;

        for (const template of templates) {
            if (template.templateData) {
                // Clone ra object mới để xử lý
                let data = JSON.parse(JSON.stringify(template.templateData));
                
                // Chuẩn hóa
                data = ensureImageShape(data);

                // Gán ngược lại
                template.templateData = data;
                
                // QUAN TRỌNG: Báo cho Mongoose biết trường Mixed đã thay đổi
                template.markModified('templateData');
                
                await template.save();
                count++;
            }
        }

        res.status(200).json({ 
            message: 'Migration hoàn tất!', 
            processed: count 
        });
    } catch (error) {
        console.error("Migration Error:", error);
        next(error);
    }
};
const deleteTemplate = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID mẫu thiệp không hợp lệ.' });
        }
        const template = await invitationTemplateService.deleteTemplateById(req.params.id);
        if (!template) {
            return res.status(404).json({ message: 'Không tìm thấy mẫu thiệp để xóa.' });
        }
        res.status(204).json(); // 204 No Content
    } catch (error) {
        next(error);
    }
};

module.exports = { getInvitationTemplates, getTemplateById, seedTemplates, createTemplate, updateTemplate, deleteTemplate, fixExistingTemplateShapes };