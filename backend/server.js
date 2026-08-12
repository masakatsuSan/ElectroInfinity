require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const connectDB = require('./src/config/db')

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

app.get('/api/health', (req, res) =>
  res.json({ success: true, message: 'Electro Infinity API is running ⚡' })
)

app.use((req, res) => res.status(404).json({ success: false, error: 'Route not found' }))
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ success: false, error: 'Something went wrong' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Server at http://localhost:${PORT}`)
  console.log(`📡 Health: http://localhost:${PORT}/api/health`)
})
