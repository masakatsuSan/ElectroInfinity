import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getGallery, createGalleryPhoto, getGalleryImageUrl } from '../api/gallery'
import { useAuth } from '../context/AuthContext'
import SEO from '../components/SEO'
import { Plus, X, Upload } from 'lucide-react'
import UploaderInfo from '../components/UploaderInfo'

const CATEGORIES = ['All', 'Workshops', 'Events', 'Lab', 'Campus']
const GALLERY_RATIOS = ['lg:aspect-[4/5]', 'lg:aspect-[3/4]', 'lg:aspect-video']

export default function Gallery() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [active, setActive] = useState('All')
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [showUpload, setShowUpload] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['gallery'],
    queryFn: () => getGallery().then(r => r.data),
  })

  const GALLERY = (data?.data || []).map(p => ({
    _id: p._id,
    url: getGalleryImageUrl(p._id),
    label: p.title,
    category: p.category
      ? p.category.charAt(0).toUpperCase() + p.category.slice(1)
      : 'Campus',
    uploadedBy: p.uploadedBy,
  }))

  const filtered = GALLERY.filter(g => active === 'All' || g.category === active)

  const createMut = useMutation({
    mutationFn: createGalleryPhoto,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gallery'] })
      setShowUpload(false)
    },
    onError: (err) => {
      alert(err.response?.data?.error || err.message || 'Upload failed')
    },
  })

  useEffect(() => {
    const handleKey = (e) => {
      if (selectedIndex === null) return
      if (e.key === 'Escape') setSelectedIndex(null)
      if (e.key === 'ArrowLeft') setSelectedIndex((selectedIndex - 1 + filtered.length) % filtered.length)
      if (e.key === 'ArrowRight') setSelectedIndex((selectedIndex + 1) % filtered.length)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [selectedIndex, filtered.length])

  return (
    <div className="min-h-screen bg-white text-ink pt-24 pb-24">
      <SEO title="Gallery | Electro Infinity" description="Visual archive of Electro Infinity workshops, events, lab sessions, and campus life." />

      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        <div className="max-w-3xl mb-12 md:mb-16">
          <span className="font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-signature-coral block mb-3">
            Visual Archive
          </span>
          <h1 className="font-display text-[40px] md:text-[56px] font-normal leading-[1.2] text-ink mb-4">
            Department Gallery
          </h1>
          <p className="font-sans text-[14px] text-body leading-[1.25] max-w-2xl">
            Moments from hands-on laboratory sessions, technical symposiums, robotic competitions, and student projects.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div className="flex gap-2 overflow-x-auto pb-2 border-b border-hairline w-full sm:w-auto">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setActive(c)}
                className={`font-sans text-[14px] font-medium px-4 py-2 rounded-sm whitespace-nowrap transition-colors ${
                  active === c
                    ? 'bg-ink text-white'
                    : 'bg-surface-soft text-body'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {user && (
            <button
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-2 bg-ink text-white px-5 py-2.5 rounded-md text-[14px] font-medium shadow-sm"
            >
              <Plus size={16} />
              Upload Photo
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-video rounded-md border border-hairline bg-surface-soft animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((img, i) => (
              <div key={i} className="flex flex-col">
                {user ? (
                  <button
                    onClick={() => setSelectedIndex(i)}
                    className={`relative overflow-hidden group block w-full text-left rounded-md border border-divider-soft bg-white shadow-sm ${GALLERY_RATIOS[i % GALLERY_RATIOS.length]}`}
                  >
                    <img
                      src={img.url}
                      alt={img.label}
                       className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                       style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
                    />
                     <div className="absolute inset-0 bg-ink/55 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-4" style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}>
                      <p className="font-sans text-[13px] font-medium text-white">
                        {img.label}
                      </p>
                    </div>
                  </button>
                ) : (
                  <div className={`relative overflow-hidden rounded-md border border-divider-soft bg-surface-soft ${GALLERY_RATIOS[i % GALLERY_RATIOS.length]}`}>
                    <img
                      src={img.url}
                      alt={img.label}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-ink/38 flex items-end p-4">
                      <p className="font-sans text-[13px] font-medium text-white">
                        {img.label}
                      </p>
                    </div>
                  </div>
                )}
                {img.uploadedBy && (
                  <UploaderInfo user={img.uploadedBy} size="w-6 h-6" className="mt-3 px-1 gap-2" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-hairline bg-surface-soft rounded-lg p-16 text-center">
            <span className="font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-muted block mb-2">
              No Photos
            </span>
            <p className="font-sans text-[14px] text-muted">
              No photos currently uploaded in this category.
            </p>
          </div>
        )}

        {selectedIndex !== null && (
          <div
            className="fixed inset-0 z-50 bg-ink/88 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedIndex(null)
            }}
          >
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white text-ink border border-hairline flex items-center justify-center z-10"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <button
              onClick={() => setSelectedIndex((selectedIndex - 1 + filtered.length) % filtered.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-ink z-10 bg-white border border-hairline rounded-full w-12 h-12 flex items-center justify-center"
              aria-label="Previous"
            >
              ‹
            </button>

            <button
              onClick={() => setSelectedIndex((selectedIndex + 1) % filtered.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-ink z-10 bg-white border border-hairline rounded-full w-12 h-12 flex items-center justify-center"
              aria-label="Next"
            >
              ›
            </button>

            <img
              src={filtered[selectedIndex].url}
              alt={filtered[selectedIndex].label}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-lg"
            />
            {filtered[selectedIndex].uploadedBy && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-ink text-white px-4 py-2 rounded-md">
                <div className="relative w-6 h-6 rounded-full overflow-hidden bg-white/20 shrink-0">
                  {filtered[selectedIndex].uploadedBy.photo ? (
                    <img src={filtered[selectedIndex].uploadedBy.photo} alt={filtered[selectedIndex].uploadedBy.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-sans text-[9px] font-medium text-white">
                        {(filtered[selectedIndex].uploadedBy.name || 'S').split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <span className="font-sans text-[13px] font-medium">
                  {filtered[selectedIndex].uploadedBy.name || 'Unknown'}
                </span>
              </div>
            )}
          </div>
        )}

        {showUpload && (
          <UploadModal
            onClose={() => setShowUpload(false)}
            onSubmit={(data) => createMut.mutate(data)}
            loading={createMut.isPending}
          />
        )}
      </div>
    </div>
  )
}

function UploadModal({ onClose, onSubmit, loading }) {
  const [form, setForm] = useState({
    title: '',
    category: 'campus',
    date: '',
    image: null,
  })
  const [imagePreview, setImagePreview] = useState('')
  const fileRef = useRef(null)

  const set = (k) => (e) => {
    const value = e.target.type === 'file' ? e.target.files?.[0] : e.target.value
    setForm((f) => ({ ...f, [k]: value }))
    if (k === 'image' && value) {
      setImagePreview(URL.createObjectURL(value))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      alert('Title is required')
      return
    }
    const data = new FormData()
    data.append('title', form.title.trim())
    data.append('category', form.category)
    if (form.date) data.append('date', form.date)
    if (form.image) data.append('image', form.image)
    onSubmit(data)
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink/64 flex items-center justify-center p-4">
      <div className="bg-white text-ink border border-hairline rounded-lg w-full max-w-xl max-h-[90vh] flex flex-col shadow-lg overflow-hidden">
        <div className="p-6 border-b border-hairline flex items-center justify-between">
          <div>
            <h3 className="font-display text-[22px] font-normal">Upload Photo</h3>
            <p className="font-sans text-[13px] text-muted">
              Share a moment with the department.
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface-soft border border-hairline flex items-center justify-center transition-colors">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          <div>
            <label className="block font-mono text-[13px] font-medium text-muted mb-1.5">Title *</label>
            <input required value={form.title} onChange={set('title')} placeholder="e.g. Lab Workshop 2024" className="input" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[13px] font-medium text-muted mb-1.5">Category</label>
              <select value={form.category} onChange={set('category')} className="input">
                <option value="campus">Campus</option>
                <option value="event">Event</option>
                <option value="lab">Lab</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block font-mono text-[13px] font-medium text-muted mb-1.5">Date</label>
              <input type="date" value={form.date} onChange={set('date')} className="input" />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[13px] font-medium text-muted mb-1.5">Image *</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={set('image')} className="hidden" />
            <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2 border border-hairline rounded-sm text-[13px] font-medium text-ink transition-colors">
              <Upload size={16} /> Choose Image
            </button>
            {imagePreview && <img src={imagePreview} alt="Preview" className="mt-3 w-full h-48 object-cover rounded-md border border-hairline" />}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="button-secondary px-5 py-2.5 rounded-md text-[14px]">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="button-primary px-6 py-2.5 text-[14px]">
              {loading ? 'Uploading…' : 'Upload Photo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
