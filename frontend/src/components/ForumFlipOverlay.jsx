import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { MessagesSquare } from 'lucide-react'
import ProtectedRoute from './ProtectedRoute'
import Forum from '../pages/Forum'
import ForumFlipContext from '../context/ForumFlipContext'

const ANIM_DURATION = 550 // ms
const EASING = 'cubic-bezier(.65, 0, .35, 1)'
const CROSSFADE_DURATION = 280 // ms

const TRANSITION_CSS =
  'top ' + ANIM_DURATION + 'ms ' + EASING + ','
  + 'left ' + ANIM_DURATION + 'ms ' + EASING + ','
  + 'width ' + ANIM_DURATION + 'ms ' + EASING + ','
  + 'height ' + ANIM_DURATION + 'ms ' + EASING + ','
  + 'border-radius ' + ANIM_DURATION + 'ms ' + EASING

export default function ForumFlipOverlay({ triggerRect, borderRadius: borderRadiusProp, onClose }) {
  const overlayRef = useRef(null)
  const closingRef = useRef(false)
  const closeHandlerRef = useRef(null)
  const [previewOpacity, setPreviewOpacity] = useState(1)
  const [fullOpacity, setFullOpacity] = useState(0)
  const [fullPointerEvents, setFullPointerEvents] = useState('none')

  const handleClose = () => {
    if (closingRef.current || !overlayRef.current || !triggerRect) return
    closingRef.current = true
    setFullOpacity(0)
    setFullPointerEvents('none')
    setPreviewOpacity(1)
    setTimeout(() => {
      const overlay = overlayRef.current
      if (!overlay) return
      const radius = borderRadiusProp || '0px'
      overlay.style.transition = TRANSITION_CSS
      overlay.style.top = triggerRect.top + 'px'
      overlay.style.left = triggerRect.left + 'px'
      overlay.style.width = triggerRect.width + 'px'
      overlay.style.height = triggerRect.height + 'px'
      overlay.style.borderRadius = radius
      const onTransitionEnd = (e) => {
        if (e.propertyName === 'width') {
          overlay.removeEventListener('transitionend', onTransitionEnd)
          document.body.style.overflow = ''
          onClose()
        }
      }
      overlay.addEventListener('transitionend', onTransitionEnd)
    }, CROSSFADE_DURATION + 30)
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

  useEffect(() => {
    if (!triggerRect || !overlayRef.current) return
    const overlay = overlayRef.current
    const radius = borderRadiusProp || '0px'
    overlay.style.transition = 'none'
    overlay.style.top = triggerRect.top + 'px'
    overlay.style.left = triggerRect.left + 'px'
    overlay.style.width = triggerRect.width + 'px'
    overlay.style.height = triggerRect.height + 'px'
    overlay.style.borderRadius = radius
    overlay.style.opacity = '1'
    overlay.style.pointerEvents = 'auto'
    overlay.style.overflow = 'hidden'
    overlay.style.margin = '0'
    overlay.style.padding = '0'
    overlay.style.backgroundColor = '#ffffff'
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.style.transition = TRANSITION_CSS
        overlay.style.top = '0px'
        overlay.style.left = '0px'
        overlay.style.width = '100vw'
        overlay.style.height = '100vh'
        overlay.style.borderRadius = '0px'
        setTimeout(() => {
          setFullOpacity(1)
          setPreviewOpacity(0)
          setFullPointerEvents('auto')
        }, ANIM_DURATION * 0.6)
      })
    })
    return () => { document.body.style.overflow = '' }
  }, [triggerRect, borderRadiusProp])

  if (!triggerRect) return null
  const flipContextValue = { isFlipped: true, onBack: () => closeHandlerRef.current && closeHandlerRef.current() }

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" />
      <div ref={overlayRef} className="fixed z-[9999] bg-canvas overflow-hidden" style={{ top: '0px', left: '0px', width: '0px', height: '0px', borderRadius: '0px', opacity: '0' }}>
        <div className="absolute inset-0 flex items-center justify-center gap-2.5 bg-soft-stone" style={{ opacity: previewOpacity, transition: 'opacity ' + CROSSFADE_DURATION + 'ms ease', pointerEvents: 'none' }}>
          <MessagesSquare size={16} strokeWidth={1.75} className="text-ink" />
          <span className="font-sans text-[14px] font-medium text-ink">Forum</span>
        </div>
        <div className="absolute inset-0" style={{ opacity: fullOpacity, pointerEvents: fullPointerEvents, transition: 'opacity ' + CROSSFADE_DURATION + 'ms ease' }}>
          <ForumFlipContext.Provider value={flipContextValue}>
            <ProtectedRoute>
              <Forum />
            </ProtectedRoute>
          </ForumFlipContext.Provider>
        </div>
      </div>
    </>,
    document.body
  )
}
