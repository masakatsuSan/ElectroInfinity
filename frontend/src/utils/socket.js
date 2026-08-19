export function getSocketUrl() {
  const api = import.meta.env.VITE_API_URL
  if (api && api.startsWith('http')) {
    return api.replace(/\/api\/?$/, '')
  }
  // Dev: connect to the dev server origin. Vite proxies /socket.io → backend,
  // which keeps phone testing working (the old http://localhost:5000 fallback
  // pointed at the phone's own port).
  if (import.meta.env.DEV) {
    return window.location.origin
  }
  return window.location.origin
}
