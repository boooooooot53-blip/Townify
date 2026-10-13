const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const User = require('../models/User');
const { verifyAccessToken } = require('../utils/jwt');

const authenticateSocket = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return next(new Error('User not found or deactivated'));
    }

    socket.user = user;
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
};

const setupChatHandlers = (io) => {
  // io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.user.name} (${socket.user._id})`);

    socket.join(`user:${socket.user._id}`);

    socket.on('join_room', async (roomId) => {
      try {
        const room = await ChatRoom.findById(roomId);

        if (!room) {
          socket.emit('error', { message: 'Chat room not found' });
          return;
        }

        const isParticipant = room.participants.some(
          (p) => p.toString() === socket.user._id.toString()
        );

        if (!isParticipant) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        socket.join(roomId);
        socket.emit('room_joined', { roomId });
      } catch (error) {
        socket.emit('error', { message: error.message });
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
          socket.emit('error', { message: 'Room ID and content are required' });
          return;
        }

        const room = await ChatRoom.findById(roomId);

        if (!room) {
          socket.emit('error', { message: 'Chat room not found' });
          return;
        }

        const isParticipant = room.participants.some(
          (p) => p.toString() === socket.user._id.toString()
        );

        if (!isParticipant) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        const message = await Message.create({
          chatRoom: roomId,
          sender: socket.user._id,
          content: content.trim(),
          messageType,
          mediaUrl,
          readBy: [{ user: socket.user._id }],
        });

        room.lastMessage = messageType === 'text' ? content.trim() : `[${messageType}]`;
        room.lastMessageAt = new Date();
        await room.save();

        await message.populate('sender', 'name profileImage');

        io.to(roomId).emit('new_message', { message, roomId });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('typing', ({ roomId, isTyping }) => {
      socket.to(roomId).emit('user_typing', {
        userId: socket.user._id,
        name: socket.user.name,
        isTyping,
      });
    });

    socket.on('mark_read', async (roomId) => {
      try {
        await Message.updateMany(
          {
            chatRoom: roomId,
            sender: { $ne: socket.user._id },
            'readBy.user': { $ne: socket.user._id },
          },
          {
            $push: { readBy: { user: socket.user._id, readAt: new Date() } },
          }
        );

        socket.to(roomId).emit('messages_read', {
          roomId,
          userId: socket.user._id,
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.user.name}`);
    });
  });
};

module.exports = { setupChatHandlers, authenticateSocket };
