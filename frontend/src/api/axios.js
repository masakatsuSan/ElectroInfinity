import axios from 'axios'

// Create a custom axios instance so we don't have to
// repeat the base URL and headers in every API call
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',   // Vite's proxy will forward /api/* to http://localhost:5000
  // Without a timeout a request can hang for minutes (the browser default is
  // "no timeout"), which shows up to the user as a page that loads forever.
  // 30s is long enough to survive a cold start on the API host (measured at
  // ~23s) while still failing instead of hanging forever.
  timeout: 30000,
  // Sessions live in httpOnly cookies (access_token / refresh_token),
  // so every request must be allowed to carry them — including
  // cross-origin calls in production (Vercel -> Render).
  withCredentials: true,
})

// ─── CSRF token helper ─────────────────────────────────────────────
// The server sets a readable `csrf_token` cookie and requires the
// same value in the X-CSRF-Token header on every mutating request
// (double-submit cookie pattern). Bearer-token clients are exempt
// server-side, but the browser always uses cookies.
function getCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/+^])/g, '\\$1') + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

// ─── Request interceptor ───────────────────────────────────────────
// Runs before every request — attaches the CSRF header on
// mutating methods. The access token itself rides in the
// httpOnly cookie; it is never touched from JS.
api.interceptors.request.use((config) => {
  if (['post', 'put', 'patch', 'delete'].includes((config.method || 'get').toLowerCase())) {
    const csrf = getCookie('csrf_token')
    if (csrf) {
      config.headers['X-CSRF-Token'] = csrf
    }
  }
  // Prevent axios from sending default Content-Type: application/json with FormData.
  // Without this, the browser can't set multipart/form-data with the boundary.
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

// ─── 401 handling ──────────────────────────────────────────────────
// Pages where a 401 is an expected, user-visible outcome (wrong password, bad
// OTP, expired reset link). Reloading them would throw away the message the
// user is reading, and can turn into a redirect loop.
const AUTH_PATHS = [
  '/login',
  '/admin/login',
  '/faculty/login',
  '/activate',
  '/faculty/activate',
  '/forgot-password',
]

const onAuthPage = () => {
  const path = window.location.pathname
  return AUTH_PATHS.some((p) => path === p || path.startsWith(`${p}/`))
}

// ─── Was anyone actually signed in? ──────────────────────────────────
// A 401 only means "your session died" if there was a session to lose.
// AuthProvider probes GET /auth/me on every cold start and that call is
// behind `protect`, so it 401s for every logged-out visitor. Treating that as
// an expired session hard-redirected guests off the landing page to /login.
// The cached user is the only client-side evidence of a prior session, so read
// it *before* the cache is cleared below.
function hadSession() {
  try {
    return !!localStorage.getItem('ei_user')
  } catch {
    return false
  }
}

// `config.url` is relative to baseURL ('/auth/me', not '/api/auth/me').
const pathOf = (url) => String(url || '').split('?')[0]
const isSessionProbe = (url) => pathOf(url) === '/auth/me'

// ─── Silent session refresh ────────────────────────────────────────
// The access token lives 15 minutes in an httpOnly cookie; the refresh
// token (7 days, also httpOnly) mints a new one. On a 401 we refresh
// once and retry the original request, so users stay logged in for
// days instead of being bounced every 15 minutes. A shared promise
// deduplicates concurrent 401s into a single refresh round-trip.
let refreshInFlight = null

function refreshSession() {
  if (!refreshInFlight) {
    refreshInFlight = api
      .post('/auth/refresh')
      .then((res) => res.data)
      .catch(() => null)
      .finally(() => {
        refreshInFlight = null
      })
  }
  return refreshInFlight
}

// ─── Response interceptor ──────────────────────────────────────────
// If the server returns 401 (session expired / invalid), refresh the
// session once and retry; if the refresh also fails, log the user out.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Network-level failures (no response at all) are retried once for GET
    // requests only — reads are safe to repeat, mutations are not.
    // Excluded: the OTP "check" endpoints are GETs that actually send mail and
    // mint a fresh code. Retrying one on a network blip replaced the code the
    // user had already received, so a correct OTP was rejected as wrong.
    const config = error.config
    const isNetworkError = !error.response
    const MUTATING_GETS = ['/auth/check-roll/', '/auth/check-faculty/']
    const url = config?.url || ''
    const isOtpSend = MUTATING_GETS.some((p) => url.includes(p))
    if (isNetworkError && config && config.method === 'get' && !config.__retried && !isOtpSend) {
      config.__retried = true
      return api.request(config)
    }

    if (error.response?.status === 401) {
      const signedIn = hadSession()
      // Never refresh the refresh endpoint itself, and never retry
      // a request that was already retried once. The session probe is skipped
      // only for a guest: a signed-in user with an expired access token still
      // needs the refresh round-trip, or they would be logged out every 15
      // minutes when the access cookie expires.
      const isRefreshCall = url.includes('/auth/refresh')
      if (!isRefreshCall && !config.__retried && (signedIn || !isSessionProbe(url))) {
        config.__retried = true
        const refreshed = await refreshSession()
        if (refreshed) {
          // New cookies are set — replay the original request.
          return api.request(config)
        }
      }

      // Session is gone server-side — drop the cached user.
      // (The httpOnly cookies are cleared by the server on logout;
      // a stale access cookie simply fails verification here.)
      localStorage.removeItem('ei_user')
      // Only bounce the user if there was a session to lose. A 401 to the boot
      // probe is the answer "you are signed out", not a failure, so it must not
      // redirect — that is what locked logged-out visitors out of public pages.
      if (signedIn && !isSessionProbe(url) && !onAuthPage()) {
        // replace(), not href: a replacing navigation does not add a history
        // entry, so pressing Back can never re-enter a page that will 401 again
        // and bounce forward once more.
        window.location.replace('/login')
      }
    }
    return Promise.reject(error)
  }
)

export default api
