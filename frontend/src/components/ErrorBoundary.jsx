import React from 'react'
import OhmNo from './OhmNo'

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

      return <OhmNo />
    }
    return this.props.children
  }
}
