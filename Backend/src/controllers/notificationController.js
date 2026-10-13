const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// ─────────────────────────────────────────────────────────────────────────────
// GET /notifications
// ─────────────────────────────────────────────────────────────────────────────

const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, unreadOnly } = req.query;
  const filter = { user: req.user._id };

  if (unreadOnly === 'true') {
    filter.isRead = false;
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const [notifications, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit, 10)),
    Notification.countDocuments(filter),
  ]);

  res.json(
    ApiResponse.ok({
      notifications,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    })
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /notifications/:id/read
// ─────────────────────────────────────────────────────────────────────────────

const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }

  if (notification.user.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Access denied');
  }

  notification.isRead = true;
  await notification.save();

  res.json(ApiResponse.ok({ notification }, 'Notification marked as read'));
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /notifications/read-all
// NEW: marks every unread notification for the logged-in user as read in one
// database call instead of N individual calls from the frontend.
// ─────────────────────────────────────────────────────────────────────────────

const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );

  res.json(ApiResponse.ok(null, 'All notifications marked as read'));
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }

  if (notification.user.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Access denied');
  }

  await notification.deleteOne();
  res.json(ApiResponse.ok(null, 'Notification deleted successfully'));
});

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
};