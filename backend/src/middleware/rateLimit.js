const rateLimit = require('express-rate-limit')
const slowDown = require('express-slow-down')

// ── Global ─────────────────────────────────────────────────────────
// Broad safety net: 300 requests/minute per IP.
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again shortly.' },
})

// ── Auth endpoints ─────────────────────────────────────────────────
// login / register / forgot-password: 10 per 15 minutes per IP, with
// an exponential delay after the 3rd request (cheap brute-force brake).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many attempts. Please try again in 15 minutes.' },
})

const authSlowDown = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 3,
  delayMs: (used) => used * 500, // 0.5s, 1s, 1.5s, …
})

// ── OTP endpoints ──────────────────────────────────────────────────
// OTP send/verify: 5 per minute per IP. OTPs are 6 digits with a
// 5-attempt lockout server-side; this caps the sending rate too.
const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many OTP attempts. Please try again in a minute.' },
})

// ── Authenticated writes ───────────────────────────────────────────
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again shortly.' },
  skip: (req) => !req.user,
})

// ── Uploads ────────────────────────────────────────────────────────
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many uploads, please try again shortly.' },
})

// ── Attendance scan ────────────────────────────────────────────────
// Per-IP brake on the scan endpoint (per-user duplicate prevention
// happens in the handler via the unique attendance record).
const scanLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many scan attempts. Please try again shortly.' },
})

// ── Public forms (contact) ─────────────────────────────────────────
// The contact form triggers a paid email send — keep it tight.
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many messages. Please try again later.' },
})

// ── Download counters ──────────────────────────────────────────────
const downloadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again shortly.' },
})

module.exports = {
  globalLimiter,
  authLimiter,
  authSlowDown,
  otpLimiter,
  writeLimiter,
  uploadLimiter,
  scanLimiter,
  contactLimiter,
  downloadLimiter,
}
