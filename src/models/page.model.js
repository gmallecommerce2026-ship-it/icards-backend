// TrainData/AdminBE/models/page.model.js
const mongoose = require('mongoose');

// ++ MỚI: Schema cho các khối nội dung
// const contentBlockSchema = new mongoose.Schema({
//     type: {
//         type: String,
//         required: true,
//         enum: ['text', 'image'],
//     },
//     content: { // Sẽ chứa text hoặc URL ảnh
//         type: String,
//         required: true,
//     },
//     alt: { 
//         type: String 
//     },
//     // Bạn có thể thêm các thuộc tính khác sau này, vd: caption cho ảnh
// }, { _id: true });



const pageSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Tiêu đề trang là bắt buộc.'],
        trim: true,
    },
    slug: {
        type: String,
        required: [true, 'Đường dẫn (slug) là bắt buộc.'],
        unique: true,
        trim: true,
        lowercase: true,
    },
    content: {
        type: String, 
        default: '',
    },
    isBlog: { 
        type: Boolean,
        default: false,
        index: true,
    },
    // --- BẮT ĐẦU: Thêm trường category ---
    category: {
        type: mongoose.Schema.ObjectId,
        ref: 'PageCategory'
    },
    topics: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Topic'
    }],
    relatedTemplate: {
        type: mongoose.Schema.ObjectId,
        ref: 'InvitationTemplate', // Đảm bảo model InvitationTemplate đã tồn tại
        default: null
    },
    // --- KẾT THÚC ---
    seo: {
        metaTitle: { type: String, trim: true },
        metaDescription: { type: String, trim: true },
        keywords: { type: String, trim: true }, // Thêm keywords nếu cần
        canonicalUrl: { type: String, trim: true } // Thêm canonical cho SEO nâng cao
    },
    isPublished: {
        type: Boolean,
        default: false,
        index: true,
    },
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    thumbnail: { 
        type: String,
        trim: true,
        default: '' // Hoặc link ảnh default nếu muốn
    },
}, { timestamps: true });

// Tự động tạo slug từ title nếu slug không được cung cấp
pageSchema.pre('save', function(next) {
    if (!this.slug) {
        this.slug = this.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    }
    next();
});

const Page = mongoose.model('Page', pageSchema);

module.exports = Page;