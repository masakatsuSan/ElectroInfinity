import { useState, useEffect, lazy, Suspense } from 'react'
import { X } from 'lucide-react'
import { motion } from 'framer-motion'
import { MODAL_VARIANTS, MODAL_TRANSITION } from '../utils/motion'
import { fetchPreviewBlobUrl, getPreviewUrl } from '../api/resources'

function isGoogleDriveUrl(url) {
  if (!url) return false
  return /^https?:\/\/(?:drive\.google\.com|drive\.userdata\.googleusercontent\.com|drive\.googleusercontent\.com)/i.test(url)
}

// react-pdf pulls in a ~1.4 MB PDF.js worker, so it is only downloaded when a
// user actually opens a PDF preview rather than on every page load.
const PdfViewer = lazy(() => import('./PdfViewer'))

export default function ResourcePreviewDrawer({ resource, onClose }) {
  const isPdf = resource ? (/\.pdf($|[?#])/i.test(resource.fileUrl || '') || isGoogleDriveUrl(resource.fileUrl)) : false
  const isImage = resource ? /\.(png|jpe?g|webp|gif|svg)($|[?#])/i.test(resource.fileUrl || '') : false
  const [loading, setLoading] = useState(true)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [previewError, setPreviewError] = useState('')

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    let active = true
    let objectUrl = null

    if (!resource) {
      setLoading(false)
      return
    }

    setLoading(true)
    setPreviewUrl(null)
    setPreviewError('')

    if (isPdf) {
      if (active) {
        setPreviewUrl(getPreviewUrl(resource._id))
        setLoading(false)
      }
      return
    }

    fetchPreviewBlobUrl(resource._id)
      .then(url => {
        if (!active) {
          URL.revokeObjectURL(url)
          return
        }
        objectUrl = url
        setPreviewUrl(url)
      })
      .catch(error => {
        if (!active) return
        setPreviewError(
          error.response?.status === 404
            ? 'This file is no longer available.'
            : 'Preview could not be loaded.'
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [resource?._id, isPdf, isImage])

  if (!resource) return null

  return (
    <div className="fixed inset-0 z-[100] flex">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-3xl h-full bg-white border-r border-hairline shadow-modal flex flex-col overflow-hidden"
        initial="hidden"
        animate="visible"
        exit="exiting"
        variants={MODAL_VARIANTS}
        transition={MODAL_TRANSITION}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-hairline">
          <div className="min-w-0">
            <h3 className="font-display text-[18px] font-semibold text-ink truncate">
              {resource.title || 'Preview'}
            </h3>
            <p className="font-mono text-[11px] text-body-muted truncate">
              {resource.fileName || 'File preview'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="button-icon-circular !w-9 !h-9"
            aria-label="Close preview"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative flex-1 overflow-hidden bg-soft-stone/40">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-soft-stone/40">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {previewError && !loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center p-6 bg-soft-stone/40">
              <div className="max-w-sm rounded-xl border border-hairline bg-white p-6 text-center shadow-sm">
                <p className="font-sans text-[15px] font-medium text-ink">Preview unavailable</p>
                <p className="mt-2 font-sans text-[13px] text-body-muted">{previewError}</p>
              </div>
            </div>
          )}
          {previewUrl && isPdf ? (
            <Suspense
              fallback={
                <div className="absolute inset-0 flex items-center justify-center bg-soft-stone/40">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              }
            >
              <PdfViewer key={previewUrl} file={previewUrl} />
            </Suspense>
          ) : previewUrl && isImage ? (
            <img
              src={previewUrl}
              alt={resource.title || 'Preview'}
              className="w-full h-full object-contain"
              onLoad={() => setLoading(false)}
              loading="lazy"
              style={{ visibility: loading ? 'hidden' : 'visible' }}
            />
          ) : !previewUrl && !loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
              <p className="font-sans text-[15px] text-body-muted">
                {previewError || 'Preview is not available for this file type.'}
              </p>
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  )
}
