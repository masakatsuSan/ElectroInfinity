import React from 'react'
import FatalError from './FatalError'

/**
 * Catches render/effect errors in any child subtree and shows a friendly
 * recovery screen instead of letting React unmount the whole app into a blank
 * white page (which is what an uncaught error does without a boundary).
 *
 *   <ErrorBoundary>                        → full-page fallback
 *   <ErrorBoundary fallback={<p>…</p>}>    → custom fallback (e.g. page-level)
 *   <ErrorBoundary resetKey={someKey}>     → clears the error when the key
 *                                            changes (used for route changes)
 *
 * Note that error boundaries only catch errors thrown while rendering — not
 * errors inside event handlers, timers or promises. Those are logged globally
 * in main.jsx instead.
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

  // Optional resetKey: when the parent changes it (e.g. navigating to another
  // route), clear the error and render children again. Without this the
  // boundary stays latched and every page shows the error until a hard reload —
  // one of the "have to refresh to use the site" causes.
  componentDidUpdate(prevProps) {
    if (this.props.resetKey !== prevProps.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  resetErrorBoundary = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return React.cloneElement(this.props.fallback, {
          resetErrorBoundary: this.resetErrorBoundary,
        })
      }

      return <FatalError />
    }
    return this.props.children
  }
}
