import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getGallery } from '../api/gallery'

const CATEGORIES = ['All', 'Workshops', 'Events', 'Lab', 'Campus']

export default function Gallery() {
  const [active, setActive] = useState('All')

  const { data, isLoading } = useQuery({
    queryKey: ['gallery'],
    queryFn: () => getGallery().then(r => r.data),
  })

  const GALLERY = (data?.data || []).map(p => ({ url: p.imageUrl, label: p.title, category: p.category ? p.category.charAt(0).toUpperCase() + p.category.slice(1) : 'Campus' }))
  
  const filtered = GALLERY.filter(g => active === 'All' || g.category === active)

  return (
    <div className="container pt-32 pb-20 min-h-screen bg-canvas text-ink">
      <h2 className="font-sans text-[14px] font-semibold tracking-widest uppercase text-ink-muted-48 mb-2">
        Visual Archive
      </h2>
      <h1 className="font-display font-semibold text-[clamp(40px,8vw,64px)] leading-tight tracking-normal mb-8 text-ink">
        Gallery
      </h1>

      {/* Category filters */}
      <div className="flex gap-2 mb-10 flex-wrap">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setActive(c)}
            className={`font-sans text-[12px] font-semibold uppercase tracking-widest px-5 py-2.5 rounded-full border transition-colors ${
              active === c
                ? 'border-primary text-primary bg-primary/5'
                : 'border-divider-soft text-ink-muted-80 bg-surface-pearl hover:text-ink hover:border-ink-muted-48'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {filtered.map((img, i) => (
            <a key={i} href={img.url} target="_blank" rel="noreferrer"
              className="aspect-video relative overflow-hidden group bg-surface-pearl rounded-lg">
              <img src={img.url} alt={img.label}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/40 transition-colors flex items-end">
                <p className="font-sans text-[12px] font-semibold uppercase tracking-widest text-canvas/0 group-hover:text-canvas p-4 transition-colors">
                  {img.label}
                </p>
              </div>
            </a>
          ))}
        </div>
      ) : (
        // Placeholder grid when no images uploaded yet
        <div className="animate-in fade-in duration-300">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-video bg-surface-pearl rounded-lg border border-divider-soft flex items-center justify-center">
                <div className="text-center flex flex-col items-center opacity-50">
                  <svg className="w-6 h-6 text-ink-muted-48 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="4"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                  </svg>
                  <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-ink-muted-48">Add photo</p>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-surface-pearl border border-divider-soft p-8 rounded-lg mt-8 text-center">
            <p className="font-sans text-[17px] font-semibold text-ink mb-2">No photos yet</p>
            <p className="font-sans text-[14px] text-ink-muted-80 leading-relaxed max-w-lg mx-auto">
              Photos will be updated soon.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
