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
        default: true 
    },
    loveGiftsButton: {
        type: {
            text: String,
            link: String,
            isEnabled: Boolean
        },
        default: null
    },
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
