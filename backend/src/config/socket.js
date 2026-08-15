const jwt = require('jsonwebtoken')
const User = require('../models/User')

function initSocket(server) {
  const { Server } = require('socket.io')
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
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
    socket.on('join-session', (sessionId) => {
      if (sessionId) socket.join(`session:${sessionId}`)
    })

    socket.on('leave-session', (sessionId) => {
      if (sessionId) socket.leave(`session:${sessionId}`)
    })
  })

  return io
}

module.exports = { initSocket }
