import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ErrorBoundary from './components/ErrorBoundary'
import App from './App'
import './index.css'

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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* HelmetProvider: manages document head tags */}
    <HelmetProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {/* QueryClientProvider: makes React Query available anywhere */}
        <QueryClientProvider client={queryClient}>
          {/* AuthProvider: makes login state available anywhere */}
          <AuthProvider>
            <ThemeProvider>
              {/* ErrorBoundary: turns any crash into a recoverable screen instead of a white page */}
              <ErrorBoundary>
                <App />
              </ErrorBoundary>
            </ThemeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
)
