// AdminBE/config/r2.config.js

const { S3Client } = require('@aws-sdk/client-s3');
const { NodeHttpHandler } = require('@smithy/node-http-handler');
const dotenv = require('dotenv');

dotenv.config({ override: true });

// 1. THÊM .trim() RẤT QUAN TRỌNG: Xóa khoảng trắng thừa vô tình gõ vào file .env
const accountId = (process.env.ACCOUNT_ID || '').trim();
const accessKeyId = (process.env.ACCESS_KEY_ID || '').trim();
const secretAccessKey = (process.env.SECRET_ACCESS_KEY || '').trim();
const bucketName = (process.env.BUCKET_NAME || '').trim();

if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    console.error('LỖI CẤU HÌNH R2: Thiếu biến môi trường.');
    throw new Error('Cấu hình R2 bị thiếu. Vui lòng kiểm tra tệp .env của bạn và khởi động lại server.');
}

const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

const r2 = new S3Client({
  // Thay đổi 'auto' thành 'us-east-1' để tránh lỗi Signature AWS4
  region: 'us-east-1', 
  endpoint: endpoint,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
  
  forcePathStyle: true,

  // Các fix cho SDK v3 đã có sẵn của bạn
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",

  requestHandler: new NodeHttpHandler({
    requestTimeout: 30000,
    connectionTimeout: 30000,
    socketAcquisitionWarningTimeout: 2000,
    maxSockets: 200
  }),
});

module.exports = {
  r2,
}