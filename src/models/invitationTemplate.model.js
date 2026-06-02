const mongoose = require('mongoose');

const invitationTemplateSchema = new mongoose.Schema({
    category: { type: String, required: true },
    group: { type: String, required: true },
    type: { type: String, required: true },
    title: { type: String, required: true, unique: true },
    imgSrc: { type: String, required: true },
    slug: { type: String, unique: true },
    description: { type: String, default: '' },
    templateData: { type: mongoose.Schema.Types.Mixed },
    previewDetails: { type: Object, default: null },
    views: { type: Number, default: 0 },
    displayOrder: { 
        type: Number, 
        default: 0 
    },
    isActive: { 
        type: Boolean, 
        default: false 
    },
    loveGiftsButton: {
        type: {
            text: String,
            link: String,
            isEnabled: Boolean
        },
        default: null
    },
    occasionSectionId: {
        type: String,
        default: null, // null nghĩa là thiệp vãng lai, không nằm trong khối đặc biệt nào ngoài trang chủ
        index: true    // Đánh index để tối ưu tốc độ truy vấn tốc độ cao ngoài trang chủ khi hệ thống phình to
    }
});

invitationTemplateSchema.index({ category: 1, group: 1, type: 1 });
// invitationTemplateSchema.index({ title: 1 });

invitationTemplateSchema.pre('save', function(next) {
    if (this.isModified('title')) {
        this.slug = this.title
            .toLowerCase()
            .replace(/ /g, '-')
            .replace(/[^\w-]+/g, '');
    }
    next();
});

const InvitationTemplate = mongoose.model('InvitationTemplate', invitationTemplateSchema);
module.exports = InvitationTemplate;
