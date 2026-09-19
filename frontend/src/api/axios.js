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
})

// ─── Request interceptor ───────────────────────────────────────────────────
// Runs before every request — automatically attaches the JWT token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ei_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── 401 handling ──────────────────────────────────────────────────────────
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

// ─── Response interceptor ──────────────────────────────────────────────────
// If the server returns 401 (token expired / invalid), log the user out.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network-level failures (no response at all) are retried once for GET
    // requests only — reads are safe to repeat, mutations are not.
    const config = error.config
    const isNetworkError = !error.response
    if (isNetworkError && config && config.method === 'get' && !config.__retried) {
      config.__retried = true
      return api.request(config)
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('ei_token')
      localStorage.removeItem('ei_user')
      if (!onAuthPage()) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
