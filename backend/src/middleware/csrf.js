// Double-submit CSRF protection for cookie-based authentication.
//
// The browser sends the httpOnly access_token cookie automatically, so a
// cross-site request could otherwise ride a logged-in session. Every
// state-changing request must also carry an X-CSRF-Token header matching
// the non-httpOnly csrf_token cookie — a value an attacker's page can
// read only from its own origin (Same-Origin Policy), never from ours.
//
// Requests that authenticate with an Authorization: Bearer header are
// exempt: those are API clients that do not rely on ambient cookies.
//
// Session-establishing endpoints are exempt too: a first-time visitor
// has no csrf_token cookie yet (it is minted at login), so requiring
// the double submit there would make the very first login impossible.
// These endpoints never require an existing session, so the classic
// "ride a logged-in session" CSRF attack does not apply to them.
const CSRF_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

const CSRF_EXEMPT_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/activate',
  '/api/auth/faculty/activate',
  '/api/auth/forgot-password',
  '/api/auth/verify-otp',
  '/api/auth/verify-activation-otp',
  '/api/auth/faculty/verify-otp',
  '/api/auth/reset-password',
])

function csrfProtection(req, res, next) {
  if (!CSRF_METHODS.has(req.method)) return next()

  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) return next()

  if (CSRF_EXEMPT_PATHS.has(req.path)) return next()

  const cookieToken = req.cookies?.csrf_token
  const headerToken = req.headers['x-csrf-token']

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ success: false, error: 'CSRF token mismatch' })
  }
  next()
}

module.exports = { csrfProtection }
