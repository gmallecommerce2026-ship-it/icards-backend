const userService = require('../services/user.service');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

const forgotPassword = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng với email này.' });
        }

        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetURL = `${frontendUrl}/reset-password/${resetToken}`;

        const message = `Bạn nhận được email này vì bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản của bạn.\n\nVui lòng nhấn vào liên kết sau hoặc dán vào trình duyệt để hoàn tất quá trình (liên kết có hiệu lực trong 10 phút):\n\n${resetURL}\n\nNếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.`;

        try {
            // ==========================================================
            // === ĐẢM BẢO GỌI HÀM VỚI ĐÚNG CÁC THAM SỐ ===
            // ==========================================================
            const mailOptions = {
                to: user.email,       // Phải là 'to'
                subject: 'Yêu cầu đặt lại mật khẩu',
                text: message,        // Phải là 'text'
            };
            
            console.log('Đang chuẩn bị gửi email với tùy chọn:', mailOptions); // Dòng debug

            await sendEmail(mailOptions);
            // ==========================================================

            res.status(200).json({
                status: 'success',
                message: 'Link đặt lại mật khẩu đã được gửi đến email!',
            });
        } catch (err) {
            console.error('EMAIL SENDING ERROR:', err);
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });

            return res.status(500).json({ message: 'Gửi email thất bại. Vui lòng thử lại sau.' });
        }
    } catch (error) {
        next(error);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const hashedToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
        }

        user.password = req.body.password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'Mật khẩu đã được đặt lại thành công! Vui lòng đăng nhập.',
        });

    } catch (error) {
        next(error);
    }
};


const register = async (req, res, next) => {
    const { username, email, password } = req.body;

    try {
        const userExists = await User.findOne({ $or: [{ username }, { email }] });
        if (userExists) {
            if (userExists.username === username) {
                return res.status(409).json({ message: 'Tên đăng nhập đã tồn tại.' });
            }
            if (userExists.email === email) {
                return res.status(409).json({ message: 'Email đã được sử dụng.' });
            }
        }

        const user = await User.create({ username, email, password });

        // Không tự động đăng nhập sau khi đăng ký, yêu cầu người dùng đăng nhập lại
        res.status(201).json({
            message: 'Đăng ký thành công! Vui lòng đăng nhập.',
        });

    } catch (error) {
        next(error);
    }
};

const logout = async (req, res, next) => {
  res.clearCookie('token', { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production', 
    sameSite: 'None', // Sửa SameSite thành Lax để tương thích tốt hơn
    path: '/'
  })
  .status(200) 
  .json({ message: 'Đăng xuất thành công' });

};

const login = async (req, res, next) => {
  try {
    const { login, password } = req.body; 

    const user = await userService.findUserByUsernameOrEmail(login);

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' }); // Tăng thời gian hết hạn token

    user.password = undefined;

    res.cookie('token', token, {
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'None', // Sửa SameSite thành Lax
        maxAge: 24 * 60 * 60 * 1000, // 1 ngày
        path: '/'
    })
    .json({
        message: "Đăng nhập thành công!",
        user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar
        }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, forgotPassword, resetPassword };