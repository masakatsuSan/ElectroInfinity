import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getGallery, createGalleryPhoto } from '../api/gallery'
import { useAuth } from '../context/AuthContext'
import SEO from '../components/SEO'
import ImageGuard from '../components/ImageGuard'
import { Plus, X, Upload } from 'lucide-react'

const CATEGORIES = ['All', 'Workshops', 'Events', 'Lab', 'Campus']

export default function Gallery() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [active, setActive] = useState('All')
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [showUpload, setShowUpload] = useState(false)
  const [showPending, setShowPending] = useState(false)

  const isReviewer = user && (user.role === 'admin' || user.role === 'super_admin' || user.role === 'cr')

  const { data, isLoading } = useQuery({
    queryKey: ['gallery', showPending],
    queryFn: () => getGallery(showPending ? { pending: 'true' } : {}).then(r => r.data),
  })

  const GALLERY = (data?.data || []).map(p => ({
    _id: p._id,
    url: `/api/gallery/${p._id}/image`,
    label: p.title,
    category: p.category
      ? p.category.charAt(0).toUpperCase() + p.category.slice(1)
      : 'Campus',
    isApproved: p.isApproved,
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
    <div className="min-h-screen bg-canvas text-ink pt-36 pb-28">
      <SEO title="Gallery | Electro Infinity" description="Visual archive of Electro Infinity workshops, events, lab sessions, and campus life." />

      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <span className="font-mono text-[12px] uppercase tracking-wider text-coral font-semibold block mb-2">
            Visual Archive
          </span>
          <h1 className="font-display text-[40px] md:text-[56px] font-normal tracking-tight text-ink mb-4">
            Department Gallery
          </h1>
          <p className="font-sans text-[17px] text-body-muted leading-relaxed">
            Moments from hands-on laboratory sessions, technical symposiums, robotic competitions, and student projects.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 border-b border-hairline w-full sm:w-auto">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setActive(c)}
                className={`font-sans text-[14px] font-semibold px-5 py-2 rounded-full transition-all whitespace-nowrap ${
                  active === c
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-soft-stone text-body-muted hover:text-ink'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {isReviewer && (
              <button
                onClick={() => setShowPending(!showPending)}
                className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-colors ${
                  showPending
                    ? 'bg-coral text-white'
                    : 'bg-soft-stone text-ink hover:bg-soft-stone/80'
                }`}
              >
                {showPending ? 'Showing Pending' : 'Pending Review'}
              </button>
            )}
            {user && (
              <button
                onClick={() => setShowUpload(true)}
                className="inline-flex items-center gap-2 bg-ink text-canvas px-5 py-2.5 rounded-full text-[14px] font-semibold hover:bg-ink/90 transition-colors shadow-sm"
              >
                <Plus size={16} />
                Upload Photo
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-video rounded-22px border border-hairline bg-soft-stone/40 animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedIndex(i)}
                className="aspect-video relative overflow-hidden group rounded-22px border border-hairline shadow-card block w-full text-left"
              >
                <ImageGuard className="w-full h-full">
                  <img
                    src={img.url}
                    alt={img.label}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </ImageGuard>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-4">
                  <p className="font-sans text-[13px] font-semibold text-white">
                    {img.label}
                  </p>
                </div>
                {!img.isApproved && (
                  <div className="absolute top-3 right-3 bg-coral text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md">
                    Pending
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="border border-hairline bg-soft-stone rounded-2xl p-16 text-center">
            <span className="font-mono text-[12px] font-bold uppercase tracking-wider text-slate block mb-2">
              No Photos
            </span>
            <p className="font-sans text-[15px] text-body-muted">
              No photos currently uploaded in this category.
            </p>
          </div>
        )}

        {selectedIndex !== null && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedIndex(null)
            }}
          >
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute top-4 right-4 text-white text-3xl font-bold z-10"
              aria-label="Close"
            >
              ×
            </button>

            <button
              onClick={() => setSelectedIndex((selectedIndex - 1 + filtered.length) % filtered.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl font-bold z-10 bg-black/30 rounded-full w-12 h-12 flex items-center justify-center"
              aria-label="Previous"
            >
              ‹
            </button>

            <button
              onClick={() => setSelectedIndex((selectedIndex + 1) % filtered.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl font-bold z-10 bg-black/30 rounded-full w-12 h-12 flex items-center justify-center"
              aria-label="Next"
            >
              ›
            </button>

            <img
              src={filtered[selectedIndex].url}
              alt={filtered[selectedIndex].label}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-canvas text-ink border border-divider-soft rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-divider-soft flex items-center justify-between">
          <div>
            <h3 className="font-display text-[22px] font-bold">Upload Photo</h3>
            <p className="font-sans text-[13px] text-body-muted">
              Share a moment with the department. Photos require admin approval.
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-soft-stone border border-hairline flex items-center justify-center hover:bg-soft-stone/80 transition-colors">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          <div>
            <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Title *</label>
            <input required value={form.title} onChange={set('title')} placeholder="e.g. Lab Workshop 2024" className="w-full bg-white border border-divider-soft rounded-xl px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Category</label>
              <select value={form.category} onChange={set('category')} className="w-full bg-white border border-divider-soft rounded-xl px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary">
                <option value="campus">Campus</option>
                <option value="event">Event</option>
                <option value="lab">Lab</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Date</label>
              <input type="date" value={form.date} onChange={set('date')} className="w-full bg-white border border-divider-soft rounded-xl px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div>
            <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Image *</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={set('image')} className="hidden" />
            <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2 border border-divider-soft rounded-xl text-[13px] font-semibold hover:bg-soft-stone/50 transition-colors">
              <Upload size={16} /> Choose Image
            </button>
            {imagePreview && <img src={imagePreview} alt="Preview" className="mt-3 w-full h-48 object-cover rounded-xl" />}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-[14px] font-semibold text-slate hover:text-ink transition-colors">
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
