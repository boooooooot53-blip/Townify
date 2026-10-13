const express = require('express');

const { authenticate } = require('../middleware/admin');
const { authLimiter } = require('../middleware/rateLimiter');

const {  getUsers,
  approveUser,
  deactivateUser,
  activateUser} = require('../controllers/adminController');

const User = require('../models/User');
const { changePassword } = require('../controllers/authController');

const router = express.Router();

router.get('/users', authenticate, getUsers);
router.post('/users/:id/approve', authenticate, approveUser);
router.post('/users/:id/deactivate', authenticate, deactivateUser);
router.post('/users/:id/activate', authenticate, activateUser);
router.post(
  '/change-password',
  authenticate,
  changePassword,
);






module.exports = router;
