const jwt = require('jsonwebtoken')
const User = require('../models/User')
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
    // Join personal notification room
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

    socket.on('join-session', (sessionId) => {
      if (sessionId) socket.join(`session:${sessionId}`)
    })

    socket.on('leave-session', (sessionId) => {
      if (sessionId) socket.leave(`session:${sessionId}`)
    })

    socket.on('disconnect', () => {
      // Socket.io auto-leaves rooms on disconnect
    })
  })

  return io
}

module.exports = { initSocket }
