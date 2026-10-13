const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth'); 

const {
  getChatRooms,
  getChatRoomById,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  sendHireRequest,
  respondToHireRequest,
  deleteChatRoom,
  startChat,
  deleteMessage
} = require('../controllers/chatController');

// ── Chat rooms
router.get('/rooms', authenticate, getChatRooms);
router.post('/start', authenticate, startChat);
router.get('/rooms/:id', authenticate, getChatRoomById);
router.delete('/rooms/:id', authenticate, deleteChatRoom);

// ── Messages
router.get('/rooms/:id/messages', authenticate, getMessages);
router.post('/rooms/:id/messages', authenticate, sendMessage);
router.delete('/rooms/:roomId/messages/:messageId', authenticate, deleteMessage);
router.patch('/rooms/:id/read', authenticate, markMessagesAsRead);

// ── Hire flow
router.post('/hire-request', authenticate, sendHireRequest);
router.patch(
  '/rooms/:roomId/hire-response',
  authenticate,
  respondToHireRequest,
);

module.exports = router;
