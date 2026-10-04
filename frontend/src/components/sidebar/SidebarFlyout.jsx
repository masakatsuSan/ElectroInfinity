import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

/* ──────────────────────────────────────────────────────────────────────
   Shared anchor-rect measurement.  Reads the trigger's
   getBoundingClientRect and re-measures on scroll/resize so a portalled
   flyout never drifts.
───────────────────────────────────────────────────────────────────── */

export function useAnchorRect(anchorRef, enabled = true) {
  const [rect, setRect] = useState(null)

  useLayoutEffect(() => {
    if (!enabled) return
    const update = () => {
      const el = anchorRef.current
      if (!el) return setRect(null)
      const r = el.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, right: r.right, bottom: r.bottom, height: r.height })
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [anchorRef, enabled])

  return rect
}

/* Clamp a flyout to the viewport so it never renders off-screen. */
export function clampFlyoutPosition(rect, flyoutWidth) {
  if (!rect) return { top: 0, left: 0 }
  const gap = 8
  const rightEdge = rect.right + gap + flyoutWidth
  if (rightEdge > window.innerWidth) {
    return { top: rect.top, left: rect.left - flyoutWidth - gap }
  }
  return { top: rect.top, left: rect.right + gap }
}

/* ──────────────────────────────────────────────────────────────────────
   RailTooltip — portalled label for collapsed-rail icon buttons.
   Lives in document.body so it is never clipped by the aside's overflow.
───────────────────────────────────────────────────────────────────── */

export function RailTooltip({ label, children }) {
  const [visible, setVisible] = useState(false)
  const anchorRef = useRef(null)
  const rect = useAnchorRect(anchorRef)

  return (
    <>
      <span
        ref={anchorRef}
        className="relative inline-flex w-full justify-center"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocusCapture={() => setVisible(true)}
        onBlurCapture={() => setVisible(false)}
      >
        {children}
      </span>
      {rect &&
        createPortal(
          <span
            role="tooltip"
            style={{ top: rect.top + rect.height / 2, left: rect.right }}
            className={cn(
              'pointer-events-none fixed z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-hairline bg-white px-2.5 py-1.5 font-sans text-[12px] font-medium text-ink shadow-modal transition-opacity duration-150',
              visible ? 'opacity-100' : 'opacity-0'
            )}
          >
            {label}
          </span>,
          document.body
        )}
    </>
  )
}

/* ──────────────────────────────────────────────────────────────────────
   SidebarFlyout — portalled popover for collapsed-rail accordion groups.
   Positioned from the trigger's getBoundingClientRect(), clamped to the
   viewport.  Parent hover coordination (shared ~150 ms close zone) is
   handled by SidebarGroup via onMouseEnter / onMouseLeave props.
───────────────────────────────────────────────────────────────────── */

export function SidebarFlyout({ anchorRect, flyoutWidth = 240, onMouseEnter, onMouseLeave, className, children }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!anchorRect || !mounted) return null

  const style = clampFlyoutPosition(anchorRect, flyoutWidth)

  return createPortal(
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -6 }}
      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn('fixed z-50 rounded-xl border border-hairline bg-white p-1.5 shadow-modal', className)}
    >
      {children}
    </motion.div>,
    document.body
  )
}
