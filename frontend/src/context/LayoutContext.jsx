import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

/* ──────────────────────────────────────────────────────────────────────────
   Desktop shell layout.

   At >= 1024px the window no longer scrolls. The shell splits into two
   independent regions:

     [ Sidebar panel ]   fixed card, overlays the Main panel when expanded
     [ Main panel    ]   rounded white card, owns its own vertical scroll
                         (sticky top bar + page content + footer)

   Everything that used to read window.scrollY, add a window 'scroll'
   listener or pass `root: null` to an observer now goes through
   useMainScroll(). Below 1024px there is no panel at all, so the hook
   returns `window` and mobile behaviour is byte-for-byte what it was.
   ────────────────────────────────────────────────────────────────────────── */

export const DESKTOP_QUERY = '(min-width: 1024px)'

const getWindow = () => (typeof window !== 'undefined' ? window : null)

const LayoutContext = createContext(null)

/* ── Scroll lock ──────────────────────────────────────────────────────────
   Reference counted. GlobalSearch, the mobile menu and modals can all be
   open at once and previously each wrote document.body.style.* itself, so
   closing one wiped the lock another still needed. The first caller owns
   the element and the last one releases it.

   Desktop locks the panel (that is the scrollport). Mobile keeps the
   original body lock verbatim so the overlay behaviour is unchanged. */
let lockDepth = 0
let releaseLock = null

function beginLock(scroller, lenis) {
  const isPanel = scroller && scroller !== getWindow() && scroller.nodeType === 1

  if (isPanel) {
    const el = scroller
    const prevOverflow = el.style.overflow
    const savedTop = el.scrollTop
    lenis?.stop()
    el.style.overflow = 'hidden'
    return () => {
      el.style.overflow = prevOverflow
      el.scrollTop = savedTop
      lenis?.start()
    }
  }

  const scrollY = getWindow()?.scrollY ?? 0
  lenis?.stop()
  document.documentElement.style.overflow = 'hidden'
  document.body.style.overflow = 'hidden'
  document.body.style.position = 'fixed'
  document.body.style.top = `-${scrollY}px`
  document.body.style.width = '100%'
  return () => {
    document.documentElement.style.overflow = ''
    document.body.style.overflow = ''
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.width = ''
    getWindow()?.scrollTo(0, scrollY)
    lenis?.start()
  }
}

export function lockMainScroll(scroller, lenis) {
  if (typeof document === 'undefined') return () => {}
  if (lockDepth === 0) releaseLock = beginLock(scroller, lenis)
  lockDepth += 1

  let done = false
  return () => {
    if (done) return
    done = true
    lockDepth -= 1
    if (lockDepth === 0) {
      releaseLock?.()
      releaseLock = null
    }
  }
}

export function LayoutProvider({ children }) {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches
  )
  const [mainPanel, setMainPanel] = useState(null)
  const [mainContent, setMainContent] = useState(null)
  const lenisRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia(DESKTOP_QUERY)
    const onChange = (e) => setIsDesktop(e.matches)
    setIsDesktop(mq.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  // Callback refs so consumers re-run their effects once the panel exists.
  const setMainPanelRef = useCallback((el) => setMainPanel(el), [])
  /* Lenis needs a `content` element to watch for size changes (it reads the
     scrollable extent off the wrapper itself). This is the growing box inside
     the panel: top bar + page content + footer. */
  const setMainContentRef = useCallback((el) => setMainContent(el), [])

  const registerLenis = useCallback((instance) => {
    lenisRef.current = instance
  }, [])

  const getLenis = useCallback(() => lenisRef.current, [])

  /* Never null: before the panel mounts (and on mobile) fall back to window
     so consumers never have to null-check. */
  const scroller = useMemo(
    () => (isDesktop && mainPanel ? mainPanel : getWindow()),
    [isDesktop, mainPanel]
  )

  const value = useMemo(
    () => ({
      isDesktop,
      mainPanel,
      mainContent,
      setMainPanelRef,
      setMainContentRef,
      scroller,
      registerLenis,
      getLenis,
    }),
    [isDesktop, mainPanel, mainContent, setMainPanelRef, setMainContentRef, scroller, registerLenis, getLenis]
  )

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
}

export function useLayout() {
  const ctx = useContext(LayoutContext)
  if (!ctx) throw new Error('useLayout must be used inside LayoutProvider')
  return ctx
}

/**
 * The element that actually scrolls: the Main panel at >= 1024px, `window`
 * below it. Supports the whole scroll API on both (scrollTop, scrollTo,
 * addEventListener('scroll')), so callers do not branch on breakpoint.
 */
export function useMainScroll() {
  return useLayout().scroller
}

/** Raw panel element (null on mobile) — for IntersectionObserver roots. */
export function useMainPanel() {
  return useLayout().mainPanel
}

/** True only inside the >= 1024px shell. */
export function useIsDesktopShell() {
  return useLayout().isDesktop
}

/**
 * Locks the Main panel's scroll on desktop and the body's on mobile.
 * Reference counted, so nested overlays unlock in the right order.
 */
export function useScrollLock(active) {
  const { scroller, getLenis } = useLayout()
  useEffect(() => {
    if (!active) return
    return lockMainScroll(scroller, getLenis())
  }, [active, scroller, getLenis])
}
