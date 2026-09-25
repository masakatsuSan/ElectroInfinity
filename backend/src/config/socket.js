const jwt = require('jsonwebtoken')
const User = require('../models/User')
const Channel = require('../models/Channel')
const Message = require('../models/Message')
const { getUnreadCount } = require('../utils/notification')

function initSocket(server) {
  const { Server } = require('socket.io')
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || true,
      credentials: true,
    },
  })

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token
      if (!token) return next(new Error('Authentication required'))

      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.id)
      if (!user) return next(new Error('User not found'))

      socket.user = user
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    if (socket.user?._id) {
      socket.join(`user:${socket.user._id}`)
    }

    socket.on('join-notifications', async (userId) => {
      if (userId && String(userId) === String(socket.user?._id)) {
        socket.join(`user:${userId}`)
        const count = await getUnreadCount(userId)
        socket.emit('notification:count', count)
      }
    })

    socket.on('join_channel', (channelId) => {
      socket.join(`channel:${channelId}`)
    })

    socket.on('leave_channel', (channelId) => {
      socket.leave(`channel:${channelId}`)
    })

    socket.on('send_message', async (data, callback) => {
      try {
        const { channelId, text = '', imageUrl = '', replyTo = null } = data;

        const channel = await Channel.findById(channelId);
        if (!channel || !channel.isActive) {
          return callback?.({ error: 'Channel not found' });
        }

        if (!channel.allowedRoles.includes(socket.user.role)) {
          return callback?.({ error: 'Access denied' });
        }

        if (!channel.postRoles.includes(socket.user.role)) {
          return callback?.({ error: 'You cannot post in this channel' });
        }

        if (!text.trim() && !imageUrl) {
          return callback?.({ error: 'Message cannot be empty' });
        }

        if (text.length > 2000) {
          return callback?.({ error: 'Message too long' });
        }

        const mentions = [];
        const mentionResult = require('../utils/mentions').resolveMentions;
        const result = await mentionResult(text, { actorId: socket.user.id });
        mentions.push(...result.mentions);

        const message = await Message.create({
          channelId,
          senderId: socket.user.id,
          text: text.trim(),
          imageUrl: imageUrl || '',
          replyTo: replyTo || null,
          mentions,
        });

        await Channel.findByIdAndUpdate(channelId, {
          $inc: { messageCount: 1 },
          $set: { lastActivity: new Date() },
        });

        const populated = await message.populate('senderId', 'name role photo rollNumber batch semester');
        const messageObj = populated.toObject();
        messageObj.isOwn = messageObj.senderId._id.toString() === socket.user._id.toString();
        messageObj.reactions = (messageObj.reactions || []).map(r => ({
          ...r,
          userReacted: r.userIds.some(id => id.toString() === socket.user._id.toString()),
          count: r.userIds.length,
        }));

        io.to(`channel:${channelId}`).emit('new_message', messageObj);
        callback?.({ success: true, data: messageObj });
      } catch (error) {
        console.error('Socket send_message error:', error?.message);
        callback?.({ error: 'An internal server error occurred' });
      }
    });

    socket.on('mark_typing', (data) => {
      const { channelId, isTyping } = data;
      if (channelId && isTyping) {
        socket.to(`channel:${channelId}`).emit('user_typing', {
          userId: socket.user._id,
          userName: socket.user.name,
        });
      }
    });

    socket.on('disconnect', () => {
      // Socket.io auto-leaves rooms on disconnect
    });
  });

  return io
}

module.exports = { initSocket }
