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

// ─── Response interceptor ──────────────────────────────────────────
// If the server returns 401 (session expired / invalid), log the user out.
api.interceptors.response.use(
  (response) => response,
  (error) => {
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
      // Session is gone server-side — drop the cached user.
      // (The httpOnly cookies are cleared by the server on logout;
      // a stale access cookie simply fails verification here.)
      localStorage.removeItem('ei_user')
      if (!onAuthPage()) {
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
