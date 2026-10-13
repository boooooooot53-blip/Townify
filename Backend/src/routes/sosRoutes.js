const express = require('express');
const {
  createSOS,
  getSOSAlerts,
  getSOSById,
  respondToSOS,
  resolveSOS,
  cancelSOS,
} = require('../controllers/sosController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { sosLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  sosLimiter,
  validate({
    emergencyType: {
      required: true,
      enum: ['medical', 'fire', 'crime', 'accident', 'natural_disaster', 'other'],
    },
    location: { required: true },
  }),
  createSOS
);

router.get('/', getSOSAlerts);
router.get('/:id', getSOSById);
router.patch('/:id/respond', respondToSOS);
router.patch('/:id/resolve', resolveSOS);
router.patch('/:id/cancel', cancelSOS);

module.exports = router;
