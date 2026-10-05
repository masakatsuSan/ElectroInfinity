require('dotenv').config()
const express    = require('express')
const http       = require('http')
const cors       = require('cors')
const mongoose   = require('mongoose')
const helmet     = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const hpp        = require('hpp')
const compression = require('compression')
const cookieParser = require('cookie-parser')

const { validateEnv } = require('./src/config/env')
const connectDB = require('./src/config/db')
const { initSocket } = require('./src/config/socket')
const { globalLimiter } = require('./src/middleware/rateLimit')
const { csrfProtection } = require('./src/middleware/csrf')
const logger = require('./src/utils/logger')

// Fail fast on missing/invalid configuration.
validateEnv()

connectDB()

const app = express()

// ── Trust proxy (behind Render/Vercel) ─────────────────
// 1 proxy hop — rate limiters and req.ip then see the real client.
app.set('trust proxy', 1)

// ── Security headers ───────────────────────────────────
// CSP: the SPA is served from the same origin (Vercel) or the dev
// proxy; the API is called cross-origin in production, and Socket.IO
// connects to the API origin. Cloudinary hosts uploaded images and
// receives the admin direct-uploads; Google hosts Drive previews and
// the Maps embed. No inline scripts are needed (Vite bundles them).
const apiOrigin = process.env.API_URL || ''
const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'"], // Tailwind/Vite emit inline <style>
  imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
  connectSrc: ["'self'", 'wss:', 'https:', ...(apiOrigin ? [apiOrigin] : [])],
  fontSrc: ["'self'", 'data:'],
  frameSrc: ["'self'", 'https://drive.google.com', 'https://www.google.com'],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  upgradeInsecureRequests: [],
}

app.use(helmet({
  contentSecurityPolicy: { directives: cspDirectives },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}))

// ── CORS ───────────────────────────────────────────────
// Only the exact frontend origin(s) from env — never a wildcard.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

app.use(cors({
  origin: (origin, cb) => {
    // Same-origin requests (no Origin header, e.g. server-side,
    // curl, or the Vite dev proxy) are allowed.
    if (!origin) return cb(null, true)
    if (allowedOrigins.includes(origin)) return cb(null, true)
    logger.warn({ event: 'cors_rejected', origin })
    cb(null, false)
  },
  credentials: true,
}))

// ── Body parsing ───────────────────────────────────────
// 100kb JSON cap; urlencoded with the simple parser (no qs objects,
// which removes a whole class of NoSQL-injection surfaces).
app.use(express.json({ limit: '100kb' }))
app.use(express.urlencoded({ extended: false, limit: '100kb' }))

// ── Injection defenses ─────────────────────────────────
// Strip MongoDB operators ($gt, $ne, …) from any request data.
app.use(mongoSanitize())
// Block HTTP parameter pollution (?a=1&a=2).
app.use(hpp())

// ── Cookies + compression + rate limiting ──────────────
app.use(cookieParser())
app.use(compression())
app.use(globalLimiter)

// ── CSRF (double-submit cookie) ────────────────────────
// Applied to every state-changing request that authenticates via
// cookie. Bearer-token clients are exempt (see middleware/csrf.js).
app.use(csrfProtection)

// ── Routes ─────────────────────────────────────────────
// Phase 1
app.use('/api/auth',       require('./src/routes/auth'))
// Phase 2
const resourcesRoutes = require('./src/routes/resources')
app.use('/api/resources',  resourcesRoutes)
// Signed direct-upload credentials for the admin panel's Cloudinary direct
// upload — the same protected handler chain as GET /api/resources/upload-signature.
app.get('/api/upload-signature', ...resourcesRoutes.uploadSignature)
app.use('/api/contact',    require('./src/routes/contact'))
// Phase 3
app.use('/api/students',   require('./src/routes/students'))
app.use('/api/deadlines',  require('./src/routes/deadlines'))
app.use('/api/routines',   require('./src/routes/routines'))
app.use('/api/assignments',require('./src/routes/assignments'))
// Phase 4 - Community & Academic
app.use('/api/announcements', require('./src/routes/announcements'))
app.use('/api/calendar',      require('./src/routes/calendar'))
app.use('/api/projects',      require('./src/routes/projects'))
// Phase 5 - Admin Stats
app.use('/api/admin',      require('./src/routes/admin'))
// Phase 4 - Dynamic Data
app.use('/api/faculty',    require('./src/routes/faculty'))
app.use('/api/placements',    require('./src/routes/placements'))
app.use('/api/admin/placements', require('./src/routes/admin-placements'))
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

// Phase 6 — Blog (admin authoring, public reading)
app.use('/api/posts',    require('./src/routes/posts'))
app.use('/api/attendance', require('./src/routes/attendance'))
app.get('/api/health', (req, res) =>
  res.json({ success: true, message: 'College Connect API is running' })
)

app.use((req, res) => res.status(404).json({ success: false, error: 'Not found' }))

// ── Central error handler ──────────────────────────────
// Never leak stack traces, internal paths or DB errors to clients.
// Details are logged server-side only.
app.use((err, req, res, next) => {
  logger.error({
    event: 'unhandled_error',
    method: req.method,
    path: req.path,
    message: err?.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err?.stack,
  })
  const status = err?.status && err.status >= 400 && err.status < 500 ? err.status : 500
  const message = status >= 500
    ? 'An internal server error occurred'
    : (err?.message || 'Request failed')
  res.status(status).json({ success: false, error: message })
})

const server = http.createServer(app)
const io = initSocket(server)
app.set('io', io)

// ── Stale attendance sessions ────────────────────
// A previous process's in-memory session timers died with it,
// leaving sessions "active" forever. Sweep them on boot and
// hourly thereafter.
function runStaleSweep() {
  const { sweepStaleSessions } = require('./src/services/attendanceSession')
  sweepStaleSessions(io).catch((err) =>
    logger.error({ event: 'stale_sweep_failed', message: err?.message })
  )
}
if (mongoose.connection.readyState === 1) {
  runStaleSweep()
} else {
  mongoose.connection.once('connected', runStaleSweep)
}
setInterval(runStaleSweep, 60 * 60 * 1000).unref()

// ── Request timeouts ───────────────────────────────────
// 15s to receive headers, 30s for the whole request.
server.headersTimeout = 15000
server.requestTimeout = 30000
server.keepAliveTimeout = 10000

const PORT = process.env.PORT || 5000

// ── Port conflicts ─────────────────────────────────────
// Catch EADDRINUSE instead of crashing with a raw stack trace. The usual
// cause is a leftover server — often from another project or a dev server
// running in a terminal that was closed without stopping it.
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error({ event: 'port_in_use', port: PORT })
    console.error(`\n❌ Port ${PORT} is already in use.`)
    console.error('   Another process (usually a stale dev server) is holding it.')
    console.error('   Run "npm run free-port" to see which one and stop it, then start again.\n')
    process.exit(1)
  }
  logger.error({ event: 'server_error', message: err?.message })
  process.exit(1)
})
server.listen(PORT, () => {
  logger.info({ event: 'server_started', port: PORT, env: process.env.NODE_ENV || 'development' })
  console.log(`🚀 Server at http://localhost:${PORT}`)
  console.log(`📡 Health: http://localhost:${PORT}/api/health`)
})

// ── Graceful shutdown ──────────────────────────────────
// Close the socket server, the HTTP server and the DB connection on Ctrl+C /
// nodemon restarts so the port is always released cleanly (a half-closed
// socket is the other common cause of EADDRINUSE).
let shuttingDown = false
function shutdown(signal) {
  if (shuttingDown) return
  shuttingDown = true
  logger.info({ event: 'shutdown', signal })
  io.close()
  server.close(() => {
    mongoose.connection.close(false).finally(() => {
      logger.info({ event: 'shutdown_complete' })
      process.exit(0)
    })
  })
  // Fallback: never hang forever on lingering keep-alive sockets
  setTimeout(() => process.exit(0), 5000).unref()
}

process.on('SIGINT',  () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

// ── Crash safety ───────────────────────────────────────
// Log and stay up on unhandled promise rejections; exit on truly
// uncaught exceptions (the process is in an unknown state).
process.on('unhandledRejection', (reason) => {
  logger.error({ event: 'unhandled_rejection', reason: String(reason?.message || reason) })
})
process.on('uncaughtException', (err) => {
  logger.error({ event: 'uncaught_exception', message: err?.message, stack: err?.stack })
  process.exit(1)
})
