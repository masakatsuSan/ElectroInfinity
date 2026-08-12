import axios from 'axios'

// Create a custom axios instance so we don't have to
// repeat the base URL and headers in every API call
const api = axios.create({
  baseURL: '/api',   // Vite's proxy will forward /api/* to http://localhost:5000
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

// ─── Response interceptor ──────────────────────────────────────────────────
// If server returns 401 (token expired / invalid), log the user out
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ei_token')
      localStorage.removeItem('ei_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
