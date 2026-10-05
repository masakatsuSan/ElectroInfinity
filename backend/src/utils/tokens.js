// JWT + refresh-token helpers.
// Access tokens: 15 minutes, HS256 (explicit), issuer-checked, carry the
// user's tokenVersion so a password change invalidates every session.
// Refresh tokens: 48 random bytes, stored SHA-256-hashed, single-use with
// rotation and reuse detection (a reused token revokes its whole family).
const jwt = require('jsonwebtoken')
const crypto = require('crypto')

const ISSUER = 'college-connect'
const ACCESS_TOKEN_TTL = '15m'
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function signAccessToken(userId, tokenVersion) {
  return jwt.sign({ id: userId, tv: tokenVersion }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
    algorithm: 'HS256',
    issuer: ISSUER,
  })
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET, {
    algorithms: ['HS256'],
    issuer: ISSUER,
  })
}

function generateRefreshToken() {
  return crypto.randomBytes(48).toString('hex')
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex')
}

function generateFamilyId() {
  return crypto.randomBytes(16).toString('hex')
}

function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex')
}

module.exports = {
  ISSUER,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL_MS,
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashToken,
  generateFamilyId,
  generateCsrfToken,
}
