const User = require('../models/user.model');

const getAllUsers = async () => {
  return await User.find().select('-password');
};

const createUser = async (userData) => {

  const user = new User({
    ...userData,
    password: userData.password,
  });

  return await user.save();
};


const getUserById = async (id) => {
  return await User.findById(id).select('-password');
};

const findUserByEmail = async (email) => {
    return await User.findOne({ email }).select('+password');
};

const updateUser = async (userId, updateData) => {
  try {
    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,          // Trả về document mới sau khi cập nhật
      runValidators: true,  // Chạy các quy tắc validate của schema
    }).select('-password'); // Luôn loại bỏ mật khẩu

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    throw error; // Ném lỗi để controller có thể bắt và xử lý
  }
};


const changeUserPassword = async (userId, currentPassword, newPassword) => {
    // Lấy user và cả password hash
    const user = await User.findById(userId).select('+password');
    if (!user) {
        throw new Error('Không tìm thấy người dùng.');
    }

    // Kiểm tra mật khẩu hiện tại
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
        throw new Error('Mật khẩu hiện tại không chính xác.');
    }

    // Hash và cập nhật mật khẩu mới (middleware .pre('save') sẽ tự động hash)
    user.password = newPassword;
    await user.save();
};

const findUserByUsernameOrEmail = async (loginIdentifier) => {
    // Kiểm tra xem chuỗi nhập vào có phải là email không
    const isEmail = loginIdentifier.includes('@');
    
    const query = isEmail ? { email: loginIdentifier } : { username: loginIdentifier };
    
    return await User.findOne(query).select('+password');
};

module.exports = {
  getAllUsers,
  createUser,
  getUserById,
  findUserByEmail,
  updateUser,
  changeUserPassword,
  findUserByUsernameOrEmail
};
