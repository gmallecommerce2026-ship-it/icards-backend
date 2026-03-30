const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: {
        type: String,
        required: true,
        enum: ['Phụ kiện trang trí', 'Quà tặng', 'Shop - Service', 'Tổ chức sự kiện']
    },
    images: [{ type: String }], 
    imgSrc: { type: String },
    stock: { type: Number, default: 0 },
}, { timestamps: true });

productSchema.index({ title: 'text', description: 'text' }); // Cho tìm kiếm văn bản
productSchema.index({ category: 1 }); // Cho việc lọc theo danh mục
productSchema.index({ price: 1 }); // Cho việc sắp xếp theo giá

const Product = mongoose.model('Product', productSchema);
module.exports = Product;

// {
//   "title": "Bó Hoa Tulip Trang Trí",
//   "description": "Bó hoa tulip nhân tạo cao cấp, thích hợp để trang trí bàn làm việc, phòng khách hoặc làm quà tặng.",
//   "price": 250000,
//   "category": "Phụ kiện trang trí",
//   "images": [
//     "https://example.com/images/tulip1.jpg",
//     "https://example.com/images/tulip2.jpg"
//   ],
//   "imgSrc": "https://example.com/images/tulip_main.jpg",
//   "stock": 50,
//   "createdAt": "2025-07-02T10:00:00.000Z",
//   "updatedAt": "2025-07-02T10:00:00.000Z"
// }