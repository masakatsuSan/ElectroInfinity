import { Link } from 'react-router-dom'
import { Image as ImageIcon, Trophy, Rocket, Lock, Clock3 } from 'lucide-react'
import AvatarGuard from './AvatarGuard'

const KIND_META = {
  gallery: {
    label: 'Photo',
    icon: ImageIcon,
    accent: 'from-coral/80 to-coral/40',
    iconBg: 'bg-coral/15 text-coral',
  },
  achievement: {
    label: 'Achievement',
    icon: Trophy,
    accent: 'from-amber-500/80 to-amber-400/40',
    iconBg: 'bg-amber-500/15 text-amber-600',
  },
  project: {
    label: 'Project',
    icon: Rocket,
    accent: 'from-indigo-500/80 to-indigo-400/40',
    iconBg: 'bg-indigo-500/15 text-indigo-600',
  },
}

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'S'
}

export default function PendingTeaserCard({ teaser, variant = 'wide' }) {
  if (!teaser) return null
  const meta = KIND_META[teaser.kind] || KIND_META.gallery
  const Icon = meta.icon

  const uploader = teaser.author || teaser.uploadedBy || {}
  const uploaderId = uploader._id
  const uploaderName = uploader.name || 'Someone'
  const uploaderPhoto = uploader.photo
  const uploaderRole = uploader.role
  const uploaderRoll = uploader.rollNumber

  const title = teaser.title || 'Untitled upload'
  const category = teaser.category
  const createdAt = teaser.createdAt

  const isCompact = variant === 'compact'

  return (
    <Link
      to={uploaderId ? `/profile/${uploaderId}` : '#'}
      className="group block relative overflow-hidden rounded-2xl border border-hairline bg-soft-stone/40 transition-all hover:border-ink/30 hover:shadow-card"
    >
      {/* Faded gradient backdrop hinting at the kind */}
      <div className={`absolute inset-0 bg-gradient-to-br ${meta.accent} opacity-20 pointer-events-none`} aria-hidden />
      <div className="absolute inset-0 backdrop-blur-md pointer-events-none" aria-hidden />

      <div className={`relative p-4 ${isCompact ? 'sm:p-3' : 'sm:p-5'} flex ${isCompact ? 'flex-row items-center gap-3' : 'flex-col gap-4'}`}>
        {/* Media placeholder (blurred) */}
        <div className={`relative ${isCompact ? 'w-16 h-16 shrink-0' : 'w-full aspect-video'} rounded-xl overflow-hidden bg-canvas-parchment border border-hairline`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon size={isCompact ? 22 : 32} className="text-ink-muted-48" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-ink/80 text-white rounded-full p-2 shadow-md">
              <Lock size={isCompact ? 12 : 16} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${meta.iconBg}`}>
              <Icon size={10} />
              {meta.label}
            </span>
            {category && category !== 'project' && (
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-soft-stone text-ink border border-hairline">
                {category}
              </span>
            )}
          </div>

          <p className={`font-display font-semibold text-ink leading-snug line-clamp-2 ${isCompact ? 'text-[14px]' : 'text-[17px] mb-2'}`}>
            {title}
          </p>

          {!isCompact && (
            <div className="flex items-center gap-2 text-[12px] text-ink-muted-80 font-sans">
              <Clock3 size={12} />
              <span>Waiting for approval</span>
            </div>
          )}
        </div>

        {/* Uploader (clickable avatar) */}
        <div className={`flex items-center ${isCompact ? 'gap-2' : 'gap-3 pt-3 border-t border-hairline'}`}>
          <div className={`relative ${isCompact ? 'w-9 h-9' : 'w-10 h-10'} rounded-full overflow-hidden bg-ink/5 border border-hairline shrink-0`}>
            <AvatarGuard className="w-full h-full">
              {uploaderPhoto ? (
                <img src={uploaderPhoto} alt={uploaderName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-display text-[12px] font-bold text-ink-muted-80">
                    {initials(uploaderName)}
                  </span>
                </div>
              )}
            </AvatarGuard>
            {uploaderRole === 'cr' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 font-mono text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500 text-white whitespace-nowrap">
                CR
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className={`font-sans ${isCompact ? 'text-[12px]' : 'text-[13px]'} font-semibold text-ink truncate`}>
              {uploaderName}
            </p>
            {!isCompact && uploaderRoll && (
              <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted-48 truncate">
                {uploaderRoll}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer label for compact variant */}
      {isCompact && (
        <div className="relative px-4 pb-3 -mt-1 flex items-center gap-1.5 text-[11px] text-ink-muted-80 font-sans">
          <Clock3 size={11} />
          <span>Waiting for approval · view profile</span>
        </div>
      )}
    </Link>
  )
}
