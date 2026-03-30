const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('LỖI CẤU HÌNH: Vui lòng khai báo EMAIL_USER và EMAIL_PASS trong tệp .env');
        throw new Error('Cấu hình email bị thiếu.');
    }

    // ==========================================================
    // === ĐẢM BẢO ĐỌC ĐÚNG THUỘC TÍNH "options.to" ===
    // ==========================================================
    if (!options.to) {
        throw new Error('Lỗi logic: Không có người nhận (options.to) nào được định nghĩa trước khi gửi email.');
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_FROM || `"Online Invitation" <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;