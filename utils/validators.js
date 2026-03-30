// TrainData/BE/utils/validators.js

const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const validateUser = [
  body('email')
    .trim() // Loại bỏ khoảng trắng thừa
    .notEmpty().withMessage('Email không được để trống.')
    .isLength({ max: 100 }).withMessage('Email không được vượt quá 100 ký tự.')
    .matches(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    ).withMessage('Vui lòng nhập một địa chỉ email hợp lệ.'),
  body('username')
    .trim().notEmpty().withMessage('Tên người dùng là bắt buộc.'),
  body('password')
    .isLength({ min: 8 }).withMessage('Mật khẩu phải có ít nhất 8 ký tự.')
    .matches(/\d/).withMessage('Mật khẩu phải chứa ít nhất một chữ số.')
    .matches(/[a-z]/).withMessage('Mật khẩu phải chứa ít nhất một chữ cái viết thường.')
    .matches(/[A-Z]/).withMessage('Mật khẩu phải chứa ít nhất một chữ cái viết hoa.')
    .matches(/[^a-zA-Z0-9]/).withMessage('Mật khẩu phải chứa ít nhất một ký tự đặc biệt.'),
  handleValidationErrors
];


const validateLogin = [
    body('login') 
        .trim().notEmpty().withMessage('Email hoặc tên người dùng là bắt buộc.'),
    body('password')
        .notEmpty().withMessage('Mật khẩu là bắt buộc.'),
    handleValidationErrors
];


const validateProduct = [
  body('title')
    .trim().notEmpty().withMessage('Tên sản phẩm là bắt buộc.')
    .isLength({ min: 3 }).withMessage('Tên sản phẩm phải có ít nhất 3 ký tự.'),
  body('description')
    .trim().notEmpty().withMessage('Mô tả sản phẩm là bắt buộc.')
    .isLength({ min: 10 }).withMessage('Mô tả sản phẩm phải có ít nhất 10 ký tự.'),
  body('price')
    .isFloat({ gt: 0 }).withMessage('Giá phải là một số dương.'),
  body('category')
    .isIn(['Phụ kiện trang trí', 'Quà tặng', 'Shop - Service', 'Tổ chức sự kiện'])
    .withMessage('Danh mục sản phẩm không hợp lệ.'),
  body('stock')
    .optional() // Trường này là tùy chọn
    .isInt({ min: 0 }).withMessage('Số lượng tồn kho phải là một số nguyên không âm.'),
  handleValidationErrors
];

const validateProfileUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Tên phải dài từ 2 đến 50 ký tự.'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Họ phải dài từ 2 đến 50 ký tự.'),
  body('phone')
    .optional({ checkFalsy: true }) // Allows empty strings
    .isMobilePhone('vi-VN').withMessage('Số điện thoại không hợp lệ.'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Địa chỉ không được vượt quá 200 ký tự.'),
  handleValidationErrors
];

const validatePasswordChange = [
    body('currentPassword')
        .notEmpty().withMessage('Mật khẩu hiện tại là bắt buộc.'),
    body('newPassword')
        .isLength({ min: 8 }).withMessage('Mật khẩu mới phải có ít nhất 8 ký tự.')
        .matches(/\d/).withMessage('Mật khẩu mới phải chứa ít nhất một chữ số.')
        .matches(/[a-z]/).withMessage('Mật khẩu mới phải chứa ít nhất một chữ cái viết thường.')
        .matches(/[A-Z]/).withMessage('Mật khẩu mới phải chứa ít nhất một chữ cái viết hoa.')
        .matches(/[^a-zA-Z0-9]/).withMessage('Mật khẩu mới phải chứa ít nhất một ký tự đặc biệt.'),
    handleValidationErrors
];


const validateInvitation = [
  body('templateId')
    .isMongoId().withMessage('ID mẫu thiệp không hợp lệ.'),
  body('slug')
    .trim().notEmpty().withMessage('Đường dẫn (slug) là bắt buộc.'),
  // Validate cấu trúc content chi tiết hơn
  body('content')
    .isArray({ min: 1 }).withMessage('Nội dung thiệp phải có ít nhất một trang.'),
  body('content.*.id')
    .notEmpty().withMessage('ID của mỗi trang là bắt buộc.'),
  body('content.*.items').optional().isArray().withMessage('Items trong mỗi trang phải là một mảng.'),
  handleValidationErrors
];

const validateGuest = [
  body('name')
    .trim().notEmpty().withMessage('Tên khách mời là bắt buộc.')
    .isLength({ min: 2, max: 100 }).withMessage('Tên khách mời phải dài từ 2 đến 100 ký tự.'),
  body('email')
    .optional({ checkFalsy: true }) // Vẫn cho phép email trống
    .trim()
    .isLength({ max: 100 }).withMessage('Email khách mời không được vượt quá 100 ký tự.')
    .matches(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    ).withMessage('Email khách mời không hợp lệ.'),
  body('phone')
    .optional({ checkFalsy: true })
    .isMobilePhone('vi-VN').withMessage('Số điện thoại khách mời không hợp lệ.'),
  body('group')
    .optional({ checkFalsy: true }) // Allows empty strings, null, etc.
    .isMongoId().withMessage('ID nhóm khách mời không hợp lệ.'),
  body('salutation')
    .optional({ checkFalsy: true }) // <--- THÊM DÒNG NÀY ĐỂ CHO PHÉP TRƯỜNG NÀY TRỐNG
    .trim().notEmpty().withMessage('Lời xưng hô là bắt buộc.'),
  handleValidationErrors
];

const validateWish = [
  body('author')
    .trim().notEmpty().withMessage('Tên người gửi là bắt buộc.')
    .isLength({ min: 2, max: 50 }).withMessage('Tên người gửi phải dài từ 2 đến 50 ký tự.'),
  body('message')
    .trim().notEmpty().withMessage('Nội dung lời chúc là bắt buộc.')
    .isLength({ min: 5, max: 500 }).withMessage('Nội dung lời chúc phải dài từ 5 đến 500 ký tự.'),
  handleValidationErrors
];

const validateGuestGroup = [
  body('name')
    .trim().notEmpty().withMessage('Tên nhóm là bắt buộc.')
    .isLength({ min: 2, max: 50 }).withMessage('Tên nhóm phải dài từ 2 đến 50 ký tự.'),
  body('salutation')
    .trim().notEmpty().withMessage('Lời xưng hô cho nhóm là bắt buộc.')
    .isLength({ min: 2, max: 50 }).withMessage('Lời xưng hô phải dài từ 2 đến 50 ký tự.'),
  handleValidationErrors
];
const jsonSanitizer = value => {
    try {
        // Nếu value đã là object/array rồi thì thôi
        if (typeof value === 'object' && value !== null) return value;
        // Thử parse, nếu không phải JSON hợp lệ, nó sẽ throw lỗi
        return JSON.parse(value);
    } catch (e) {
        // Trả về giá trị gốc nếu parse lỗi để validator sau bắt
        return value;
    }
};


// THÊM VALIDATOR MỚI
const validateInvitationSettings = [
    body('title').optional().trim().notEmpty().withMessage('Tiêu đề thiệp không được để trống.'),
    body('groomName').optional().trim().notEmpty().withMessage('Tên chú rể không được để trống.'),
    body('brideName').optional().trim().notEmpty().withMessage('Tên cô dâu không được để trống.'),
    body('musicUrl').optional({ checkFalsy: true }).isURL().withMessage('Đường dẫn âm thanh không hợp lệ.'),
    body('videoUrl').optional({ checkFalsy: true }).isURL().withMessage('Đường dẫn video không hợp lệ.'),
    handleValidationErrors
];

const validateInvitationCreation = [
  body('templateId')
    .isMongoId().withMessage('ID mẫu thiệp không hợp lệ.'),
  body('slug')
    .trim().notEmpty().withMessage('Đường dẫn (slug) là bắt buộc.'),
  
  // SỬA Ở ĐÂY: Thêm jsonSanitizer trước khi validate
  body('content')
    .customSanitizer(jsonSanitizer)
    .isArray({ min: 1 }).withMessage('Nội dung thiệp phải có ít nhất một trang.'),
  body('design')
    .optional()
    .customSanitizer(jsonSanitizer)
    .isObject().withMessage('Design phải là một đối tượng.'),
  body('settings')
    .optional()
    .customSanitizer(jsonSanitizer)
    .isObject().withMessage('Settings phải là một đối tượng.'),

  handleValidationErrors
];



const validateInvitationUpdate = [
  body('slug')
    .trim().notEmpty().withMessage('Đường dẫn (slug) là bắt buộc.'),
  
  // SỬA Ở ĐÂY: Thêm jsonSanitizer trước khi validate
  body('content')
    .customSanitizer(jsonSanitizer)
    .isArray({ min: 1 }).withMessage('Nội dung thiệp phải có ít nhất một trang.'),
  body('design')
    .optional()
    .customSanitizer(jsonSanitizer)
    .isObject().withMessage('Design phải là một đối tượng.'),
  body('settings')
    .optional()
    .customSanitizer(jsonSanitizer)
    .isObject().withMessage('Settings phải là một đối tượng.'),

  handleValidationErrors
];



module.exports = { 
  validateUser, 
  validateLogin, 
  validateProduct, 
  validateProfileUpdate, 
  validatePasswordChange, 
  validateInvitation, 
  validateGuest, 
  validateWish, 
  validateGuestGroup, 
  validateInvitationSettings,
  validateInvitationCreation, 
  validateInvitationUpdate, 
};