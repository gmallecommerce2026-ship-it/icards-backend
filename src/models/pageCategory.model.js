// AdminBE/models/pageCategory.model.js
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
    parent: {
        type: mongoose.Schema.ObjectId,
        ref: 'PageCategory',
        default: null
    },
    order: { // Thêm trường mới để sắp xếp
        type: Number,
        default: 0
    }
}, { timestamps: true });

pageCategorySchema.pre('save', async function(next) {
    if (!this.slug) {
        this.slug = this.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    }
    // Tự động gán thứ tự cho danh mục mới tạo
    if (this.isNew) {
        const highestOrderCategory = await this.constructor.findOne().sort('-order');
        this.order = (highestOrderCategory && typeof highestOrderCategory.order === 'number') ? highestOrderCategory.order + 1 : 1;
    }
    next();
});

const PageCategory = mongoose.model('PageCategory', pageCategorySchema);

module.exports = PageCategory;