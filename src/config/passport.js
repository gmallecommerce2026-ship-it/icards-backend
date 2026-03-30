const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

// Cấu hình Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL + "auth/google/callback",
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Tìm người dùng trong CSDL bằng Google ID
      let user = await User.findOne({ googleId: profile.id });

      if (user) {
        // Nếu người dùng đã tồn tại, trả về người dùng đó
        return done(null, user);
      } else {
        // Kiểm tra xem có người dùng nào đã tồn tại với email này không
        let existingUser = await User.findOne({ email: profile.emails[0].value });
        if (existingUser) {
          // Nếu có, liên kết googleId với tài khoản đó
          existingUser.googleId = profile.id;
          existingUser.avatar = existingUser.avatar || profile.photos[0].value; // Cập nhật avatar nếu chưa có
          await existingUser.save();
          return done(null, existingUser);
        }

        // Nếu chưa có, tạo người dùng mới
        const newUser = new User({
          googleId: profile.id,
          username: profile.displayName.replace(/\s/g, '') + Math.floor(Math.random() * 1000), // Tạo username duy nhất
          email: profile.emails[0].value,
          avatar: profile.photos[0].value,
          // Mật khẩu không cần thiết khi đăng nhập bằng social
        });
        await newUser.save({ validateBeforeSave: false }); // Bỏ qua validation cho password
        return done(null, newUser);
      }
    } catch (err) {
      return done(err, null);
    }
  }
));

// (Tùy chọn) Cấu hình Facebook Strategy (tương tự Google)
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.CALLBACK_URL + `auth/facebook/callback`,
    profileFields: ['id', 'displayName', 'photos', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ facebookId: profile.id });

        if (user) {
            return done(null, user);
        }

        const userEmail = (profile.emails && profile.emails[0] && profile.emails[0].value);
        
        // Nếu có email trả về, kiểm tra xem có tài khoản nào khớp không
        if (userEmail) {
            let existingUserWithEmail = await User.findOne({ email: userEmail });
            if (existingUserWithEmail) {
                // Liên kết tài khoản Facebook vào tài khoản đã có
                existingUserWithEmail.facebookId = profile.id;
                existingUserWithEmail.avatar = existingUserWithEmail.avatar || (profile.photos && profile.photos[0] ? profile.photos[0].value : null);
                await existingUserWithEmail.save();
                return done(null, existingUserWithEmail);
            }
        }

        // Tạo người dùng mới
        const newUser = new User({
            facebookId: profile.id,
            username: profile.displayName.replace(/\s/g, '') + Math.floor(Math.random() * 1000), // Tạo username duy nhất
            email: userEmail || `${profile.id}@facebook-placeholder.com`, // Tạo email giả nếu không có
            avatar: (profile.photos && profile.photos[0]) ? profile.photos[0].value : null,
        });
        
        await newUser.save({ validateBeforeSave: false });
        return done(null, newUser);

    } catch (err) {
        console.error("Lỗi trong Facebook Strategy:", err);
        return done(err, null);
    }
  }
));

// Lưu thông tin user vào session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Lấy thông tin user từ session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});