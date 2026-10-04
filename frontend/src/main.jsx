import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { LayoutProvider } from './context/LayoutContext'
import ErrorBoundary from './components/ErrorBoundary'
import FatalError from './components/FatalError'
import App from './App'
import './index.css'

// ─── Recovery from a failed code-split chunk ───────────────────────────────
// After a deploy, a tab that is still open may ask for a chunk whose hashed
// filename no longer exists. Vite raises `vite:preloadError`; we used to reload
// once so the user picks up the new index.html. That turned out to break SPA
// navigation: the event was firing on every lazy-route load and forcing a full
// page reload on every page change.
//
// The error boundary in App.jsx already catches lazy-load failures per-route,
// and the service worker does network-first on navigations so a new deploy is
// picked up without help from this listener. Removing the listener entirely
// avoids the reload-on-every-navigation bug while keeping chunk-load errors
// debuggable via the ErrorBoundary + global-error listeners below.

// ─── Reload debugging (historical) ──────────────────────────────────────────
// A prior attempt monkeypatched window.location.reload/assign/replace to trace
// their callers. That throws `TypeError: Cannot assign to read only property
// 'reload' of object '[object Location]'` on every load (those slots are
// non-writable on the Location instance), which crashed main.jsx before React
// could mount — blank screen, user reloads, repeat. The reload entry points are
// now known: axios 401 → location.replace('/login') (guarded by token check
// in Login.jsx + AUTH_PATHS guard in axios.js) and the FatalError reload button.
// To trace future reloads, instrument `Location.prototype` instead of the
// instance, or read the stack from the global error handlers below.

// Global crash logging — keeps any white-screen bug debuggable in DevTools
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('[global-error]', event.message, event.error)
  })
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.name === 'AbortError') return
    console.error('[unhandledrejection]', event.reason)
  })
}

// React Query client — controls caching behaviour
// staleTime: how long before it refetches data in the background (2 minutes here)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      retry: 1,  // retry failed requests once before showing an error
    },
  },
})

// Only register the service worker in production. In `vite dev` a SW controls
// the live page and can intercept Vite's HMR websocket / module requests and
// serve a stale cached shell — the classic cause of "the page keeps reloading
// every couple seconds" symptoms that vanish in a fresh headless profile.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// ─── Keep the API warm while someone is actually using the site ────────────
// The API runs on a free tier that sleeps after ~15 minutes without traffic.
// The first request after that took 22.9s in testing, which reads to a student
// as "the site is broken". Pinging /api/health every 10 minutes *only while a
// tab is visible* keeps an active session warm without burning free-tier
// hours overnight. Set VITE_KEEP_API_WARM=off to disable it.
if (typeof window !== 'undefined' && import.meta.env.VITE_KEEP_API_WARM !== 'off') {
  const healthUrl = `${import.meta.env.VITE_API_URL || '/api'}/health`
  const KEEP_ALIVE_MS = 10 * 60 * 1000

  const ping = () => {
    if (document.visibilityState !== 'visible') return
    // Plain fetch on purpose: it must not be slowed by interceptors or retries.
    fetch(healthUrl, { keepalive: true, cache: 'no-store' }).catch(() => {})
  }

  // Warm up immediately on load (covers the "opened the site after a while" case).
  window.addEventListener('load', ping)
  // Re-warm when the user comes back to the tab.
  document.addEventListener('visibilitychange', ping)
  window.setInterval(ping, KEEP_ALIVE_MS)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* HelmetProvider: manages document head tags */}
    <HelmetProvider>
      <ErrorBoundary fallback={<FatalError />}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          {/* QueryClientProvider: makes React Query available anywhere */}
          <QueryClientProvider client={queryClient}>
            {/* AuthProvider: makes login state available anywhere */}
            <AuthProvider>
              <ThemeProvider>
                <ToastProvider>
                {/* Inner boundary: catches route/component crashes and can use
                    router + context for its recovery UI. */}
                <ErrorBoundary>
                  {/* Owns the desktop Main panel ref + which element scrolls.
                      Must sit above App because App, the shell chrome and every
                      overlay read it. */}
                  <LayoutProvider>
                    <App />
                  </LayoutProvider>
                </ErrorBoundary>
                </ToastProvider>
              </ThemeProvider>
            </AuthProvider>
          </QueryClientProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </HelmetProvider>
  </React.StrictMode>
)
