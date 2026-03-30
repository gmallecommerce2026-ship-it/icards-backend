// BE/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const protect = async (req, res, next) => {
  let token;
  console.log("👉 ĐÃ VÀO MIDDLEWARE PROTECT");
  // 1. Đọc token từ httpOnly cookie
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  
  // 2. Nếu không có token trong cookie, trả về lỗi
  if (!token) {
    return res.status(401).json({ success: false, message: 'Phiên đăng nhập hết hạn' });
  }

  try {
    // 3. Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Lấy thông tin user từ DB
    // === SỬA DÒNG NÀY ===
    req.user = await User.findById(decoded.id).select('-password'); 
    // ====================
    
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Không tìm thây người dùng' });
    }

    next(); // Cho phép đi tiếp đến controller
  } catch (error) {
    // Bắt lỗi nếu token không hợp lệ hoặc hết hạn
    return res.status(401).json({ success: false, message: 'Phiên đăng nhập hết hạn' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    // req.user được gán từ middleware `protect`
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Người dùng vai trò '${req.user.role}' chưa được phép truy cập tài nguyên này.`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };