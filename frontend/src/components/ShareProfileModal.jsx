import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '../context/ToastContext'
import { X, Link, Download, MoreHorizontal } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import {
  OVERLAY_VARIANTS,
  OVERLAY_TRANSITION,
  MODAL_VARIANTS,
  MODAL_TRANSITION,
} from '../utils/motion'

const GRADIENT =
  'linear-gradient(135deg, #7c5cff 0%, #5b8cff 50%, #3b82f6 100%)'
const SHARE_URL = typeof window !== 'undefined' ? window.location.href : ''

function InfinityGlyph({ size = 22, className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <defs>
        <linearGradient id="ei-qr-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7c5cff" />
          <stop offset="0.5" stopColor="#818cf8" />
          <stop offset="1" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <circle cx="8" cy="12" r="4.8" stroke="url(#ei-qr-grad)" strokeWidth="2" />
      <circle cx="16" cy="12" r="4.8" stroke="url(#ei-qr-grad)" strokeWidth="2" />
    </svg>
  )
}

function WaGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#25D366" />
      <path
        d="M12 6c-3.3 0-6 2.7-6 6 0 1 .3 2 .9 2.8l.1.2-1.4 2.6 2.7-.7c.8.5 1.7.8 2.7.9h.1c3.3 0 6-2.7 6-6s-2.7-6-6-6zm1.7 9.3c-.2.6-.8.9-1.4.8-.4-.1-1-.3-1.9-.9-.3-.2-.5-.4-.7-.7-.2-.3-.2-.5-.1-.7s.3-.3.5-.4c.2 0 .4 0 .5.1.2.2.4.4.5.7.1.3.1.6-.1.8z"
        fill="#fff"
      />
    </svg>
  )
}

function IgGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <defs>
        <linearGradient id="ig-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f09433" />
          <stop offset="0.5" stopColor="#e6683c" />
          <stop offset="1" stopColor="#dc2743" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="url(#ig-grad)" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="2" />
      <circle cx="16.55" cy="6.55" r="1.1" fill="#fff" />
    </svg>
  )
}

function TgGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#0088cc" />
      <path
        d="M17.5 6.5c-.4-1.6-2-2.7-3.6-2.4L6 8.5c-1.6.6-2.2 2.6-1.2 4L7.5 18c.6 1.6 2.6 2.2 4 1.2l3-2c.8-.5 1.2-1.4 1-2.2l-.5-3 2.6-2.4c1-1 1.2-2.4.4-3.3z"
        fill="#fff"
      />
    </svg>
  )
}

function LiGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#0077b5" />
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fontSize="12"
        fontWeight="700"
        fontFamily="Arial, Helvetica, sans-serif"
        fill="#fff"
      >
        in
      </text>
    </svg>
  )
}

function SocialBtn({ label, icon, onClick }) {
  return (
    <button
      type="button"
      aria-label={`Share on ${label}`}
      onClick={onClick}
      className="group relative flex items-center justify-center w-11 h-11 rounded-full bg-white/[0.06] border border-white/12 text-white/85 transition-all hover:-translate-y-0.5 hover:bg-white/[0.12] hover:border-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
    >
      {icon}
    </button>
  )
}

export default function ShareProfileModal({
  open,
  onClose,
  profile,
  qrData,
  qrLoading,
}) {
  const { showToast } = useToast()
  const qrBoxRef = useRef(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    const prevOverflow = document.body.style.overflow
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  const username = profile?.rollNumber
    ? `@${profile.rollNumber.toLowerCase()}`
    : profile?.name
      ? `@${profile.name.toLowerCase().replace(/\s+/g, '')}`
      : ''

  const handleCopy = async () => {
    if (!SHARE_URL) return
    try {
      await navigator.clipboard.writeText(SHARE_URL)
      setCopied(true)
      showToast('Profile link copied to clipboard!', 'success')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      showToast('Could not copy link', 'error')
    }
  }

  const handleShare = (platform) => {
    const url = SHARE_URL
    if (!url) return
    const text = encodeURIComponent(
      `Check out ${profile?.name ? profile.name + "'s" : 'my'} Electro Infinity profile: ${username}`
    )
    const u = encodeURIComponent(url)
    let href = ''
    switch (platform) {
      case 'whatsapp':
        href = `https://wa.me/?text=${text}%20${u}`
        break
      case 'telegram':
        href = `https://t.me/share/url?url=${u}&text=${text}`
        break
      case 'linkedin':
        href = `https://www.linkedin.com/sharing/share-offsite/?url=${u}`
        break
      case 'instagram':
        handleCopy()
        return
      default:
        return
    }
    if (href) window.open(href, '_blank', 'noopener,noreferrer')
  }

  const handleMore = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.name || 'Electro Infinity'}`,
          text: `Check out this Electro Infinity profile: ${username}`,
          url: SHARE_URL,
        })
        return
      } catch {
        // user cancelled or unsupported — fall back to copy
      }
    }
    await handleCopy()
  }

  const handleDownload = () => {
    if (!qrData) return
    const label = `electro-infinity-qr-${profile?.rollNumber || profile?._id || 'profile'}`
    // Prefer the server-generated PNG data URL (clean raster, always scannable)
    if (qrData.qrCode) {
      const a = document.createElement('a')
      a.href = qrData.qrCode
      a.download = `${label}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      showToast('QR code downloaded!', 'success')
      return
    }
    // Fallback: serialize the rendered SVG
    const svg = qrBoxRef.current?.querySelector('svg')
    if (svg) {
      const data = new XMLSerializer().serializeToString(svg)
      const blob = new Blob([data], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${label}.svg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast('QR code downloaded!', 'success')
      return
    }
    showToast('QR code unavailable', 'error')
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="share-qr-overlay"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          style={{ backdropFilter: 'blur(8px)' }}
          variants={OVERLAY_VARIANTS}
          initial="hidden"
          animate="visible"
          exit="exiting"
          transition={OVERLAY_TRANSITION}
          onClick={onClose}
        >
          <motion.div
            variants={MODAL_VARIANTS}
            transition={MODAL_TRANSITION}
            className="relative w-full max-w-[440px] max-h-[92vh] flex flex-col overflow-hidden rounded-3xl border border-white/10"
            style={{
              background: 'linear-gradient(165deg, #0b0b0f 0%, #07070a 100%)',
              boxShadow:
                '0 30px 80px -20px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(124, 92, 255, 0.06)',
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-qr-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/15 to-sky-500/10 border border-white/10">
                  <InfinityGlyph />
                </div>
                <div>
                  <p className="font-display text-[15px] font-semibold text-white">
                    Electro Infinity
                  </p>
                  <p className="font-mono text-[10px] tracking-wide text-white/40">
                    Connect. Create. Collaborate.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex items-center justify-center w-9 h-9 rounded-full text-white/55 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                <X size={18} />
              </button>
            </div>

            {/* Title */}
            <div className="px-6 pb-2 text-center">
              <h2
                id="share-qr-title"
                className="font-display text-[25px] font-bold tracking-tight text-white"
              >
                Share Your{' '}
                <span
                  className="text-transparent bg-clip-text"
                  style={{
                    backgroundImage: GRADIENT,
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                  }}
                >
                  Profile
                </span>
              </h2>
              <p className="mt-1.5 font-sans text-[13px] text-white/50">
                Let others scan this QR code to view your profile
              </p>
            </div>

            {/* QR SECTION */}
            <div className="px-5 py-4 flex items-center justify-center">
              <div
                ref={qrBoxRef}
                className="relative rounded-2xl bg-white p-3"
                style={{
                  boxShadow:
                    '0 0 0 1px rgba(255,255,255,0.08), 0 0 40px -8px rgba(124, 92, 255, 0.5), 0 0 60px -10px rgba(59, 130, 246, 0.3)',
                }}
              >
                {qrLoading ? (
                  <div className="flex items-center justify-center w-[240px] h-[240px]">
                    <div className="w-9 h-9 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                  </div>
                ) : qrData ? (
                  <QRCodeSVG
                    value={qrData.profileUrl}
                    size={240}
                    level="M"
                    includeMargin
                    className="block rounded-lg"
                  />
                ) : (
                  <div className="flex items-center justify-center w-[240px] h-[240px] text-white/35 text-[13px]">
                    Failed to load QR code.
                  </div>
                )}
              </div>
            </div>

            {/* PROFILE INFO */}
            <div className="px-5 pb-1 text-center">
              <p className="font-mono text-[15px] font-semibold text-white/90 truncate">
                {username || profile?.name || 'Electro Infinity'}
              </p>
              <p className="mt-0.5 font-sans text-[12px] text-white/40">
                Scan to connect
              </p>
            </div>

            {/* ACTION BUTTONS */}
            <div className="px-5 py-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleCopy}
                className="group inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[14px] font-semibold text-white transition-all duration-200 hover:opacity-95 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                style={{
                  backgroundImage: GRADIENT,
                  boxShadow: '0 8px 24px -10px rgba(91, 140, 255, 0.55)',
                }}
              >
                <Link
                  size={16}
                  className="transition-transform group-hover:scale-110"
                />
                {copied ? 'Copied!' : 'Copy Profile Link'}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={!qrData || qrLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[14px] font-semibold text-white/85 bg-white/[0.04] border border-white/12 transition-all hover:bg-white/[0.08] hover:border-white/20 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                <Download size={16} />
                Download QR
              </button>
            </div>

            {/* SOCIAL SHARING */}
            <div className="px-5 pb-4">
              <div className="flex items-center gap-3 text-white/30">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
                <span className="font-mono text-[10.5px] font-medium tracking-widest uppercase">
                  Or share via
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <SocialBtn
                  label="WhatsApp"
                  icon={<WaGlyph />}
                  onClick={() => handleShare('whatsapp')}
                />
                <SocialBtn
                  label="Instagram"
                  icon={<IgGlyph />}
                  onClick={() => handleShare('instagram')}
                />
                <SocialBtn
                  label="Telegram"
                  icon={<TgGlyph />}
                  onClick={() => handleShare('telegram')}
                />
                <SocialBtn
                  label="LinkedIn"
                  icon={<LiGlyph />}
                  onClick={() => handleShare('linkedin')}
                />
                <SocialBtn
                  label="More"
                  icon={
                    <MoreHorizontal
                      size={20}
                      className="text-white/70 group-hover:text-white transition-colors"
                    />
                  }
                  onClick={handleMore}
                />
              </div>
            </div>

            {/* FOOTER BRANDING */}
            <div className="px-5 pb-5">
              <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/15 to-sky-500/10 border border-white/10">
                  <InfinityGlyph />
                </div>
                <div>
                  <p className="font-sans text-[12.5px] font-medium text-white/70 leading-tight">
                    More than a club.
                  </p>
                  <p
                    className="font-sans text-[12.5px] font-medium text-transparent bg-clip-text"
                    style={{
                      backgroundImage: GRADIENT,
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                    }}
                  >
                    A network for what's next.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
