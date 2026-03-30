const mongoose = require('mongoose');

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, select: false }, // Ẩn password khi query
    role: { type: String, enum: ['user', 'admin', 'designer', 'marketing'], default: 'user' },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    avatar: { type: String, default: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
    googleId: { type: String },
    facebookId: { type: String },
    personalImages: [{
        url: { type: String, required: true },
        cfKey: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now }
    }],
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date }
}, { timestamps: true });

// Hash password trước khi lưu
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Token có hiệu lực trong 10 phút
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; 

    return resetToken; // Trả về token chưa hash để gửi cho user
};

const User = mongoose.model('User', userSchema);
module.exports = User;