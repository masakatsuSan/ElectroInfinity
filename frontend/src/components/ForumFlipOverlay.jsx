import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MessagesSquare } from 'lucide-react'
import ProtectedRoute from './ProtectedRoute'
import ForumFlipContext from '../context/ForumFlipContext'
import { EASE, DURATION } from '../utils/motion'

// Forum is a large page. Loading it lazily here (instead of a static import)
// keeps it out of the entry chunk — the overlay shows a spinner while the
// chunk streams in, and Vite can then split Forum into its own file.
const Forum = lazy(() => import('../pages/Forum'))

const OPEN_SPRING = { type: 'spring', stiffness: 420, damping: 38, mass: 0.9 }
const CLOSE_SPRING = { type: 'spring', stiffness: 380, damping: 44, mass: 1.0 }
const CROSSFADE_DURATION = 220

export default function ForumFlipOverlay({ triggerRect, borderRadius: borderRadiusProp, onClose }) {
  const overlayRef = useRef(null)
  const closingRef = useRef(false)
  const closeHandlerRef = useRef(null)
  const [previewOpacity, setPreviewOpacity] = useState(1)
  const [fullOpacity, setFullOpacity] = useState(0)
  const [fullPointerEvents, setFullPointerEvents] = useState('none')
  const [mounted, setMounted] = useState(false)

  // Mount after a tick so AnimatePresence can pick up the initial state
  useEffect(() => {
    if (!triggerRect) return
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [triggerRect])

  const handleClose = () => {
    if (closingRef.current || !triggerRect) return
    closingRef.current = true
    setFullOpacity(0)
    setFullPointerEvents('none')
    setPreviewOpacity(1)
    // Let the spring finish before calling onClose
    setTimeout(() => {
      onClose()
    }, 420)
  }

  closeHandlerRef.current = handleClose

  useEffect(() => {
    if (!triggerRect) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (closeHandlerRef.current) closeHandlerRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [triggerRect])

  // Crossfade: preview → full content with a staggered spring feel
  useEffect(() => {
    if (!triggerRect) return
    document.body.style.overflow = 'hidden'
    const t1 = setTimeout(() => {
      setFullOpacity(1)
      setPreviewOpacity(0)
      setFullPointerEvents('auto')
    }, 260)
    return () => {
      clearTimeout(t1)
      document.body.style.overflow = ''
    }
  }, [triggerRect])

  if (!triggerRect) return null
  const flipContextValue = { isFlipped: true, onBack: () => closeHandlerRef.current && closeHandlerRef.current() }

  const radius = borderRadiusProp || '0px'

  return createPortal(
    <>
      <motion.div
        className="fixed inset-0 z-[9998] bg-black/30 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: DURATION.overlay, ease: EASE.mac } }}
        exit={{ opacity: 0, transition: { duration: DURATION.overlay * 0.66, ease: EASE.mac } }}
      />
      <motion.div
        ref={overlayRef}
        className="fixed z-[9999] bg-white overflow-hidden"
        initial={{
          top: triggerRect.top,
          left: triggerRect.left,
          width: triggerRect.width,
          height: triggerRect.height,
          borderRadius: radius,
          opacity: 1,
        }}
        animate={{
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          borderRadius: '0px',
          opacity: 1,
          transition: OPEN_SPRING,
        }}
        exit={{
          top: triggerRect.top,
          left: triggerRect.left,
          width: triggerRect.width,
          height: triggerRect.height,
          borderRadius: radius,
          opacity: 0,
          transition: CLOSE_SPRING,
        }}
        style={{ willChange: 'top, left, width, height, border-radius' }}
      >
        <div className="absolute inset-0 flex items-center justify-center gap-2.5 bg-surface-soft" style={{ opacity: previewOpacity, transition: 'opacity ' + CROSSFADE_DURATION + 'ms ease', pointerEvents: 'none' }}>
          <MessagesSquare size={16} strokeWidth={1.75} className="text-ink" />
          <span className="font-sans text-[14px] font-medium text-ink">Forum</span>
        </div>
        <div className="absolute inset-0" style={{ opacity: fullOpacity, pointerEvents: fullPointerEvents, transition: 'opacity ' + CROSSFADE_DURATION + 'ms ease' }}>
          <ForumFlipContext.Provider value={flipContextValue}>
            <ProtectedRoute>
              <Suspense
                fallback={
                  <div className="absolute inset-0 flex items-center justify-center bg-canvas">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                }
              >
                <Forum />
              </Suspense>
            </ProtectedRoute>
          </ForumFlipContext.Provider>
        </div>
      </motion.div>
    </>,
    document.body
  )
}