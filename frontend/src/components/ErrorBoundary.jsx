import React from 'react'
import { Zap } from 'lucide-react'

/**
 * Catches render/effect errors in any child subtree and shows a friendly
 * recovery screen instead of letting React unmount the whole app into a blank
 * white page (which is what an uncaught error does without a boundary).
 *
 *   <ErrorBoundary>                        → full-page fallback
 *   <ErrorBoundary fallback={<p>…</p>}>    → custom fallback (e.g. the 3D map)
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, errorInfo) {
    // Log to the console so the real cause stays visible in DevTools
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
  }

  // Optional resetKey: when the parent changes it (e.g. a "Restart" button
  // bumping an epoch counter), clear the error and render children again.
  componentDidUpdate(prevProps) {
    if (this.props.resetKey !== prevProps.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: '#f8fafc',
            color: '#0f172a',
            fontFamily: 'Inter, system-ui, sans-serif',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: 480 }}>
            <Zap size={48} />
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Something went wrong</h1>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
              This page hit an unexpected error. Reloading usually fixes it.
            </p>
            {this.state.error.message && (
              <pre
                style={{
                  fontSize: 12,
                  background: '#fee2e2',
                  color: '#b91c1c',
                  padding: 12,
                  borderRadius: 8,
                  overflow: 'auto',
                  textAlign: 'left',
                  marginBottom: 16,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {String(this.state.error.message)}
              </pre>
            )}
            <button
              onClick={this.handleReload}
              style={{
                background: '#0f172a',
                color: '#fff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 10,
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
