const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');


const isParticipant = (room, userId) =>
  room.participants.some((p) => {
    const id = typeof p === 'object' && p._id ? p._id : p;
    return id.toString() === userId.toString();
  });

// ─────────────────────────────────────────────────────────────────────────────
// Helper — create a notification + emit via socket
// ─────────────────────────────────────────────────────────────────────────────
async function pushNotification(
  io,
  { userId, title, message, type, data = {} },
) {
  const notification = await Notification.create({
    user: userId,
    title,
    message,
    type,
    data,
    isRead: false,
  });
  if (io) {
    io.to(`user_${userId.toString()}`).emit('notification', { notification });
  }
  return notification;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /chat/rooms
// ─────────────────────────────────────────────────────────────────────────────
const getChatRooms = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const filter = { participants: req.user._id, isActive: true };

  const [rooms, total] = await Promise.all([
    ChatRoom.find(filter)
      .populate('participants', 'name profileImage role')
      .populate('serviceRequest', 'title serviceType status')
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10)),
    ChatRoom.countDocuments(filter),
  ]);

  res.json(
    ApiResponse.ok({
      rooms,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    }),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /chat/rooms/:id
// ─────────────────────────────────────────────────────────────────────────────
const getChatRoomById = asyncHandler(async (req, res) => {
  const room = await ChatRoom.findById(req.params.id)
    .populate('participants', 'name profileImage role')
    .populate('serviceRequest', 'title serviceType status')
    .populate('quotation', 'amount status');

  if (!room) throw ApiError.notFound('Chat room not found');
  if (!isParticipant(room, req.user._id))
    throw ApiError.forbidden('Access denied');

  res.json(ApiResponse.ok({ room }));
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /chat/rooms/:id/messages
// ─────────────────────────────────────────────────────────────────────────────
const getMessages = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;

  const room = await ChatRoom.findById(req.params.id);
  if (!room) throw ApiError.notFound('Chat room not found');
  if (!isParticipant(room, req.user._id))
    throw ApiError.forbidden('Access denied');

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const [messages, total] = await Promise.all([
    Message.find({ chatRoom: room._id, isDeleted: false })
      .populate('sender', 'name profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10)),
    Message.countDocuments({ chatRoom: room._id, isDeleted: false }),
  ]);

  res.json(
    ApiResponse.ok({
      messages: messages.reverse(),
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    }),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /chat/rooms/:id/messages
// ─────────────────────────────────────────────────────────────────────────────
const sendMessage = asyncHandler(async (req, res) => {
  const { content, messageType = 'text', mediaUrl } = req.body;

  if (!content || !content.trim())
    throw ApiError.badRequest('Message content is required');

  const room = await ChatRoom.findById(req.params.id);
  if (!room) throw ApiError.notFound('Chat room not found');
  if (!isParticipant(room, req.user._id))
    throw ApiError.forbidden('Access denied');

  if (room.hireStatus !== null) {
    const worker = await User.findOne({
      _id: { $in: room.participants },
      role: 'worker',
    });
    const isWorker =
      worker && worker._id.toString() === req.user._id.toString();

    if (room.hireStatus === 'pending') {
      throw ApiError.forbidden(
        isWorker
          ? 'Please accept or decline the hire request before sending messages.'
          : 'Waiting for the worker to accept your hire request before you can send messages.',
      );
    }

    if (room.hireStatus === 'rejected') {
      throw ApiError.forbidden(
        isWorker
          ? 'This hire request was declined. No further messages can be sent.'
          : 'You cannot send messages here — your hire request was declined.',
      );
    }
  }

  const message = await Message.create({
    chatRoom: room._id,
    sender: req.user._id,
    content: content.trim(),
    messageType,
    mediaUrl,
    readBy: [{ user: req.user._id }],
  });

  room.lastMessage =
    messageType === 'text' ? content.trim() : `[${messageType}]`;
  room.lastMessageAt = new Date();
  await room.save();

  await message.populate('sender', 'name profileImage');

  const io = req.app.get('io');
  if (io) {
    io.to(room._id.toString()).emit('new_message', {
      message,
      roomId: room._id,
    });
  }

  res
    .status(201)
    .json(ApiResponse.created({ message }, 'Message sent successfully'));
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /chat/rooms/:id/read
// ─────────────────────────────────────────────────────────────────────────────
const markMessagesAsRead = asyncHandler(async (req, res) => {
  const room = await ChatRoom.findById(req.params.id);
  if (!room) throw ApiError.notFound('Chat room not found');
  if (!isParticipant(room, req.user._id))
    throw ApiError.forbidden('Access denied');

  await Message.updateMany(
    {
      chatRoom: room._id,
      sender: { $ne: req.user._id },
      'readBy.user': { $ne: req.user._id },
    },
    { $push: { readBy: { user: req.user._id, readAt: new Date() } } },
  );

  res.json(ApiResponse.ok(null, 'Messages marked as read'));
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /chat/rooms/:id
// FIX: Hard-deletes the room and all its messages, notifies the other
// participant via socket + notification, and clears hireStatus so the
// user can send a fresh hire request to the same worker.
// Previously: soft-delete only (isActive=false), no notification, no message
// cleanup, and sendHireRequest still found the old room causing 400 errors.
// ─────────────────────────────────────────────────────────────────────────────
const deleteChatRoom = asyncHandler(async (req, res) => {
  const room = await ChatRoom.findById(req.params.id).populate(
    'participants',
    'name role',
  );
  if (!room) throw ApiError.notFound('Chat room not found');
  if (!isParticipant(room, req.user._id))
    throw ApiError.forbidden('Access denied');

  // Find the other participant to notify them
  const otherParticipant = room.participants.find(
    (p) => p._id.toString() !== req.user._id.toString(),
  );

  const io = req.app.get('io');

  // Notify the other participant via socket so their chat list updates live
  if (io) {
    io.to(`user_${otherParticipant._id.toString()}`).emit('chat_room_deleted', {
      roomId: room._id.toString(),
    });
  }

  // Send a notification to the other participant
  if (otherParticipant) {
    const deletedByName = req.user.name;
    const isUserDeleting = req.user.role === 'resident';

    await pushNotification(io, {
      userId: otherParticipant._id,
      title: 'Chat Deleted',
      message: isUserDeleting
        ? `${deletedByName} has deleted the chat and their hire request.`
        : `${deletedByName} has deleted the chat.`,
      type: 'general',
      data: { roomId: room._id.toString() },
    });
  }

  // Hard-delete all messages in this room
  await Message.deleteMany({ chatRoom: room._id });

  // Hard-delete the room itself so sendHireRequest can create a fresh one
  await ChatRoom.findByIdAndDelete(room._id);

  res.json(ApiResponse.ok(null, 'Chat room and messages deleted'));
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /chat/hire-request
// ─────────────────────────────────────────────────────────────────────────────
const sendHireRequest = asyncHandler(async (req, res) => {
  const { workerId, message } = req.body;

  if (!workerId) throw ApiError.badRequest('workerId is required');
  if (!message || !message.trim())
    throw ApiError.badRequest('Message is required');

  if (req.user._id.toString() === workerId.toString()) {
    throw ApiError.badRequest('You cannot send a hire request to yourself.');
  }

  const worker = await User.findById(workerId);
  if (!worker || worker.role !== 'worker')
    throw ApiError.notFound('Worker not found');

  const userId = req.user._id;

  // FIX: Only block re-hire if an ACTIVE room exists (isActive: true).
  // Previously deleted rooms (now hard-deleted) won't be found here,
  // so users can freely re-hire after deleting a chat.
  let room = await ChatRoom.findOne({
    participants: { $all: [userId, workerId] },
    isActive: true,
    hireStatus: { $in: ['pending', 'accepted'] },
  });

  if (room) {
    if (room.hireStatus === 'pending') {
      throw ApiError.badRequest(
        'You already have a pending hire request with this worker.',
      );
    }
    if (room.hireStatus === 'accepted') {
      throw ApiError.badRequest(
        'You are already hired by this worker. Use the existing chat.',
      );
    }
  }

  // No active room — create a fresh one
  room = await ChatRoom.create({
    participants: [userId, workerId],
    hireStatus: 'pending',
    blockedForUser: false,
    lastMessage: message.trim(),
    lastMessageAt: new Date(),
    isActive: true,
  });

  const msg = await Message.create({
    chatRoom: room._id,
    sender: userId,
    content: message.trim(),
    messageType: 'hire_request',
    readBy: [{ user: userId }],
  });

  await msg.populate('sender', 'name profileImage');

  const io = req.app.get('io');

  await pushNotification(io, {
    userId: workerId,
    title: 'New Hire Request',
    message: `${req.user.name} wants to hire you. Open the chat to accept or decline.`,
    type: 'hire_request',
    data: { chatRoomId: room._id.toString(), userId: userId.toString() },
  });

  if (io) {
    io.to(room._id.toString()).emit('new_message', {
      message: msg,
      roomId: room._id,
    });
    io.to(room._id.toString()).emit('hire_status_changed', {
      roomId: room._id,
      hireStatus: 'pending',
    });
  }

  res
    .status(201)
    .json(ApiResponse.created({ chatRoom: room }, 'Hire request sent'));
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /chat/rooms/:roomId/hire-response
// ─────────────────────────────────────────────────────────────────────────────
const respondToHireRequest = asyncHandler(async (req, res) => {
  const { accept } = req.body;
  if (typeof accept !== 'boolean')
    throw ApiError.badRequest('accept (boolean) is required');

  const room = await ChatRoom.findById(req.params.roomId).populate(
    'participants',
    'name role',
  );
  if (!room) throw ApiError.notFound('Chat room not found');
  if (!isParticipant(room, req.user._id))
    throw ApiError.forbidden('Access denied');

  if (req.user.role !== 'worker') {
    throw ApiError.forbidden('Only the worker can respond to a hire request');
  }

  if (room.hireStatus !== 'pending') {
    throw ApiError.badRequest(
      `This hire request has already been ${room.hireStatus}`,
    );
  }

  const userParticipant = room.participants.find(
    (p) => p._id.toString() !== req.user._id.toString(),
  );

  const newStatus = accept ? 'accepted' : 'rejected';
  const msgType = accept ? 'hire_accepted' : 'hire_rejected';
  const msgContent = accept
    ? `${req.user.name} accepted your hire request! You can now chat freely.`
    : `${req.user.name} declined your hire request.`;

  room.hireStatus = newStatus;
  if (!accept) room.blockedForUser = true;
  room.lastMessage = msgContent;
  room.lastMessageAt = new Date();
  await room.save();

  const systemMsg = await Message.create({
    chatRoom: room._id,
    sender: req.user._id,
    content: msgContent,
    messageType: msgType,
    readBy: [{ user: req.user._id }],
  });

  await systemMsg.populate('sender', 'name profileImage');

  const io = req.app.get('io');

  if (io) {
    io.to(room._id.toString()).emit('new_message', {
      message: systemMsg,
      roomId: room._id,
    });
    io.to(room._id.toString()).emit('hire_status_changed', {
      roomId: room._id,
      hireStatus: newStatus,
    });
  }

  if (userParticipant) {
    await pushNotification(io, {
      userId: userParticipant._id,
      title: accept ? 'Hire Request Accepted!' : 'Hire Request Declined',
      message: accept
        ? `${req.user.name} accepted your hire request. Start chatting!`
        : `${req.user.name} declined your hire request.`,
      type: 'hire_response',
      data: {
        chatRoomId: room._id.toString(),
        workerId: req.user._id.toString(),
        status: newStatus,
      },
    });
  }

  res.json(ApiResponse.ok({ chatRoom: room }, `Hire request ${newStatus}`));
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /chat/start
// Starts a chat directly between the user and a target user, without a formal hire request.
// If an active chat already exists, returns it.
// ─────────────────────────────────────────────────────────────────────────────
const startChat = asyncHandler(async (req, res) => {
  const { targetUserId } = req.body;

  if (!targetUserId) throw ApiError.badRequest('targetUserId is required');

  if (req.user._id.toString() === targetUserId.toString()) {
    throw ApiError.badRequest('You cannot start a chat with yourself.');
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) throw ApiError.notFound('Target user not found');

  const userId = req.user._id;

  // Check if an active chat already exists
  let room = await ChatRoom.findOne({
    participants: { $all: [userId, targetUserId] },
    isActive: true,
  }).populate('participants', 'name role profileImage');

  if (room) {
    return res.json(ApiResponse.ok({ chatRoom: room }, 'Existing chat room found'));
  }

  // Create a new chat room without a formal hire status
  room = await ChatRoom.create({
    participants: [userId, targetUserId],
    hireStatus: null, // Null indicates it's just a regular chat, not a pending hire request
    blockedForUser: false,
    lastMessage: 'Chat started',
    lastMessageAt: new Date(),
    isActive: true,
  });

  room = await room.populate('participants', 'name role profileImage');

  res
    .status(201)
    .json(ApiResponse.created({ chatRoom: room }, 'Chat room created'));
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /chat/rooms/:roomId/messages/:messageId
// Deletes a specific message if the user is the sender.
// ─────────────────────────────────────────────────────────────────────────────
const deleteMessage = asyncHandler(async (req, res) => {
  const { roomId, messageId } = req.params;

  const room = await ChatRoom.findById(roomId).populate('participants');
  if (!room) throw ApiError.notFound('Chat room not found');

  if (!isParticipant(room, req.user._id)) {
    throw ApiError.forbidden('You are not a participant in this chat room');
  }

  const message = await Message.findById(messageId);
  if (!message) throw ApiError.notFound('Message not found');

  if (message.chatRoom.toString() !== roomId.toString()) {
    throw ApiError.badRequest('Message does not belong to this chat room');
  }

  if (message.sender.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You can only delete your own messages');
  }

  message.isDeleted = true;
  message.content = 'This message was deleted';
  message.mediaUrl = null;
  message.messageType = 'text'; // Fallback to text so it renders as a deleted text bubble
  await message.save();

  // If this was the last message, update the room preview
  const latestMessage = await Message.findOne({ chatRoom: roomId }).sort({ createdAt: -1 });
  if (latestMessage && latestMessage._id.toString() === message._id.toString()) {
    room.lastMessage = 'This message was deleted';
    await room.save();
  }

  res.json(ApiResponse.ok({}, 'Message deleted successfully'));
});

module.exports = {
  getChatRooms,
  getChatRoomById,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  sendHireRequest,
  respondToHireRequest,
  deleteChatRoom,
  startChat,
  deleteMessage,
};
