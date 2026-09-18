import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ErrorBoundary from './components/ErrorBoundary'
import FatalError from './components/FatalError'
import App from './App'
import './index.css'

// ─── Boot hand-off ─────────────────────────────────────────────────────────
// index.html paints an inline boot screen that stays up until the app is
// actually on screen. Without this, the old splash faded out on a fixed 0.8s
// timer and left a blank page for as long as the bundle took to arrive.
function BootSignal() {
  React.useEffect(() => {
    window.__eiBoot?.ready?.()
  }, [])
  return null
}

// ─── Recovery from a failed code-split chunk ───────────────────────────────
// After a deploy, a tab that is still open may ask for a chunk whose hashed
// filename no longer exists. Vite raises `vite:preloadError`; we reload once so
// the user picks up the new index.html instead of staring at a dead screen.
if (typeof window !== 'undefined') {
  const RELOAD_KEY = 'ei_chunk_reload_at'
  const reloadOnce = () => {
    let last = 0
    try {
      last = Number(sessionStorage.getItem(RELOAD_KEY)) || 0
    } catch {
      /* sessionStorage unavailable (private mode) — fall through */
    }
    // Guard against a reload loop: at most one automatic reload per 30s.
    if (Date.now() - last < 30000) return
    try {
      sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
    } catch {
      /* ignore */
    }
    window.location.reload()
  }

  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault()
    console.error('[chunk] failed to load a lazy chunk, reloading once', event.payload)
    reloadOnce()
  })
}

// Global crash logging — keeps any white-screen bug debuggable in DevTools
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('[window:error]', event.message, event.error)
  })
  window.addEventListener('unhandledrejection', (event) => {
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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* HelmetProvider: manages document head tags */}
    <HelmetProvider>
      {/* BootSignal sits outside the boundaries so the boot screen is always
          released — a crash then shows a real error screen instead of a splash
          (or a white page) that never goes away. */}
      <BootSignal />
      <ErrorBoundary fallback={<FatalError />}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          {/* QueryClientProvider: makes React Query available anywhere */}
          <QueryClientProvider client={queryClient}>
            {/* AuthProvider: makes login state available anywhere */}
            <AuthProvider>
              <ThemeProvider>
                {/* Inner boundary: catches route/component crashes and can use
                    router + context for its recovery UI. */}
                <ErrorBoundary>
                  <App />
                </ErrorBoundary>
              </ThemeProvider>
            </AuthProvider>
          </QueryClientProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </HelmetProvider>
  </React.StrictMode>
)
