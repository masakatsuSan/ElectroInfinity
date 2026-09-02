import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProjects, updateProject, deleteProject } from '../../api/projects'
import { Check, X, ExternalLink } from 'lucide-react'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
]

export default function AdminProjects() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['projects', 'admin', filter],
    queryFn: () => getProjects({ limit: 100 }).then(r => r.data),
  })

  const approveMut = useMutation({
    mutationFn: (id) => updateProject(id, { isApproved: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
    onError: (err) => setError(err.response?.data?.error || 'Approve failed'),
  })

  const rejectMut = useMutation({
    mutationFn: (id) => updateProject(id, { isApproved: false }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
    onError: (err) => setError(err.response?.data?.error || 'Reject failed'),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => deleteProject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
    onError: (err) => setError(err.response?.data?.error || 'Delete failed'),
  })

  const projects = data?.data || []
  const visible = filter === 'all' ? projects : projects.filter(p => filter === 'approved' ? p.isApproved : !p.isApproved)

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="font-display font-semibold text-[28px] tracking-tight text-ink">Projects</h1>
      </div>

      <div className="flex gap-2 mb-6">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`font-sans text-[14px] font-medium px-4 py-2 rounded-full transition-all whitespace-nowrap ${filter === f.key ? 'bg-primary text-white' : 'bg-soft-stone text-ink-muted-80 hover:text-ink'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="font-sans text-red-500 text-[14px] font-medium mb-4">{error}</p>}

      {isLoading ? <p className="font-sans text-ink-muted-80 text-[15px]">Loading projects…</p>
        : visible.length === 0 ? <p className="font-sans text-ink-muted-80 text-[15px]">No projects match this filter.</p>
        : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {visible.map(p => (
              <div key={p._id} className="border border-divider-soft bg-white rounded-xl p-5 shadow-sm hover:border-primary/30 transition-colors flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-[15px] font-semibold text-ink line-clamp-2 pr-2">{p.title}</h3>
                  <span className={`font-mono text-[11px] font-bold uppercase px-2 py-1 rounded-md flex-shrink-0 ${p.isApproved ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-yellow-50 text-yellow-600 border border-yellow-100'}`}>
                    {p.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </div>
                <p className="font-sans text-[13px] text-ink-muted-80 mb-3">by {p.author?.name || p.author?.email || 'Unknown'}</p>
                {p.description && <p className="font-sans text-[14px] text-ink-muted-80 line-clamp-2 mb-3">{p.description}</p>}
                {p.techStack?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {p.techStack.map((t, i) => (
                      <span key={i} className="font-mono text-[11px] font-medium text-ink bg-soft-stone border border-hairline px-2 py-0.5 rounded-md">{t}</span>
                    ))}
                  </div>
                )}
                {p.liveUrl && (
                  <a href={p.liveUrl} target="_blank" rel="noreferrer" className="font-sans text-[13px] font-medium text-primary hover:underline mb-4 inline-flex items-center gap-1">
                    <ExternalLink size={12} /> Live Demo
                  </a>
                )}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-divider-soft">
                  <span className="font-mono text-[11px] text-slate">{new Date(p.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</span>
                  <div className="flex gap-1">
                    {p.isApproved ? (
                      <button onClick={() => rejectMut.mutate(p._id)} disabled={rejectMut.isPending} className="font-sans text-[13px] font-medium text-yellow-600 bg-yellow-50 hover:bg-yellow-100 transition-colors px-3 py-1.5 rounded-md flex items-center gap-1">
                        <X size={14} /> Reject
                      </button>
                    ) : (
                      <button onClick={() => approveMut.mutate(p._id)} disabled={approveMut.isPending} className="font-sans text-[13px] font-medium text-green-600 bg-green-50 hover:bg-green-100 transition-colors px-3 py-1.5 rounded-md flex items-center gap-1">
                        <Check size={14} /> Approve
                      </button>
                    )}
                    <button onClick={() => { if (window.confirm(`Delete "${p.title}"?`)) deleteMut.mutate(p._id) }} className="font-sans text-[13px] font-medium text-red-500/70 hover:text-red-500 transition-colors bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-md">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}
