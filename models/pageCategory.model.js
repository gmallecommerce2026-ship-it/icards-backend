// BE/models/pageCategory.model.js
const mongoose = require('mongoose');

const pageCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên danh mục là bắt buộc.'],
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

pageCategorySchema.pre('save', async function(next) {
    if (!this.slug) {
        this.slug = this.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    }
    if (this.isNew) {
        const highestOrderCategory = await this.constructor.findOne().sort('-order');
        this.order = (highestOrderCategory && typeof highestOrderCategory.order === 'number') ? highestOrderCategory.order + 1 : 1;
    }
    next();
});

const PageCategory = mongoose.model('PageCategory', pageCategorySchema);

module.exports = PageCategory;