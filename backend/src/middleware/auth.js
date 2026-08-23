const jwt = require('jsonwebtoken')
const User = require('../models/User')

// ─── protect ───────────────────────────────────────────────────────────────
// Use this on any route that requires login
// e.g. router.get('/profile', protect, getProfile)
const protect = async (req, res, next) => {
  let token

  // Tokens come in the Authorization header as "Bearer <token>"
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Not logged in' })
  }

  try {
    // Decode the token — this also checks if it has expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Attach the full user to req so any route can access req.user
    req.user = await User.findById(decoded.id)

    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User not found' })
    }

    next()
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid token' })
  }
}

// ─── guard ─────────────────────────────────────────────────────────────────
// Use this to restrict a route to certain roles
// e.g. router.post('/announcements', protect, guard('admin','faculty'), createAnnouncement)
const guard = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Only ${roles.join(' or ')} can do this`,
      })
    }
    next()
  }
}

// ─── optionalAuth ────────────────────────────────────────────────────────────
// Attempts to get the user if a token exists, but doesn't throw if not
const optionalAuth = async (req, res, next) => {
  let token
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.user = await User.findById(decoded.id)
    } catch (err) {
      // Ignored for optional auth
    }
  }
  next()
}

module.exports = { protect, guard, optionalAuth }
