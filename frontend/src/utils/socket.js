export function getSocketUrl() {
  const api = import.meta.env.VITE_API_URL
  if (api && api.startsWith('http')) {
    return api.replace(/\/api\/?$/, '')
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  let host = window.location.host
  if (!host || host.includes('undefined')) {
    host = 'localhost:5173'
  }

  return `${protocol}//${host}`
}
