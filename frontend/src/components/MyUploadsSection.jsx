import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Clock3, XCircle, Filter, Image as ImageIcon, Rocket, Trophy, Trash2 } from 'lucide-react'
import { getMyUploads } from '../api/profile'
import { patchGalleryPhoto, deleteGalleryPhoto } from '../api/gallery'
import { patchAchievement, deleteAchievement } from '../api/achievements'
import { updateProject, deleteProject } from '../api/projects'
import ImageGuard from './ImageGuard'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
]

const KIND_META = {
  gallery: { label: 'Photo', icon: ImageIcon, color: 'text-coral', bg: 'bg-coral/10' },
  achievement: { label: 'Achievement', icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-500/10' },
  project: { label: 'Project', icon: Rocket, color: 'text-indigo-600', bg: 'bg-indigo-500/10' },
}

function StatusBadge({ status }) {
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-700">
        <CheckCircle2 size={11} /> Approved
      </span>
    )
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-red-500/15 text-red-700">
        <XCircle size={11} /> Rejected
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-amber-500/15 text-amber-700">
      <Clock3 size={11} /> Pending
    </span>
  )
}

function UploadRow({ item, onDelete, onRevert, deleting }) {
  const meta = KIND_META[item.kind] || KIND_META.gallery
  const Icon = meta.icon
  const dateLabel = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''

  return (
    <div className="flex items-start gap-4 p-4 border border-hairline bg-white rounded-2xl">
      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-soft-stone border border-hairline shrink-0">
        {item.thumb ? (
          <ImageGuard className="w-full h-full">
            <img src={item.thumb} alt={item.title} className={`w-full h-full object-cover ${item.status !== 'approved' ? 'opacity-60 grayscale' : ''}`} />
          </ImageGuard>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon size={22} className={meta.color} />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
            <Icon size={10} />
            {meta.label}
          </span>
          {item.category && item.category !== 'project' && (
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-soft-stone text-ink border border-hairline">
              {item.category}
            </span>
          )}
          <StatusBadge status={item.status} />
        </div>
        <p className="font-display text-[16px] font-semibold text-ink leading-snug line-clamp-1 mb-1">
          {item.title}
        </p>
        {item.meta?.description && (
          <p className="font-sans text-[13px] text-body-muted line-clamp-2">{item.meta.description}</p>
        )}
        {item.status === 'rejected' && item.rejectionReason && (
          <p className="mt-2 text-[12px] text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            <span className="font-semibold">Reason:</span> {item.rejectionReason}
          </p>
        )}
        <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink-muted-48">
          Submitted {dateLabel}
          {item.approvedAt ? ` · Approved ${new Date(item.approvedAt).toLocaleDateString()}` : ''}
        </p>
      </div>

      <div className="flex flex-col gap-2 shrink-0">
        {item.status === 'rejected' && (
          <button
            onClick={() => onRevert(item)}
            disabled={deleting}
            className="px-3 py-1.5 text-[12px] font-semibold rounded-lg bg-ink text-canvas hover:bg-ink/90 transition-colors disabled:opacity-50"
          >
            Resubmit
          </button>
        )}
        <button
          onClick={() => onDelete(item)}
          disabled={deleting}
          className="px-3 py-1.5 text-[12px] font-semibold rounded-lg border border-hairline text-ink hover:bg-soft-stone transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
        >
          <Trash2 size={12} /> Delete
        </button>
      </div>
    </div>
  )
}

export default function MyUploadsSection({ enabled }) {
  const [filter, setFilter] = useState('all')
  const qc = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['myUploads'],
    queryFn: () => getMyUploads().then((r) => r.data),
    enabled,
  })

  const allItems = data?.data || []
  const summary = data?.summary || { total: 0, pending: 0, approved: 0, rejected: 0 }

  const filtered = useMemo(() => {
    if (filter === 'all') return allItems
    return allItems.filter((i) => i.status === filter)
  }, [allItems, filter])

  const deleteMut = useMutation({
    mutationFn: async (item) => {
      if (item.kind === 'gallery') return deleteGalleryPhoto(item._id)
      if (item.kind === 'achievement') return deleteAchievement(item._id)
      return deleteProject(item._id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['myUploads'] }),
  })

  const revertMut = useMutation({
    mutationFn: async (item) => {
      if (item.kind === 'gallery') return patchGalleryPhoto(item._id, { isApproved: false, rejectionReason: '' })
      if (item.kind === 'achievement') return patchAchievement(item._id, { isApproved: false, rejectionReason: '' })
      return updateProject(item._id, { isApproved: false, rejectionReason: '' })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['myUploads'] }),
  })

  if (!enabled) return null

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-soft-stone/60 animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="border border-divider-soft bg-white rounded-2xl p-8 text-center">
        <p className="font-sans text-[15px] text-body-muted">Failed to load your uploads.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-[24px] font-bold text-ink">My Uploads</h2>
        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted-48">
          {summary.total} total
        </span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="border border-amber-100 bg-amber-50/60 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-amber-700 mb-1">
            <Clock3 size={14} />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Pending</span>
          </div>
          <p className="font-display text-[24px] font-bold text-ink">{summary.pending}</p>
        </div>
        <div className="border border-emerald-100 bg-emerald-50/60 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-emerald-700 mb-1">
            <CheckCircle2 size={14} />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Approved</span>
          </div>
          <p className="font-display text-[24px] font-bold text-ink">{summary.approved}</p>
        </div>
        <div className="border border-red-100 bg-red-50/60 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-red-700 mb-1">
            <XCircle size={14} />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Rejected</span>
          </div>
          <p className="font-display text-[24px] font-bold text-ink">{summary.rejected}</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto">
        <Filter size={14} className="text-ink-muted-48 shrink-0" />
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`font-sans text-[12px] font-semibold px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors ${
              filter === f.key ? 'bg-ink text-canvas' : 'bg-soft-stone text-ink hover:bg-soft-stone/80'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed border-divider-soft bg-white rounded-2xl p-12 text-center">
          <p className="font-sans text-[15px] text-body-muted">
            {filter === 'all'
              ? 'You have not uploaded anything yet. Try uploading a photo, project, or achievement from the relevant page.'
              : `No ${filter} uploads.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <UploadRow
              key={`${item.kind}-${item._id}`}
              item={item}
              deleting={deleteMut.isPending || revertMut.isPending}
              onDelete={(it) => {
                if (window.confirm(`Remove "${it.title}"? This cannot be undone.`)) deleteMut.mutate(it)
              }}
              onRevert={(it) => revertMut.mutate(it)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
