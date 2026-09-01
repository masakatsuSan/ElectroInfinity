import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCalendarEntries, createCalendarEntry, updateCalendarEntry, deleteCalendarEntry } from '../../api/calendar'
import { Plus, Edit2, Trash2 } from 'lucide-react'

const TYPES = ['exam', 'holiday', 'registration', 'deadline', 'event', 'other']
const BLANK = { title: '', date: '', type: 'event', description: '', batch: '' }

function toDateTimeLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const TYPE_COLORS = {
  exam: 'bg-red-50 text-red-600 border-red-100',
  holiday: 'bg-green-50 text-green-600 border-green-100',
  registration: 'bg-blue-50 text-blue-600 border-blue-100',
  deadline: 'bg-yellow-50 text-yellow-600 border-yellow-100',
  event: 'bg-purple-50 text-purple-600 border-purple-100',
  other: 'bg-soft-stone text-ink-muted-80 border-hairline',
}

export default function AdminCalendar() {
  const qc = useQueryClient()
  const [form, setForm] = useState(BLANK)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['calendar', 'admin'],
    queryFn: () => getCalendarEntries({ limit: 100 }).then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: (d) => createCalendarEntry(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar'] })
      setForm(BLANK); setEditing(null); setShowForm(false); setError('')
    },
    onError: (err) => setError(err.response?.data?.error || 'Save failed'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, ...d }) => updateCalendarEntry(id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar'] })
      setEditing(null); setShowForm(false); setError('')
    },
    onError: (err) => setError(err.response?.data?.error || 'Save failed'),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => deleteCalendarEntry(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar'] }),
    onError: (err) => setError(err.response?.data?.error || 'Delete failed'),
  })

  const handleSave = () => {
    if (!form.title || !form.date) return setError('Title and date are required')
    setError('')
    if (editing) {
      updateMut.mutate({ id: editing._id, ...form })
    } else {
      createMut.mutate(form)
    }
  }

  const openCreate = () => { setEditing(null); setForm(BLANK); setShowForm(true); setError('') }
  const openEdit = (c) => {
    setEditing(c)
    setForm({ title: c.title || '', date: toDateTimeLocal(c.date), type: c.type || 'event', description: c.description || '', batch: c.batch || '' })
    setShowForm(true); setError('')
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const entries = (data?.data || []).sort((a, b) => new Date(a.date) - new Date(b.date))

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="font-display font-semibold text-[28px] tracking-tight text-ink">Calendar</h1>
        <button onClick={openCreate} className="button-primary !px-5 !py-2.5">
          {editing ? 'Edit Form' : '+ New Entry'}
        </button>
      </div>

      {showForm && (
        <div className="border border-divider-soft bg-surface-pearl p-6 mb-8 rounded-xl shadow-sm">
          <h2 className="font-display font-semibold text-[18px] text-ink mb-6">{editing ? 'Edit Entry' : 'New Calendar Entry'}</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Title *</label>
              <input value={form.title} onChange={set('title')} className="input w-full" placeholder="e.g. Mid-semester Examination" />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Date *</label>
              <input type="datetime-local" value={form.date} onChange={set('date')} className="input w-full" />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Type</label>
              <select value={form.type} onChange={set('type')} className="input w-full">
                {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Batch</label>
              <input value={form.batch} onChange={set('batch')} className="input w-full" placeholder="e.g. 2024-2028" />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Description</label>
              <textarea rows={3} value={form.description} onChange={set('description')} className="input w-full resize-none" placeholder="Details..." />
            </div>
          </div>
          {error && <p className="font-sans text-red-500 text-[14px] font-medium mt-4">{error}</p>}
          <div className="flex gap-3 mt-6">
            <button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending || !form.title || !form.date} className="button-primary">
              {createMut.isPending || updateMut.isPending ? 'Saving…' : (editing ? 'Update Entry' : 'Create Entry')}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); setForm(BLANK); setError('') }} className="button-pill-outline">Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? <p className="font-sans text-ink-muted-80 text-[15px]">Loading calendar…</p>
        : entries.length === 0 ? <p className="font-sans text-ink-muted-80 text-[15px]">No calendar entries. Create one above.</p>
        : (
          <div className="border border-divider-soft bg-surface-pearl rounded-xl overflow-hidden shadow-sm">
            {entries.map(e => (
              <div key={e._id} className="flex items-start gap-4 px-4 sm:px-6 py-3 sm:py-4 border-b border-divider-soft last:border-b-0 hover:bg-canvas-parchment transition-colors">
                <span className={`font-mono text-[11px] font-bold uppercase px-2.5 py-1 rounded-md border flex-shrink-0 ${TYPE_COLORS[e.type] || TYPE_COLORS.other}`}>
                  {e.type}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium text-ink">{e.title}</p>
                  <p className="font-sans text-[13px] text-ink-muted-80 mt-1">
                    {new Date(e.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                    {e.batch ? ` · ${e.batch}` : ''}
                  </p>
                  {e.description && <p className="font-sans text-[13px] text-ink-muted-80 mt-1 line-clamp-2">{e.description}</p>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(e)} className="p-1.5 rounded-md text-ink-muted-80 hover:text-primary hover:bg-primary/10 transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => { if (window.confirm(`Delete "${e.title}"?`)) deleteMut.mutate(e._id) }} className="p-1.5 rounded-md text-ink-muted-80 hover:text-red-500 hover:bg-red-500/10 transition-colors">
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
