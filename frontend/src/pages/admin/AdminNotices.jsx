import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNotices, createNotice, deleteNotice, togglePin } from '../../api/notices'
import { Pin, PinOff } from 'lucide-react'

const CATS = ['general','exam','lab','event','academic','placement']

export default function AdminNotices() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ title: '', body: '', category: 'general' })
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['notices', 'admin'],
    queryFn: () => getNotices({ limit: 50 }).then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: () => createNotice(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notices'] })
      setForm({ title: '', body: '', category: 'general' })
      setShowForm(false)
      setError('')
    },
    onError: (err) => setError(err.response?.data?.error || 'Failed to create notice'),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => deleteNotice(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notices'] }),
  })

  const pinMut = useMutation({
    mutationFn: (id) => togglePin(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notices'] }),
  })

  const notices = data?.data || []

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="font-display font-semibold text-[28px] tracking-tight text-ink">Notices</h1>
        <button
          onClick={() => setShowForm(v => !v)}
          className="button-primary !px-5 !py-2.5"
        >
          {showForm ? 'Cancel' : '+ New Notice'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="border border-divider-soft bg-surface-pearl p-6 mb-8 rounded-xl shadow-sm">
          <h2 className="font-display font-semibold text-[18px] text-ink mb-6">Create Notice</h2>
          <div className="flex flex-col gap-5">
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Title *</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Notice title"
              />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Body (optional)</label>
              <textarea
                rows={3}
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                placeholder="Notice details..."
              />
            </div>
            {error && <p className="font-sans text-red-500 text-[14px] font-medium">{error}</p>}
            <button
              onClick={() => createMut.mutate()}
              disabled={!form.title || createMut.isPending}
              className="button-primary self-start mt-2"
            >
              {createMut.isPending ? 'Posting…' : 'Post Notice'}
            </button>
          </div>
        </div>
      )}

      {/* Notice list */}
      {isLoading ? (
        <p className="font-sans text-ink-muted-80 text-[15px]">Loading…</p>
      ) : notices.length === 0 ? (
        <p className="font-sans text-ink-muted-80 text-[15px]">No notices yet. Create one above.</p>
      ) : (
        <div className="border border-divider-soft bg-surface-pearl rounded-xl overflow-hidden shadow-sm">
          {notices.map(n => (
            <div key={n._id} className="flex items-center gap-4 px-6 py-4 border-b border-divider-soft last:border-b-0 hover:bg-canvas-parchment transition-colors">
              <span className="font-sans text-[11px] font-semibold text-primary uppercase tracking-widest w-20 flex-shrink-0">{n.category}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-ink truncate">{n.title}</p>
                <p className="font-sans text-[13px] font-medium text-ink-muted-80 mt-1 flex items-center gap-2">
                  {new Date(n.createdAt).toLocaleDateString('en-IN')}
                  {n.isPinned && <span className="text-[11px] font-semibold text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-sm">Pinned</span>}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0 items-center">
                <button
                  onClick={() => pinMut.mutate(n._id)}
                  title={n.isPinned ? 'Unpin' : 'Pin'}
                  className={`font-sans text-[18px] transition-colors px-2 py-1 ${n.isPinned ? 'text-primary' : 'text-ink-muted-48 hover:text-primary'}`}
                >
                  {n.isPinned ? <Pin size={16} /> : <PinOff size={16} />}
                </button>
                <button
                  onClick={() => { if (window.confirm('Delete this notice?')) deleteMut.mutate(n._id) }}
                  className="font-sans text-[13px] font-medium text-red-500/70 hover:text-red-500 transition-colors bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-md"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
