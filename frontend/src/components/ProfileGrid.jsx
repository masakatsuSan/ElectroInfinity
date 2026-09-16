import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Image as ImageIcon, Trophy, Rocket, X, ExternalLink, GitBranch } from 'lucide-react'

const KIND_META = {
  gallery: { label: 'Photo', Icon: ImageIcon, color: 'text-coral', bg: 'bg-coral/10' },
  achievement: { label: 'Achievement', Icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-500/10' },
  project: { label: 'Project', Icon: Rocket, color: 'text-indigo-600', bg: 'bg-indigo-500/10' },
}

function ProfileGridLightbox({ item, onClose }) {
  const meta = KIND_META[item.kind] || KIND_META.gallery
  const Icon = meta.Icon
  const hasImage = !!(item.thumb || item.imageUrl)
  const imageSrc = item.thumb || item.imageUrl || ''
  const dateLabel = item.date ? new Date(item.date).toLocaleDateString() : (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white border border-hairline rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-hairline">
          <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${meta.bg} ${meta.color}`}>
            <Icon size={12} />
            {meta.label}
          </span>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-700" />
          </button>
        </div>

        <div className="aspect-square bg-gray-200">
          {hasImage ? (
            <img src={imageSrc} alt={item.title} className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon size={48} className="text-gray-400" />
            </div>
          )}
        </div>

        <div className="p-5 space-y-3">
          <h3 className="font-display text-[20px] font-bold text-gray-900">{item.title}</h3>
          {item.meta?.description && (
            <p className="font-sans text-[14px] text-gray-600 leading-relaxed">{item.meta.description}</p>
          )}
          <div className="flex items-center justify-between">
            <p className="font-mono text-[12px] text-gray-500">{dateLabel}</p>
            <div className="flex items-center gap-3">
              {item.kind === 'project' && item.meta?.githubLink && (
                <a href={item.meta.githubLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] font-semibold text-ink hover:underline">
                  <GitBranch size={12} /> GitHub
                </a>
              )}
              {item.kind === 'project' && item.meta?.demoLink && (
                <a href={item.meta.demoLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] font-semibold text-ink hover:underline">
                  <ExternalLink size={12} /> Demo
                </a>
              )}
              {item.kind === 'achievement' && item.certificatePdf && (
                <a href={item.certificatePdf} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] font-semibold text-ink hover:underline">
                  <ExternalLink size={12} /> View Certificate
                </a>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function ProfileGrid({ items = [], isOwn, onOpenUpload }) {
  const [lightbox, setLightbox] = useState(null)

  if (!isOwn && items.length === 0) {
    return (
      <div className="py-16 text-center border border-hairline rounded-xl bg-white">
        <p className="font-sans text-[15px] text-gray-500">No posts yet.</p>
      </div>
    )
  }

  if (isOwn && items.length === 0) {
    return (
      <div>
        <div className="py-12 text-center border border-dashed border-hairline rounded-xl bg-white">
          <p className="font-sans text-[15px] text-gray-500 mb-4">You have not posted anything yet.</p>
          {onOpenUpload && (
            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-ink text-white rounded-full text-[13px] font-semibold hover:bg-primary-active transition-colors"
            >
              Upload Your First Post
            </button>
          )}
        </div>
        <AnimatePresence>
          {lightbox && <ProfileGridLightbox item={lightbox} onClose={() => setLightbox(null)} />}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-2">
      {items.map((item) => {
        const meta = KIND_META[item.kind] || KIND_META.gallery
        const Icon = meta.Icon
        const hasImage = !!(item.thumb || item.imageUrl)
        const imageSrc = item.thumb || item.imageUrl || ''

        return (
          <motion.div
            key={`${item.kind}-${item._id}`}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLightbox(item)}
            className="group relative aspect-square bg-gray-200 cursor-pointer overflow-hidden border border-transparent hover:border-hairline transition-colors rounded-lg"
          >
            {hasImage ? (
              <img src={imageSrc} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <Icon size={32} className="text-gray-400" />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider`}>
                <Icon size={10} />
                {meta.label}
              </span>
            </div>

            <div className="absolute inset-x-0 bottom-0 p-2.5 translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
              <p className="font-display text-[13px] font-semibold text-white truncate drop-shadow-sm">{item.title}</p>
              {item.date && (
                <p className="font-mono text-[10px] text-white/80 mt-0.5">{new Date(item.date).toLocaleDateString()}</p>
              )}
            </div>
          </motion.div>
        )
      })}

      <AnimatePresence>
        {lightbox && <ProfileGridLightbox item={lightbox} onClose={() => setLightbox(null)} />}
      </AnimatePresence>
    </div>
  )
}
