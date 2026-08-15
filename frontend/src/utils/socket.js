export function getSocketUrl() {
  const api = import.meta.env.VITE_API_URL
  if (api && api.startsWith('http')) {
    return api.replace(/\/api\/?$/, '')
  }
  return import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin
}
