const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');

function initializeSocket(httpServer) {
  const { Server } = require('socket.io');

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // ── Single auth middleware 
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) return next(new Error('No token'));

      const decoded = verifyAccessToken(token);
      const userId = decoded.id;

      const user = await User.findById(userId);
      if (!user || !user.isActive) {
        return next(new Error('User not found or deactivated'));
      }

      socket.user = user;
      socket.userId = user._id.toString();
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.user.name} (${socket.userId})`);

    // ── Pick ONE room name format and use it everywhere 
    socket.join(`user:${socket.userId}`);

    // ── Chat room events
    socket.on('join_room', async (roomId) => {
      try {
        const room = await ChatRoom.findById(roomId);
        if (!room) return socket.emit('error', { message: 'Room not found' });

        const isParticipant = room.participants.some(
          (p) => p.toString() === socket.userId,
        );
        if (!isParticipant)
          return socket.emit('error', { message: 'Access denied' });

        socket.join(roomId);
        socket.emit('room_joined', { roomId });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      socket.emit('room_left', { roomId });
    });

    socket.on('send_message', async (data) => {
      try {
        const { roomId, content, messageType = 'text', mediaUrl } = data;
        if (!roomId || !content?.trim()) {
          return socket.emit('error', {
            message: 'Room ID and content are required',
          });
        }

        const room = await ChatRoom.findById(roomId);
        if (!room) return socket.emit('error', { message: 'Room not found' });

        const isParticipant = room.participants.some(
          (p) => p.toString() === socket.userId,
        );
        if (!isParticipant)
          return socket.emit('error', { message: 'Access denied' });

        const message = await Message.create({
          chatRoom: roomId,
          sender: socket.userId,
          content: content.trim(),
          messageType,
          mediaUrl,
          readBy: [{ user: socket.userId }],
        });

        room.lastMessage =
          messageType === 'text' ? content.trim() : `[${messageType}]`;
        room.lastMessageAt = new Date();
        await room.save();

        await message.populate('sender', 'name profileImage');
        io.to(roomId).emit('new_message', { message, roomId });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('typing', ({ roomId, isTyping }) => {
      socket.to(roomId).emit('user_typing', {
        userId: socket.userId,
        name: socket.user.name,
        isTyping,
      });
    });

    socket.on('mark_read', async (roomId) => {
      try {
        await Message.updateMany(
          {
            chatRoom: roomId,
            sender: { $ne: socket.userId },
            'readBy.user': { $ne: socket.userId },
          },
          { $push: { readBy: { user: socket.userId, readAt: new Date() } } },
        );
        socket
          .to(roomId)
          .emit('messages_read', { roomId, userId: socket.userId });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.user.name}`);
    });
  });

  return io;
}

module.exports = initializeSocket;
