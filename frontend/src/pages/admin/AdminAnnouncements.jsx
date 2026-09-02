import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../../api/announcements'
import { BATCHES } from '../../data/batches'
import { Edit2, Trash2, Pin, PinOff } from 'lucide-react'

const CATS = ['general', 'academic', 'class', 'exam', 'urgent']
const AUDIENCES = [
  { value: 'all', label: 'All Batches' },
  { value: 'batch', label: 'Specific Batch' },
]
const BLANK = { title: '', content: '', category: 'general', isPinned: false, targetAudience: 'all', batchId: '', expiresAt: '' }

function toDateTimeLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const CAT_COLORS = {
  general: 'bg-soft-stone text-ink-muted-80 border-hairline',
  academic: 'bg-blue-50 text-blue-600 border-blue-100',
  class: 'bg-purple-50 text-purple-600 border-purple-100',
  exam: 'bg-red-50 text-red-600 border-red-100',
  urgent: 'bg-orange-50 text-orange-600 border-orange-100',
}

export default function AdminAnnouncements() {
  const qc = useQueryClient()
  const [form, setForm] = useState(BLANK)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['announcements', 'admin'],
    queryFn: () => getAnnouncements({ limit: 100, includeExpired: true }).then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: (d) => createAnnouncement(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] })
      setForm(BLANK); setEditing(null); setShowForm(false); setError('')
    },
    onError: (err) => setError(err.response?.data?.error || 'Save failed'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, ...d }) => updateAnnouncement(id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] })
      setEditing(null); setShowForm(false); setError('')
    },
    onError: (err) => setError(err.response?.data?.error || 'Save failed'),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => deleteAnnouncement(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
    onError: (err) => setError(err.response?.data?.error || 'Delete failed'),
  })

  const handleSave = () => {
    if (!form.title || !form.content) return setError('Title and content are required')
    if (form.targetAudience === 'batch' && !form.batchId) return setError('Select a target classroom (batch)')
    setError('')
    if (editing) {
      updateMut.mutate({ id: editing._id, ...form })
    } else {
      createMut.mutate(form)
    }
  }

  const openCreate = () => { setEditing(null); setForm(BLANK); setShowForm(true); setError('') }
  const openEdit = (a) => {
    setEditing(a)
    setForm({ title: a.title || '', content: a.content || '', category: a.category || 'general', isPinned: !!a.isPinned, targetAudience: a.targetAudience || 'all', batchId: a.batchId || '', expiresAt: toDateTimeLocal(a.expiresAt) })
    setShowForm(true); setError('')
  }

  const togglePin = (a) => {
    updateAnnouncement(a._id, { isPinned: !a.isPinned }).then(() => qc.invalidateQueries({ queryKey: ['announcements'] }))
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const announcements = (data?.data || []).sort((a, b) => {
    if (a.isPinned !== b.isPinned) return b.isPinned ? 1 : -1
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="font-display font-semibold text-[28px] tracking-tight text-ink">Announcements</h1>
        <button onClick={openCreate} className="button-primary !px-5 !py-2.5">
          + New Announcement
        </button>
      </div>

      {showForm && (
        <div className="border border-divider-soft bg-white p-6 mb-8 rounded-xl shadow-sm">
          <h2 className="font-display font-semibold text-[18px] text-ink mb-6">{editing ? 'Edit Announcement' : 'New Announcement'}</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Title *</label>
              <input value={form.title} onChange={set('title')} className="input w-full" placeholder="Announcement title" />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Content *</label>
              <textarea rows={4} value={form.content} onChange={set('content')} className="input w-full resize-none" placeholder="Full announcement..." />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Category</label>
              <select value={form.category} onChange={set('category')} className="input w-full">
                {CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Target Audience</label>
              <select value={form.targetAudience} onChange={set('targetAudience')} className="input w-full">
                {AUDIENCES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            {form.targetAudience === 'batch' && (
              <div>
                <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Target Classroom *</label>
                <select value={form.batchId} onChange={set('batchId')} className="input w-full">
                  <option value="">Select a batch</option>
                  {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <p className="font-sans text-[12px] text-slate mt-1">Only students of this batch will see the announcement.</p>
              </div>
            )}
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Expires At (optional)</label>
              <input type="datetime-local" value={form.expiresAt} onChange={set('expiresAt')} className="input w-full" />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPinned} onChange={set('isPinned')} className="w-4 h-4 rounded border-divider-soft text-primary focus:ring-primary" />
                <span className="font-sans text-[14px] font-medium text-ink">Pinned</span>
              </label>
            </div>
          </div>
          {error && <p className="font-sans text-red-500 text-[14px] font-medium mt-4">{error}</p>}
          <div className="flex gap-3 mt-6">
            <button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending || !form.title || !form.content} className="button-primary">
              {createMut.isPending || updateMut.isPending ? 'Saving…' : (editing ? 'Update Announcement' : 'Post Announcement')}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); setForm(BLANK); setError('') }} className="button-pill-outline">Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? <p className="font-sans text-ink-muted-80 text-[15px]">Loading announcements…</p>
        : announcements.length === 0 ? <p className="font-sans text-ink-muted-80 text-[15px]">No announcements. Create one above.</p>
        : (
          <div className="border border-divider-soft bg-white rounded-xl overflow-hidden shadow-sm">
            {announcements.map(a => (
              <div key={a._id} className="flex items-start gap-4 px-4 sm:px-6 py-3 sm:py-4 border-b border-divider-soft last:border-b-0 hover:bg-canvas-parchment transition-colors">
                <span className={`font-mono text-[11px] font-bold uppercase px-2.5 py-1 rounded-md border flex-shrink-0 ${CAT_COLORS[a.category] || CAT_COLORS.general}`}>
                  {a.category}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-medium text-ink">{a.title}</p>
                    {a.isPinned && <span className="font-sans text-[11px] font-semibold text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-sm flex items-center gap-1"><Pin size={12} /> Pinned</span>}
                  </div>
                  <p className="font-sans text-[13px] text-ink-muted-80 mt-1 line-clamp-2">{a.content}</p>
                  <p className="font-sans text-[12px] text-slate mt-1.5">
                    {a.targetAudience === 'batch' && a.batchId ? `Target: ${a.batchId}` : 'Target: All Batches'}
                    {a.expiresAt ? ` · Expires ${new Date(a.expiresAt).toLocaleDateString('en-IN')}` : ''}
                    <span className="ml-2">{new Date(a.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</span>
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => togglePin(a)} title={a.isPinned ? 'Unpin' : 'Pin'} className={`p-1.5 rounded-md transition-colors ${a.isPinned ? 'text-primary bg-primary/10' : 'text-ink-muted-80 hover:text-primary hover:bg-primary/10'}`}>
                    {a.isPinned ? <Pin size={16} /> : <PinOff size={16} />}
                  </button>
                  <button onClick={() => openEdit(a)} className="p-1.5 rounded-md text-ink-muted-80 hover:text-primary hover:bg-primary/10 transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => { if (window.confirm(`Delete "${a.title}"?`)) deleteMut.mutate(a._id) }} className="p-1.5 rounded-md text-ink-muted-80 hover:text-red-500 hover:bg-red-500/10 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}