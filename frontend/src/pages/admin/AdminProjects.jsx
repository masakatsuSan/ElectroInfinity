import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProjects, deleteProject } from '../../api/projects'
import { X, ExternalLink } from 'lucide-react'

export default function AdminProjects() {
  const qc = useQueryClient()
  const [error, setError] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['projects', 'admin'],
    queryFn: () => getProjects({ limit: 100 }).then(r => r.data),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => deleteProject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
    onError: (err) => setError(err.response?.data?.error || 'Delete failed'),
  })

  const projects = data?.data || []

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="font-[Inter,system-ui,sans-serif] font-semibold text-[28px] tracking-tight text-ink">Projects</h1>
      </div>

      {error && <p className="font-[Inter,system-ui,sans-serif] text-red-500 text-[14px] font-medium mb-4">{error}</p>}

      {isLoading ? <p className="font-[Inter,system-ui,sans-serif] text-ink-muted-80 text-[15px]">Loading projects…</p>
        : projects.length === 0 ? <p className="font-[Inter,system-ui,sans-serif] text-ink-muted-80 text-[15px]">No projects yet.</p>
        : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {projects.map(p => (
              <div key={p._id} className="border border-divider-soft bg-white rounded-xl p-5 shadow-sm hover:border-primary/30 transition-colors flex flex-col">
                <div className="mb-2">
                  <h3 className="text-[15px] font-semibold text-ink line-clamp-2 pr-2">{p.title}</h3>
                </div>
                <p className="font-[Inter,system-ui,sans-serif] text-[13px] text-ink-muted-80 mb-3">by {p.author?.name || p.author?.email || 'Unknown'}</p>
                {p.description && <p className="font-[Inter,system-ui,sans-serif] text-[14px] text-ink-muted-80 line-clamp-2 mb-3">{p.description}</p>}
                {p.techStack?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {p.techStack.map((t, i) => (
                      <span key={i} className="font-mono text-[11px] font-medium text-ink bg-soft-stone border border-hairline px-2 py-0.5 rounded-md">{t}</span>
                    ))}
                  </div>
                )}
                {p.liveUrl && (
                  <a href={p.liveUrl} target="_blank" rel="noreferrer" className="font-[Inter,system-ui,sans-serif] text-[13px] font-medium text-primary hover:no-underline mb-4 inline-flex items-center gap-1">
                    <ExternalLink size={12} /> Live Demo
                  </a>
                )}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-divider-soft">
                  <span className="font-mono text-[11px] text-slate">{new Date(p.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</span>
                  <button onClick={() => { if (window.confirm(`Delete "${p.title}"?`)) deleteMut.mutate(p._id) }} className="font-[Inter,system-ui,sans-serif] text-[13px] font-medium text-red-500/70 hover:text-red-500 transition-colors bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-md inline-flex items-center gap-1">
                    <X size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}

