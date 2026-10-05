import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, AlertTriangle, Info, Check } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { useScrollLock, useIsDesktopShell } from '../context/LayoutContext'
import {
  MODAL_VARIANTS,
  MODAL_TRANSITION,
  MODAL_BOTTOM_VARIANTS,
  MODAL_BOTTOM_TRANSITION,
  OVERLAY_VARIANTS,
  OVERLAY_TRANSITION,
  useReducedMotion,
} from '../utils/motion'
import { cn } from '../utils/cn'

const ICON_MAP = {
  trash: Trash2,
  warning: AlertTriangle,
  alert: AlertTriangle,
  info: Info,
  help: AlertTriangle,
  check: Check,
}

const VARIANT_CONFIG = {
  danger: {
    badge: 'bg-error/10 text-error dark:bg-error/20 dark:text-error',
    defaultIcon: Trash2,
  },
  warning: {
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-400/20 dark:text-amber-400',
    defaultIcon: AlertTriangle,
  },
  info: {
    badge: 'bg-info/10 text-info dark:bg-info/20 dark:text-info',
    defaultIcon: Info,
  },
}

export default function ConfirmModal({ config, open, onResolve }) {
  const {
    title,
    message,
    itemName,
    variant = 'danger',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    icon,
    onConfirm,
    requireText,
    backdropDisabled,
  } = config || {}

  const { showToast } = useToast()
  const isDesktop = useIsDesktopShell()
  const reduced = useReducedMotion()

  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const overlayRef = useRef(null)
  const dialogRef = useRef(null)
  const confirmRef = useRef(null)
  const cancelRef = useRef(null)
  const inputRef = useRef(null)
  const previouslyFocusedRef = useRef(null)

  const vc = VARIANT_CONFIG[variant] || VARIANT_CONFIG.danger
  const Icon = icon ? (ICON_MAP[icon] || AlertTriangle) : vc.defaultIcon

  const canConfirm = requireText ? inputValue === requireText : true

  useEffect(() => {
    if (config) {
      setLoading(false)
      setInputValue('')
    }
  }, [config])

  useScrollLock(open)

  useEffect(() => {
    if (!open) return

    previouslyFocusedRef.current = document.activeElement

    const timer = setTimeout(() => {
      if (requireText) {
        inputRef.current?.focus()
      } else if (variant === 'danger') {
        cancelRef.current?.focus()
      } else {
        confirmRef.current?.focus()
      }
    }, reduced ? 0 : 50)

    const handleKeydown = (e) => {
      if (e.key === 'Escape' && !backdropDisabled) {
        e.preventDefault()
        resolve(false)
      }

      if (e.key === 'Enter') {
        const active = document.activeElement
        if (active === confirmRef.current && !loading && canConfirm) {
          e.preventDefault()
          handleConfirm()
        }
      }

      if (!reduced && e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable || focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeydown)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', handleKeydown)
      previouslyFocusedRef.current?.focus?.()
    }
  }, [open, variant, requireText, loading, canConfirm, backdropDisabled, reduced])

  function resolve(result) {
    onResolve(result)
  }

  async function handleConfirm() {
    if (loading) return
    if (requireText && !canConfirm) return

    if (onConfirm) {
      setLoading(true)
      try {
        await onConfirm()
        resolve(true)
      } catch (err) {
        setLoading(false)
        showToast(err?.message || 'Something went wrong. Please try again.', 'error')
      }
    } else {
      resolve(true)
    }
  }

  function handleCancel() {
    resolve(false)
  }

  function handleOverlayClick(e) {
    if (backdropDisabled) return
    if (e.target === overlayRef.current) handleCancel()
  }

  const modalVariants = isDesktop ? MODAL_VARIANTS : MODAL_BOTTOM_VARIANTS
  const modalTransition = isDesktop ? MODAL_TRANSITION : MODAL_BOTTOM_TRANSITION

  if (!config) return null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="confirm-overlay"
          ref={overlayRef}
          data-lenis-prevent
          className={cn(
            'fixed inset-0 z-60 flex items-end md:items-center p-0 md:p-4',
            'confirm-overlay dark:confirm-overlay-dark'
          )}
          variants={OVERLAY_VARIANTS}
          initial="hidden"
          animate="visible"
          exit="exiting"
          transition={OVERLAY_TRANSITION}
          onClick={handleOverlayClick}
        >
          <motion.div
            variants={modalVariants}
            transition={modalTransition}
            ref={dialogRef}
            className={cn(
              'relative w-full bg-canvas dark:bg-surface-dark-elevated',
              'border border-hairline shadow-modal',
              'md:rounded-lg md:max-w-md md:mx-auto md:p-7',
              'rounded-t-lg p-6'
            )}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
          >
            <button
              type="button"
              onClick={handleCancel}
              aria-label="Close"
              className="absolute top-4 right-4 flex items-center justify-center w-7 h-7 rounded-full text-muted hover:bg-surface-soft hover:text-ink transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-info"
            >
              <X size={16} />
            </button>

            <div className="flex flex-col items-center text-center pt-1">
              <div
                className={cn(
                  'flex items-center justify-center w-12 h-12 rounded-full mb-4',
                  vc.badge
                )}
              >
                <Icon size={22} />
              </div>

              <h2
                id="confirm-title"
                className="font-display text-card-heading text-ink dark:text-on-dark mb-2"
              >
                {title}
              </h2>

              {message && (
                <p
                  id="confirm-message"
                  className="font-sans text-body text-muted dark:text-on-dark/70 mb-4 max-w-sm"
                >
                  {message}
                </p>
              )}

              {itemName && (
                <div className="w-full max-w-xs mb-4">
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface-soft border border-hairline text-caption text-ink truncate max-w-full"
                    title={itemName}
                  >
                    <span className="truncate">{itemName}</span>
                  </div>
                </div>
              )}

              {requireText && (
                <div className="w-full max-w-xs mb-4">
                  <label className="block font-sans text-[13px] font-medium text-muted mb-1.5">
                    Type <strong className="text-ink">{requireText}</strong> to confirm:
                  </label>
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full text-input text-[14px]"
                    placeholder={requireText}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && canConfirm && !loading) {
                        e.preventDefault()
                        handleConfirm()
                      }
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-end">
              <button
                ref={cancelRef}
                type="button"
                onClick={handleCancel}
                className="button-secondary w-full sm:w-auto"
              >
                {cancelText}
              </button>
              <div className="sm:ml-3 mt-3 sm:mt-0">
                <button
                  ref={confirmRef}
                  type="button"
                  onClick={handleConfirm}
                  disabled={loading || (requireText ? !canConfirm : false)}
                  className={cn(
                    'w-full sm:w-auto flex items-center justify-center gap-2',
                    variant === 'danger' ? 'button-danger' : 'button-primary',
                    (loading || (requireText && !canConfirm)) && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  {loading && (
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-label="Loading"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.764 3 7.898l3-2.707z"
                      />
                    </svg>
                  )}
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
