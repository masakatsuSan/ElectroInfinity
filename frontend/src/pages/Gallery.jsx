import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getGallery } from '../api/gallery'
import SEO from '../components/SEO'

const CATEGORIES = ['All', 'Workshops', 'Events', 'Lab', 'Campus']

export default function Gallery() {
  const [active, setActive] = useState('All')

  const { data, isLoading } = useQuery({
    queryKey: ['gallery'],
    queryFn: () => getGallery().then(r => r.data),
  })

  const GALLERY = (data?.data || []).map(p => ({
    url: p.imageUrl,
    label: p.title,
    category: p.category
      ? p.category.charAt(0).toUpperCase() + p.category.slice(1)
      : 'Campus',
  }))

  const filtered = GALLERY.filter(g => active === 'All' || g.category === active)

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

        {/* Category filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-10 scrollbar-none border-b border-hairline">
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
              <a
                key={i}
                href={img.url}
                target="_blank"
                rel="noreferrer"
                className="aspect-video relative overflow-hidden group rounded-22px border border-hairline shadow-card block"
              >
                <img
                  src={img.url}
                  alt={img.label}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-4">
                  <p className="font-sans text-[13px] font-semibold text-white">
                    {img.label}
                  </p>
                </div>
              </a>
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
      </div>
    </div>
  )
}
