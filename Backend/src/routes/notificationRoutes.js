const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead, 
  deleteNotification,
} = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth'); 

// ── Notification routes 
router.get('/', authenticate, getNotifications);

router.put('/read-all', authenticate, markAllNotificationsRead);
router.put('/:id/read', authenticate, markNotificationRead);
router.delete('/:id', authenticate, deleteNotification);

module.exports = router;
