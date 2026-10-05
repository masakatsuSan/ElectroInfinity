const { verifyAccessToken } = require('../utils/tokens')
const User = require('../models/User')

// ─── token extraction ──────────────────────────────────────────────
// Accepts either an Authorization: Bearer header (API clients, tests)
// or the httpOnly access_token cookie (browser).
function extractToken(req) {
  if (req.headers.authorization?.startsWith('Bearer')) {
    return req.headers.authorization.split(' ')[1]
  }
  return req.cookies?.access_token || null
}

// ─── protect ───────────────────────────────────────────────────────
// Use on any route that requires login.
const protect = async (req, res, next) => {
  const token = extractToken(req)

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required' })
  }

  try {
    // Explicit algorithm + issuer; "none" and other algorithms are rejected.
    const decoded = verifyAccessToken(token)

    const user = await User.findById(decoded.id)

    // Reject unknown users, deactivated accounts, and tokens minted
    // before the last password change (tokenVersion mismatch).
    if (!user || user.isActive === false) {
      return res.status(401).json({ success: false, error: 'Authentication required' })
    }
    if (decoded.tv !== undefined && user.tokenVersion !== decoded.tv) {
      return res.status(401).json({ success: false, error: 'Session expired — please log in again' })
    }

    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Authentication required' })
  }
}

// ─── guard ─────────────────────────────────────────────────────────
// Restrict a route to certain roles. The role always comes from the
// database-loaded user (req.user), never from the client.
const guard = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }
    next()
  }
}

// ─── optionalAuth ──────────────────────────────────────────────────
// Attempts to load the user if a token exists, but doesn't throw.
const optionalAuth = async (req, res, next) => {
  const token = extractToken(req)
  if (token) {
    try {
      const decoded = verifyAccessToken(token)
      const user = await User.findById(decoded.id)
      if (user && user.isActive !== false) {
        req.user = user
      }
    } catch (err) {
      // Ignored for optional auth
    }
  }
  next()
}

module.exports = { protect, guard, optionalAuth, extractToken }
