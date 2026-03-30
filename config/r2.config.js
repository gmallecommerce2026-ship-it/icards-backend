// AdminBE/config/r2.config.js

const { S3Client } = require('@aws-sdk/client-s3');
const { NodeHttpHandler } = require('@smithy/node-http-handler');
const dotenv = require('dotenv');

dotenv.config({ override: true });
const accountId = process.env.ACCOUNT_ID;
const accessKeyId = process.env.ACCESS_KEY_ID;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;
const bucketName = process.env.BUCKET_NAME;

// Kiểm tra tường minh (vẫn giữ lại)
if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    console.error('LỖI CẤU HÌNH R2: Một hoặc nhiều biến môi trường (ACCOUNT_ID, ACCESS_KEY_ID, SECRET_ACCESS_KEY, BUCKET_NAME) bị thiếu.');
    console.error(`ACCOUNT_ID: ${!!accountId}, ACCESS_KEY_ID: ${!!accessKeyId}, SECRET_ACCESS_KEY: ${!!secretAccessKey}, BUCKET_NAME: ${!!bucketName}`);
    throw new Error('Cấu hình R2 bị thiếu. Vui lòng kiểm tra tệp .env của bạn và khởi động lại server.');
}
const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
// const endpoint = `https://r2.icards.com.vn`;

const r2 = new S3Client({
  region: 'auto',
  endpoint: endpoint,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
  // =================== START FIX ===================
  /**
   * Thêm dòng này để buộc SDK sử dụng kiểu "path-style"
   * (ví dụ: endpoint.com/bucket-name/file-key)
   * thay vì "virtual-hosted style" (bucket-name.endpoint.com/file-key).
   * Điều này thường khắc phục các sự cố ký tên với các dịch vụ tương thích S3.
   */
  forcePathStyle: true,
  // =================== END FIX ===================

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