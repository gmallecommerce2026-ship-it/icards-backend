// file: middleware/isAuthenticated.js (TẠO FILE MỚI)

const jwt = require('jsonwebtoken');

const isAuthenticated = (req, res, next) => {
  // Lấy token từ cookie đã được cookieParser xử lý
  const token = req.cookies.token;

  // Nếu không có token, trả về lỗi 401 Unauthorized
  if (!token) {
    return res.status(401).json({ message: 'Access Denied: No token provided.' });
  }

  try {
    // Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Gắn thông tin user vào request để các controller sau có thể sử dụng
    req.user = decoded; 
    next(); // Token hợp lệ, cho phép đi tiếp
  } catch (error) {
    // Nếu token không hợp lệ hoặc hết hạn, trả về lỗi 401
    return res.status(401).json({ message: 'Access Denied: Invalid token.' });
  }
};

module.exports = { isAuthenticated };