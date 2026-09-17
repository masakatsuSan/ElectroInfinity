import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { getPreviewUrl, fetchPreviewBlobUrl } from '../api/resources'

export default function ResourceSplitView({ selectedResource, resources, onSelectResource, onClose }) {
  if (!selectedResource) return null

  const isPdf = /\.pdf($|[?#])/i.test(selectedResource.fileUrl || '')
  const isImage = /\.(png|jpe?g|webp|gif|svg)($|[?#])/i.test(selectedResource.fileUrl || '')
  const [loading, setLoading] = useState(true)
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    let objectUrl = null
    setLoading(true)
    fetchPreviewBlobUrl(selectedResource._id)
      .then(url => {
        objectUrl = url
        setPreviewUrl(url)
      })
      .catch(() => {
        setPreviewUrl(getPreviewUrl(selectedResource._id))
      })
      .finally(() => {
        setLoading(false)
      })
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      const onKey = (e) => {
        if (e.key === 'Escape') onClose()
      }
      window.addEventListener('keydown', onKey)
      window.removeEventListener('keydown', onKey)
    }
  }, [selectedResource._id, onClose])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const otherResources = resources.filter(r => r._id !== selectedResource._id)

  return (
    <div className="flex flex-1 h-[calc(100vh-12rem)] overflow-hidden">
      {/* Left Panel — PDF/Image Viewer */}
      <div className="flex-[3] flex flex-col bg-white border-r border-hairline overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-hairline shrink-0">
          <div className="min-w-0">
            <h3 className="font-display text-[18px] font-semibold text-ink truncate">
              {selectedResource.title || 'Preview'}
            </h3>
            <p className="font-mono text-[11px] text-body-muted truncate">
              {selectedResource.fileName || 'File preview'}
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
              title={selectedResource.title || 'Preview'}
              className="w-full h-full"
              onLoad={() => setLoading(false)}
              style={{ visibility: loading ? 'hidden' : 'visible' }}
            />
          ) : previewUrl && isImage ? (
            <img
              src={previewUrl}
              alt={selectedResource.title || 'Preview'}
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
      </div>

      {/* Right Panel — Other Resources Sidebar */}
      <div className="w-72 flex flex-col bg-white overflow-hidden shrink-0">
        <div className="px-4 py-3 border-b border-hairline shrink-0">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
            Other Resources
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {otherResources.length === 0 ? (
            <p className="text-[13px] text-muted text-center py-8">No other resources</p>
          ) : (
            otherResources.map(item => (
              <button
                key={item._id}
                type="button"
                onClick={() => onSelectResource(item)}
                className="w-full text-left p-3 rounded-lg border border-hairline bg-white hover:bg-soft-stone/40 transition-colors group"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-mono text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-soft-stone text-ink border border-hairline">
                    {item.type?.replace('_', ' ') || 'Resource'}
                  </span>
                  {item.semester && (
                    <span className="font-mono text-[10px] font-medium uppercase px-2 py-0.5 rounded-full bg-soft-stone text-ink">
                      Sem {item.semester}
                    </span>
                  )}
                </div>
                <h4 className="font-sans text-[14px] font-medium text-ink leading-snug group-hover:text-link transition-colors line-clamp-2">
                  {item.title}
                </h4>
                {item.subject && (
                  <p className="font-sans text-[12px] text-muted mt-0.5">{item.subject}</p>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
