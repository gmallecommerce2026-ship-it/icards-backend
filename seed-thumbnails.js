// seed-thumbnails.js

// 1. Load biến môi trường (để lấy MONGO_URI)
require('dotenv').config(); 

const mongoose = require('mongoose');
const path = require('path');

// 2. Import Model Page
// Lưu ý: Đường dẫn này phải đúng với cấu trúc thư mục của bạn
const Page = require('./Backend/models/page.model'); 

// --- CẤU HÌNH ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/your_database_name'; // Thay thế nếu không dùng .env
const DEFAULT_THUMBNAIL = 'https://placehold.co/800x500/png?text=G-Mall+Default'; // Ảnh mặc định nếu bài viết không có ảnh nào
const FORCE_UPDATE = false; // Đặt true nếu muốn TẠO LẠI thumbnail cho TẤT CẢ bài viết (kể cả bài đã có)

// --- HÀM TRÍCH XUẤT ẢNH ---
const extractImageFromContent = (content) => {
    if (!content) return null;

    // Trường hợp 1: Content là Array (Block Editor)
    if (Array.isArray(content)) {
        const imageBlock = content.find(block => block.type === 'image' && block.content && !block.content.startsWith('data:'));
        return imageBlock ? imageBlock.content : null;
    }

    // Trường hợp 2: Content là String (HTML Editor cũ)
    if (typeof content === 'string') {
        // Regex tìm src của thẻ img đầu tiên
        const match = content.match(/<img[^>]+src="([^">]+)"/);
        if (match && match[1] && !match[1].startsWith('data:')) {
            return match[1];
        }
    }

    return null;
};

// --- MAIN FUNCTION ---
const seedThumbnails = async () => {
    try {
        console.log('🔌 Đang kết nối tới MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Kết nối thành công!');

        console.log('🔍 Đang quét toàn bộ Pages...');
        const pages = await Page.find({});
        console.log(`📊 Tìm thấy ${pages.length} trang/bài viết.`);

        let updatedCount = 0;
        let skippedCount = 0;

        for (const page of pages) {
            // Logic: Chỉ update nếu chưa có thumbnail HOẶC chế độ FORCE_UPDATE = true
            if (!page.thumbnail || FORCE_UPDATE) {
                
                const foundImage = extractImageFromContent(page.content);
                const finalThumbnail = foundImage || DEFAULT_THUMBNAIL;

                // Cập nhật
                page.thumbnail = finalThumbnail;
                
                // Nếu chưa có summary, tự động lấy 150 ký tự đầu tiên làm summary luôn (Tiện thể làm sạch data)
                if (!page.summary) {
                    const plainText = Array.isArray(page.content) 
                        ? page.content.filter(b => b.type === 'text').map(b => b.content).join(' ')
                        : page.content.replace(/<[^>]*>?/gm, ''); // Strip HTML tags
                    
                    page.summary = plainText.substring(0, 150).trim() + (plainText.length > 150 ? '...' : '');
                }

                await page.save();
                process.stdout.write(`\r✅ Đã cập nhật: ${page.title} -> [${foundImage ? 'Found Img' : 'Default'}]`);
                updatedCount++;
            } else {
                skippedCount++;
            }
        }

        console.log('\n\n-------------------------------------------');
        console.log(`🎉 HOÀN TẤT ĐỒNG BỘ DỮ LIỆU!`);
        console.log(`✏️  Đã cập nhật: ${updatedCount} trang.`);
        console.log(`⏭️  Đã bỏ qua (đã có thumbnail): ${skippedCount} trang.`);
        console.log('-------------------------------------------');

    } catch (error) {
        console.error('❌ Lỗi xảy ra:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Đã ngắt kết nối Database.');
        process.exit();
    }
};

seedThumbnails();
