require('dotenv').config()
const express = require('express')
const http    = require('http')
const cors    = require('cors')
const mongoose = require('mongoose')
const connectDB = require('./src/config/db')
const { initSocket } = require('./src/config/socket')

connectDB()

const app = express()
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'https://electro-infinity.vercel.app',
]
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(null, false)
  },
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Routes ──────────────────────────────────────────────────────
// Phase 1
app.use('/api/auth',       require('./src/routes/auth'))
// Phase 2
app.use('/api/resources',  require('./src/routes/resources'))
app.use('/api/contact',    require('./src/routes/contact'))
// Phase 3
app.use('/api/students',   require('./src/routes/students'))
app.use('/api/deadlines',  require('./src/routes/deadlines'))
app.use('/api/routines',   require('./src/routes/routines'))
app.use('/api/assignments',require('./src/routes/assignments'))
app.use('/api/forum',      require('./src/routes/forum'))
app.use('/api/rooms',      require('./src/routes/rooms'))
// Phase 4 - Community & Academic
app.use('/api/announcements', require('./src/routes/announcements'))
app.use('/api/calendar',      require('./src/routes/calendar'))
app.use('/api/projects',      require('./src/routes/projects'))
// Phase 5 - Admin Stats
app.use('/api/admin',      require('./src/routes/admin'))
// Phase 4 - Dynamic Data
app.use('/api/faculty',    require('./src/routes/faculty'))
app.use('/api/placements', require('./src/routes/placements'))
app.use('/api/labs',       require('./src/routes/labs'))
app.use('/api/achievements',require('./src/routes/achievements'))
app.use('/api/gallery',    require('./src/routes/gallery'))
app.use('/api/yt-lectures',require('./src/routes/yt-lectures'))
app.use('/api/friends', require('./src/routes/friends'))
app.use('/api/profile',   require('./src/routes/profile'))
app.use('/api/network',   require('./src/routes/network'))
app.use('/api/notifications', require('./src/routes/notifications'))
app.use('/api/subjects',   require('./src/routes/subjects'))
app.use('/api/folders',    require('./src/routes/folders'))

app.use('/api/attendance', require('./src/routes/attendance'))
app.get('/api/health', (req, res) =>
  res.json({ success: true, message: 'Electro Infinity API is running ⚡' })
)

app.use((req, res) => res.status(404).json({ success: false, error: 'Not found' }))
app.use((err, req, res, next) => {
  console.error('[ServerError] Request failed')
  res.status(500).json({ success: false, error: 'An internal server error occurred' })
})

const server = http.createServer(app)
const io = initSocket(server)
app.set('io', io)

const PORT = process.env.PORT || 5000

// ── Port conflicts ─────────────────────────────────────────────
// Catch EADDRINUSE instead of crashing with a raw stack trace. The usual
// cause is a leftover server — often from another project or a dev server
// running in a terminal that was closed without stopping it.
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use.`)
    console.error('   Another process (usually a stale dev server) is holding it.')
    console.error('   Run "npm run free-port" to see which one and stop it, then start again.\n')
    process.exit(1)
  }
  console.error('Server error')
  process.exit(1)
})
server.listen(PORT, () => {
  console.log(`🚀 Server at http://localhost:${PORT}`)
  console.log(`📡 Health: http://localhost:${PORT}/api/health`)
})

// ── Graceful shutdown ──────────────────────────────────────────
// Close the socket server, the HTTP server and the DB connection on Ctrl+C /
// nodemon restarts so the port is always released cleanly (a half-closed
// socket is the other common cause of EADDRINUSE).
let shuttingDown = false
function shutdown(signal) {
  if (shuttingDown) return
  shuttingDown = true
  console.log(`\n${signal} received — closing the API...`)
  io.close()
  server.close(() => {
    mongoose.connection.close(false).finally(() => {
      console.log('🔌 Server and MongoDB connection closed')
      process.exit(0)
    })
  })
  // Fallback: never hang forever on lingering keep-alive sockets
  setTimeout(() => process.exit(0), 5000).unref()
}

process.on('SIGINT',  () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
