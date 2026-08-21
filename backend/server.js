require('dotenv').config()
const express = require('express')
const http    = require('http')
const cors    = require('cors')
const connectDB = require('./src/config/db')
const { initSocket } = require('./src/config/socket')

connectDB()

const app = express()
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Routes ──────────────────────────────────────────────────────
// Phase 1
app.use('/api/auth',       require('./src/routes/auth'))
app.use('/api/notices',    require('./src/routes/notices'))
// Phase 2
app.use('/api/resources',  require('./src/routes/resources'))
app.use('/api/events',     require('./src/routes/events'))
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
// Attendance & Subjects
app.use('/api/attendance', require('./src/routes/attendance'))
app.use('/api/subjects',   require('./src/routes/subjects'))

app.get('/api/health', (req, res) =>
  res.json({ success: true, message: 'Electro Infinity API is running ⚡' })
)

app.use((req, res) => res.status(404).json({ success: false, error: 'Route not found' }))
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ success: false, error: err.message || 'Something went wrong' })
})

const server = http.createServer(app)
const io = initSocket(server)
app.set('io', io)

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`🚀 Server at http://localhost:${PORT}`)
  console.log(`📡 Health: http://localhost:${PORT}/api/health`)
})
