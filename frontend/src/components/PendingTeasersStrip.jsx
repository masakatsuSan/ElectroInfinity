import { useQuery } from '@tanstack/react-query'
import { Clock3 } from 'lucide-react'
import { getGallery } from '../api/gallery'
import { getAchievements } from '../api/achievements'
import { getProjects } from '../api/projects'
import PendingTeaserCard from './PendingTeaserCard'

function getTeasers(source, kind) {
  if (!source) return []
  const list = source.pendingTeasers || []
  return list
    .filter((t) => (t.kind ? t.kind === kind : true))
    .map((t) => ({ ...t, kind }))
}

export default function PendingTeasersStrip({ sources = {}, title = 'Recent Uploads Awaiting Approval', compact = false, currentUser = null }) {
  const isReviewer = !!currentUser && ['admin', 'super_admin', 'cr', 'faculty'].includes(currentUser.role)

  const allTeasers = [
    ...getTeasers(sources.gallery, 'gallery'),
    ...getTeasers(sources.achievements, 'achievement'),
    ...getTeasers(sources.projects, 'project'),
  ]
    .filter((t) => {
      const uploader = t.author || t.uploadedBy
      if (!uploader) return false
      if (uploader.profileVisibility && uploader.profileVisibility === 'private') return false
      if (!currentUser) return false
      if (isReviewer) return true
      return uploader._id === currentUser._id
    })
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

  if (allTeasers.length === 0) return null

  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 text-ink">
          <Clock3 size={16} className="text-coral" />
          <h2 className="font-display text-[18px] sm:text-[20px] font-bold tracking-tight">{title}</h2>
        </div>
        <div className="flex-1 h-px bg-divider-soft" />
        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted-48">
          {allTeasers.length} pending
        </span>
      </div>
      <div className={`grid gap-4 ${compact ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
        {allTeasers.slice(0, 6).map((t) => (
          <PendingTeaserCard key={`${t.kind}-${t._id}`} teaser={t} variant={compact ? 'compact' : 'wide'} />
        ))}
      </div>
    </section>
  )
}

export function useTeaserSources() {
  const galleryQ = useQuery({
    queryKey: ['gallery-teasers'],
    queryFn: () => getGallery().then((r) => r.data),
    staleTime: 30_000,
  })
  const achievementsQ = useQuery({
    queryKey: ['achievements-teasers'],
    queryFn: () => getAchievements().then((r) => r.data),
    staleTime: 30_000,
  })
  const projectsQ = useQuery({
    queryKey: ['projects-teasers'],
    queryFn: () => getProjects({ limit: 20 }).then((r) => r.data),
    staleTime: 30_000,
  })
  return {
    gallery: galleryQ.data,
    achievements: achievementsQ.data,
    projects: projectsQ.data,
    isLoading: galleryQ.isLoading || achievementsQ.isLoading || projectsQ.isLoading,
  }
}
