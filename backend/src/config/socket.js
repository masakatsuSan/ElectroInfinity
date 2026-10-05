const jwt = require('jsonwebtoken')
const User = require('../models/User')
const Channel = require('../models/Channel')
const Message = require('../models/Message')
const { getUnreadCount } = require('../utils/notification')
const { verifyAccessToken } = require('../utils/tokens')
const logger = require('../utils/logger')

// Socket.IO connections are cross-origin in production, so the
// CORS allowlist must be explicit — never a wildcard with
// credentials, and never `true` (allow anything).
function allowedOrigins() {
  const raw = process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || ''
  const origins = raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
  return origins.length ? origins : false
}

function initSocket(server) {
  const { Server } = require('socket.io')
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins(),
      credentials: true,
    },
  })

  io.use(async (socket, next) => {
    try {
      // Accept the access token from handshake auth (existing
      // clients) or the access_token cookie (browser clients).
      const token = socket.handshake.auth?.token
        || socket.handshake.headers?.cookie?.match(/(?:^|;\s*)access_token=([^;]+)/)?.[1]
      if (!token) return next(new Error('Authentication required'))

      // HS256 + explicit issuer, same rules as HTTP routes.
      const decoded = verifyAccessToken(token)
      const user = await User.findById(decoded.id)
      if (!user) return next(new Error('User not found'))
      if (user.isActive === false) return next(new Error('Account deactivated'))
      // Existing documents predate the tokenVersion field
      // and read as undefined — treat that as 0.
      if (decoded.tv !== undefined && (user.tokenVersion || 0) !== decoded.tv) {
        return next(new Error('Token invalidated'))
      }

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

    // Channel rooms are gated: a socket may only join a channel
    // its role is allowed to read.
    async function canAccessChannel(channelId) {
      if (!channelId || !socket.user) return false
      const channel = await Channel.findById(channelId).select('isActive allowedRoles').lean()
      if (!channel || !channel.isActive) return false
      return (channel.allowedRoles || []).includes(socket.user.role)
    }

    socket.on('join_channel', async (channelId, callback) => {
      const allowed = await canAccessChannel(channelId)
      if (!allowed) {
        callback?.({ error: 'Access denied' })
        return
      }
      socket.join(`channel:${channelId}`)
      callback?.({ success: true })
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
        logger.error({ event: 'socket_send_message_failed', err: error?.message })
        callback?.({ error: 'An internal server error occurred' });
      }
    });

    socket.on('mark_typing', async (data) => {
      const { channelId, isTyping } = data;
      // Only members of the channel may broadcast typing events
      // into it.
      if (channelId && isTyping && (await canAccessChannel(channelId))) {
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
