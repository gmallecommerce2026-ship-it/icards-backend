// Backend/models/wish.model.js
const mongoose = require('mongoose');

const wishSchema = new mongoose.Schema({
    invitation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invitation',
        required: true
    },
    senderName: {
        type: String,
        required: [true, 'Vui lòng nhập tên người gửi'],
        trim: true
    },
    content: {
        type: String,
        required: [true, 'Vui lòng nhập nội dung lời chúc'],
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'hidden'],
        // Để 'approved' nếu muốn lời chúc hiện lên ngay lập tức sau khi gửi.
        // Để 'pending' nếu muốn admin (chủ thiệp) phải vào duyệt thì mới hiện lên trang khách.
        default: 'approved' 
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Wish', wishSchema);