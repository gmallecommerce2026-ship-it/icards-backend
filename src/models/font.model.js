// TrainData/AdminBE/models/font.model.js
const mongoose = require('mongoose');

const fontSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên font là bắt buộc.'],
        trim: true,
        unique: true
    },
    // URL của file font được lưu trên R2 Storage
    url: {
        type: String,
        required: [true, 'Đường dẫn file font là bắt buộc.']
    },
    // (Tùy chọn) Phân loại font, vd: 'Serif', 'Sans-serif', 'Script'
    category: {
        type: String,
        trim: true,
        default: 'General'
    },
    // (Tùy chọn) Chỉ định font này có sẵn cho người dùng không
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const Font = mongoose.model('Font', fontSchema);

module.exports = Font;