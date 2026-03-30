// BE/services/cloudflare.service.js
// THAY ĐỔI: Dùng require
const axios = require('axios');
const FormData = require('form-data');

// Các biến này sẽ được nạp từ tệp .env bởi require('dotenv').config() trong file server
const CLOUDFLARE_ACCOUNT_ID = "e7c5347541597ef74ad3c97cad071393";
const CLOUDFLARE_API_TOKEN = "0PYlIHJ22loaR9LRsJQHII8FOs_d6VojDnuEBDIK";
const CLOUDFLARE_ACCOUNT_HASH = "mYCNH6-2h27PJijuhYd-fw";

/**
 * Lấy URL upload một lần từ Cloudflare.
 * Sửa lỗi: Truyền 'null' thay vì '{}' làm body cho request POST.
 */
const getUploadUrl = async () => {
    try {
        // Đảm bảo các biến môi trường đã được nạp
        if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
            throw new Error('Cloudflare Account ID hoặc API Token chưa được cấu hình trong file .env');
        }
        
        const response = await axios.post(
            `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v2/direct_upload`,
            null, // Sửa lỗi quan trọng: không gửi body cho request này
            {
                headers: {
                    'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
                },
            }
        );
        return response.data.result.uploadURL;
    } catch (error) {
        console.error('Lỗi khi lấy URL tải lên của Cloudflare:', error.response?.data);
        throw new Error('Không thể lấy được URL để tải ảnh lên.');
    }
};

const uploadFileToCloudflare = async (fileBuffer) => {
    try {
        const uploadURL = await getUploadUrl();
        
        const form = new FormData();
        form.append('file', fileBuffer, 'image.webp');

        const response = await axios.post(uploadURL, form, {
            headers: {
                ...form.getHeaders(), // Giữ lại để FormData tự xử lý Content-Type
            },
        });

        const result = response.data.result;
        return {
            id: result.id,
            url: `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_HASH}/${result.id}/public`,
        };
    } catch (error) {
        console.error('Lỗi khi tải ảnh lên Cloudflare Images:', error.response?.data);
        throw new Error('Tải file lên Cloudflare Images thất bại.');
    }
};

const deleteFileFromCloudflare = async (imageId) => {
    if (!imageId) return;
    try {
        await axios.delete(
            `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1/${imageId}`,
            {
                headers: {
                    'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
                },
            }
        );
    } catch (error) {
        if (error.response?.status !== 404) {
            console.error(`Lỗi khi xóa ảnh ${imageId} từ Cloudflare:`, error.response?.data);
        }
    }
};

const getImageIdFromUrl = (url) => {
    if (!url || !CLOUDFLARE_ACCOUNT_HASH || !url.includes(CLOUDFLARE_ACCOUNT_HASH)) {
        return null;
    }
    const parts = url.split('/');
    if (parts.length >= 5) {
        return parts[parts.length - 2];
    }
    return null;
};

// THAY ĐỔI: Dùng module.exports
module.exports = {
    getUploadUrl,
    uploadFileToCloudflare,
    deleteFileFromCloudflare,
    getImageIdFromUrl
};