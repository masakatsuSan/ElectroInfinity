import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Image as ImageIcon, Rocket, Trophy, Trash2 } from 'lucide-react'
import { getMyUploads } from '../api/profile'
import { deleteGalleryPhoto } from '../api/gallery'
import { deleteAchievement } from '../api/achievements'
import { deleteProject } from '../api/projects'
import ImageGuard from './ImageGuard'

const FILTERS = [
  { key: 'all', label: 'All' },
]

const KIND_META = {
  gallery: { label: 'Photo', icon: ImageIcon, color: 'text-coral', bg: 'bg-coral/10' },
  achievement: { label: 'Achievement', icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-500/10' },
  project: { label: 'Project', icon: Rocket, color: 'text-indigo-600', bg: 'bg-indigo-500/10' },
}

function UploadRow({ item, onDelete, deleting }) {
  const meta = KIND_META[item.kind] || KIND_META.gallery
  const Icon = meta.icon
  const dateLabel = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''

  return (
    <div className="flex items-start gap-4 p-4 border border-hairline bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-200 border border-hairline shrink-0">
        {item.thumb ? (
          <ImageGuard className="w-full h-full">
            <img src={item.thumb} alt={item.title} className={`w-full h-full object-cover`} />
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
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-hairline">
              {item.category}
            </span>
          )}
        </div>
        <p className="font-display text-[16px] font-semibold text-gray-900 leading-snug line-clamp-1 mb-1">
          {item.title}
        </p>
        {item.meta?.description && (
          <p className="font-sans text-[13px] text-gray-500 line-clamp-2">{item.meta.description}</p>
        )}
        <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-gray-400">
          Uploaded {dateLabel}
        </p>
      </div>

      <div className="flex flex-col gap-2 shrink-0">
        <button
          onClick={() => onDelete(item)}
          disabled={deleting}
          className="px-3 py-1.5 text-[12px] font-semibold rounded-lg border border-hairline text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
        >
          <Trash2 size={12} /> Delete
        </button>
      </div>
    </div>
  )
}

export default function MyUploadsSection({ enabled }) {
  const qc = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['myUploads'],
    queryFn: () => getMyUploads().then((r) => r.data),
    enabled,
  })

  const allItems = data?.data || []

  const deleteMut = useMutation({
    mutationFn: async (item) => {
      if (item.kind === 'gallery') return deleteGalleryPhoto(item._id)
      if (item.kind === 'achievement') return deleteAchievement(item._id)
      return deleteProject(item._id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['myUploads'] }),
  })

  if (!enabled) return null

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-gray-200 animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="border border-hairline bg-white rounded-xl p-8 text-center">
        <p className="font-sans text-[15px] text-gray-500">Failed to load your uploads.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-[24px] font-bold text-gray-900">My Uploads</h2>
        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-gray-500">
          {allItems.length} total
        </span>
      </div>

      {allItems.length === 0 ? (
        <div className="border border-dashed border-hairline bg-white rounded-xl p-12 text-center">
          <p className="font-sans text-[15px] text-gray-500">
            You have not uploaded anything yet. Try uploading a photo, project, or achievement from the relevant page.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {allItems.map((item) => (
            <UploadRow
              key={`${item.kind}-${item._id}`}
              item={item}
              deleting={deleteMut.isPending}
              onDelete={(it) => {
                if (window.confirm(`Remove "${it.title}"? This cannot be undone.`)) deleteMut.mutate(it)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
