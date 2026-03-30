const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validateUser, validateLogin } = require('../utils/validators');
const { isAuthenticated } = require('../middleware/isAuthenticated');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const handleSocialAuthCallback = (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '1d' }); // Tăng thời gian hết hạn

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // 'None' cho production, 'Lax' cho development
        maxAge: 24 * 60 * 60 * 1000, // 1 ngày
        path: '/'
    });
    // Chuyển hướng về trang chủ của frontend
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
};

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/sign-in', session: false }), handleSocialAuthCallback);

router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/sign-in', session: false }), handleSocialAuthCallback);


// POST /api/auth/register
router.post('/register', validateUser, authController.register);

// POST /api/auth/login
router.post('/login', validateLogin, authController.login);
router.post('/logout', isAuthenticated, authController.logout);
router.post('/forgot-password', authController.forgotPassword);

router.patch('/reset-password/:token', authController.resetPassword);

module.exports = router;