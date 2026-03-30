const mongoose = require('mongoose');

const designAssetSchema = new mongoose.Schema({
    // Phân loại tài nguyên: 'icon', 'component', 'tag' (khung)
    assetType: {
        type: String,
        required: true,
        enum: ['icon', 'component', 'tag'],
        index: true // Đánh index để truy vấn theo loại nhanh hơn
    },
    // Tên tài nguyên (ví dụ: "Icon trái tim", "Khung hoa văn cổ điển")
    name: {
        type: String,
        required: true,
    },
    // URL của hình ảnh
    imgSrc: {
        type: String,
        required: true
    },
    // Có thể thêm category để phân nhóm (ví dụ: 'Tình yêu', 'Thiên nhiên', 'Tết')
    category: {
        type: String,
        default: 'General'
    }
}, { timestamps: true });

const DesignAsset = mongoose.model('DesignAsset', designAssetSchema);

module.exports = DesignAsset;