import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { motion } from 'framer-motion'
import { MODAL_VARIANTS, MODAL_TRANSITION } from '../utils/motion'
import { getPreviewUrl, fetchPreviewBlobUrl } from '../api/resources'

export default function ResourcePreviewDrawer({ resource, onClose }) {
  if (!resource) return null

  const isPdf = /\.pdf($|[?#])/i.test(resource.fileUrl || '')
  const isImage = /\.(png|jpe?g|webp|gif|svg)($|[?#])/i.test(resource.fileUrl || '')
  const [loading, setLoading] = useState(true)
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    let objectUrl = null
    setLoading(true)
    fetchPreviewBlobUrl(resource._id)
      .then(url => {
        objectUrl = url
        setPreviewUrl(url)
      })
      .catch(() => {
        setPreviewUrl(getPreviewUrl(resource._id))
      })
      .finally(() => {
        setLoading(false)
      })
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [resource._id])

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
          {previewUrl && isPdf ? (
            <iframe
              src={previewUrl}
              title={resource.title || 'Preview'}
              className="w-full h-full"
              onLoad={() => setLoading(false)}
              style={{ visibility: loading ? 'hidden' : 'visible' }}
            />
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
                Preview is not available for this file type.
              </p>
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  )
}
