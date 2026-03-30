// AdminBE/models/topic.model.js
const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên chủ đề là bắt buộc.'],
        trim: true,
        unique: true,
    },
    slug: {
        type: String,
        required: [true, 'Đường dẫn (slug) là bắt buộc.'],
        unique: true,
        trim: true,
        lowercase: true,
    },
    order: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

topicSchema.pre('save', async function(next) {
    if (this.isModified('name') && !this.slug) {
        this.slug = this.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    }
    if (this.isNew) {
        const highestOrderTopic = await this.constructor.findOne().sort('-order');
        this.order = (highestOrderTopic && typeof highestOrderTopic.order === 'number') ? highestOrderTopic.order + 1 : 1;
    }
    next();
});

const Topic = mongoose.model('Topic', topicSchema);

module.exports = Topic;