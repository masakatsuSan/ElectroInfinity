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
const CSRF_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function csrfProtection(req, res, next) {
  if (!CSRF_METHODS.has(req.method)) return next()

  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) return next()

  const cookieToken = req.cookies?.csrf_token
  const headerToken = req.headers['x-csrf-token']

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ success: false, error: 'CSRF token mismatch' })
  }
  next()
}

module.exports = { csrfProtection }
