// BE/models/masterGuest.model.js
const mongoose = require('mongoose');

const masterGuestSchema = new mongoose.Schema({
    // Liên kết danh bạ này với một người dùng cụ thể
    user: { 
        type: mongoose.Schema.ObjectId, 
        ref: 'User', 
        required: true,
        index: true // Đánh index để tăng tốc độ truy vấn
    },
    name: { 
        type: String, 
        required: [true, 'Tên khách mời là bắt buộc.'],
        trim: true 
    },
    email: { 
        type: String, 
        trim: true,
        lowercase: true
    },
    phone: { 
        type: String,
        trim: true
    },
    // Chúng ta có thể thêm các trường khác sau này như địa chỉ, ghi chú...
}, { 
    timestamps: true 
});

// Đảm bảo mỗi khách mời (với email) là duy nhất cho mỗi người dùng
masterGuestSchema.index({ user: 1, email: 1 }, { unique: true, sparse: true });

const MasterGuest = mongoose.model('MasterGuest', masterGuestSchema);

module.exports = MasterGuest;