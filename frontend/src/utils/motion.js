import { useEffect, useState } from 'react'

export const EASE = {
  ios: [0.25, 0.1, 0.25, 1],
  mac: [0.4, 0, 0.2, 1],
  out: [0.16, 1, 0.3, 1],
  inOut: [0.4, 0, 0.2, 1],
  spring: { type: 'spring', stiffness: 400, damping: 32, mass: 0.9 },
  springSoft: { type: 'spring', stiffness: 320, damping: 30, mass: 1.0 },
  springBounce: { type: 'spring', stiffness: 420, damping: 28, mass: 0.85 },
}

export const DURATION = {
  fast: 0.15,
  base: 0.22,
  slow: 0.35,
  slower: 0.5,
  page: 0.4,
  modal: 0.35,
  dropdown: 0.25,
  overlay: 0.3,
}

export const MODAL_VARIANTS = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exiting: { opacity: 0, scale: 0.98, y: 4 },
}

export const MODAL_TRANSITION = {
  type: 'spring',
  stiffness: 400,
  damping: 32,
  mass: 0.9,
}

// Bottom-sheet presentation for small screens: the modal
// slides up from the bottom edge instead of scaling in.
export const MODAL_BOTTOM_VARIANTS = {
  hidden: { opacity: 0, y: '100%' },
  visible: { opacity: 1, y: 0 },
  exiting: { opacity: 0, y: '100%' },
}

export const MODAL_BOTTOM_TRANSITION = {
  type: 'spring',
  stiffness: 400,
  damping: 36,
  mass: 0.9,
}

export const DROPDOWN_VARIANTS = {
  hidden: { opacity: 0, y: -4, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exiting: { opacity: 0, y: -2, scale: 0.99 },
}

export const DROPDOWN_TRANSITION = {
  type: 'spring',
  stiffness: 500,
  damping: 35,
  mass: 0.9,
}

export const OVERLAY_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exiting: { opacity: 0 },
}

export const OVERLAY_TRANSITION = {
  duration: DURATION.overlay,
  ease: EASE.mac,
}

export const SCROLL_REVEAL_VARIANTS = {
  fadeUp: {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
    exiting: { opacity: 0, y: -20 },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exiting: { opacity: 0 },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1 },
    exiting: { opacity: 0, scale: 0.98 },
  },
  slideRight: {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 },
    exiting: { opacity: 0, x: 20 },
  },
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return reduced
}

let _vtInFlight = false

/* Every rejection from startViewTransition means the *animation* was skipped,
   never that the DOM update failed. Chrome rejects with AbortError for a
   duplicate transition, and with InvalidStateError when the document is hidden
   or the viewport resizes mid-transition — which happens constantly on mobile,
   where showing/hiding the URL bar changes the viewport height. */
const SKIPPED_VT_ERRORS = new Set(['AbortError', 'InvalidStateError', 'NotSupportedError'])

export function safeViewTransition(callback) {
  if (typeof document === 'undefined' || !('startViewTransition' in document)) {
    callback()
    return null
  }
  if (_vtInFlight) {
    // A transition is already running — run the callback without starting a new one
    callback()
    return null
  }
  _vtInFlight = true

  // The update callback carries the React state change, so it must run exactly
  // once even if the transition is torn down before the browser invokes it.
  let ran = false
  const run = () => {
    if (ran) return
    ran = true
    callback()
  }

  try {
    const vt = document.startViewTransition(run)
    // Never rethrow a skip: `throw err` inside this rejection handler was the
    // source of the "[unhandledrejection] InvalidStateError" noise in main.jsx.
    vt.finished.then(
      () => { _vtInFlight = false },
      (err) => {
        _vtInFlight = false
        if (err && !SKIPPED_VT_ERRORS.has(err.name)) console.warn('[view-transition]', err)
      }
    )
    // `ready` rejects as soon as the transition is skipped, which may happen
    // before the browser calls the update callback. Recover the route change.
    vt.ready?.catch(() => run())
    return vt
  } catch (err) {
    _vtInFlight = false
    if (err && !SKIPPED_VT_ERRORS.has(err.name)) console.warn('[view-transition]', err)
    run()
    return null
  }
}
