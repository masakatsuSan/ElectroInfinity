// Service worker for ElectroInfinity.
//
// Rules that keep this from causing the "white screen after a deploy" bug:
//   1. Bump CACHE_NAME whenever the caching strategy changes. activate() deletes
//      every other cache, so users can never be served a stale index.html that
//      points at bundles which no longer exist.
//   2. Never cache API responses. They are per-user and time sensitive —
//      serving them from disk after a network failure shows one student
//      another student's notifications, and stale data after logout.
//   3. /assets/* filenames are content-hashed and immutable, so cache-first is
//      both safe and the fastest possible path.
//   4. Navigations are network-first so a new deploy is picked up immediately,
//      with the cached shell as an offline fallback.
const CACHE_NAME = 'electro-infinity-v3'
const SHELL_ASSETS = ['/', '/index.html', '/pic.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // API traffic (same-origin or the cross-origin API host): always the network.
  // Returning without respondWith() means the browser handles it normally, so
  // nothing is stored in Cache Storage and nothing stale can be served.
  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) return

  // Immutable hashed build output: cache first, then network (and cache it).
  if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone()
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
            }
            return response
          })
      )
    )
    return
  }

  // Everything else — navigations, fonts, images: network first so deploys and
  // content updates show up immediately, cache as the offline fallback.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/index.html')))
  )
})
