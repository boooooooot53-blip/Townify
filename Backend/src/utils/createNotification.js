const Notification = require('../models/Notification');

const createNotification = async ({ userId, title, message, type = 'general', data = null }) => {
  if (!userId) return null;

  return Notification.create({
    user: userId,
    title,
    message,
    type,
    data,
  });
};

const createNotifications = async (items) => {
  if (!items?.length) return [];

  const docs = items
    .filter((item) => item.userId)
    .map((item) => ({
      user: item.userId,
      title: item.title,
      message: item.message,
      type: item.type || 'general',
      data: item.data ?? null,
    }));

  if (!docs.length) return [];

  return Notification.insertMany(docs);
};

module.exports = { createNotification, createNotifications };
