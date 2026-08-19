const jwt = require('jsonwebtoken')
const User = require('../models/User')

function initSocket(server) {
  const { Server } = require('socket.io')
  const io = new Server(server, {
    cors: {
      // CLIENT_URL can pin the exact allowed origin (e.g. the deployed site).
      // In development the Vite server proxies /socket.io, and the page origin
      // may be http://localhost:5173, https://localhost:5173 or a phone's
      // https://192.168.x.x:5173 — so without CLIENT_URL we reflect any origin.
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
