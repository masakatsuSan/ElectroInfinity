import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function GalleryLightbox({ images, initialIndex = 0, onClose }) {
  const [index, setIndex] = useState(initialIndex)

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setIndex((i) => (i > 0 ? i - 1 : images.length - 1))
      if (e.key === 'ArrowRight') setIndex((i) => (i < images.length - 1 ? i + 1 : 0))
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [images.length, onClose])

  if (!images || images.length === 0) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
      >
        <X size={28} />
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setIndex((i) => (i > 0 ? i - 1 : images.length - 1)) }}
            className="absolute left-4 text-white/80 hover:text-white transition-colors"
          >
            <ChevronLeft size={32} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIndex((i) => (i < images.length - 1 ? i + 1 : 0)) }}
            className="absolute right-4 text-white/80 hover:text-white transition-colors"
          >
            <ChevronRight size={32} />
          </button>
        </>
      )}

      <div className="max-w-[90vw] max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
        <img
          src={images[index]}
          alt={`Gallery ${index + 1}`}
          className="max-w-full max-h-[85vh] object-contain rounded-lg"
        />
        <div className="text-center mt-3 text-white/60 font-mono text-[12px]">
          {index + 1} / {images.length}
        </div>
      </div>
    </div>
  )
}
