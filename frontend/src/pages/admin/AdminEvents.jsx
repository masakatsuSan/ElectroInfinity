import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEvents, createEvent, deleteEvent } from '../../api/events'

const TYPES = ['workshop','seminar','fest','activity','other']
const BLANK  = { title:'', type:'workshop', description:'', date:'', venue:'', registrationLink:'' }

export default function AdminEvents() {
  const qc = useQueryClient()
  const [form, setForm] = useState(BLANK)
  const [banner, setBanner] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['events','admin'],
    queryFn: () => getEvents().then(r => r.data),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => deleteEvent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  })

  const handleCreate = async () => {
    if (!form.title || !form.date) return setError('Title and date are required')
    setError(''); setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k,v]) => { if (v) fd.append(k, v) })
      if (banner) fd.append('banner', banner)
      await createEvent(fd)
      qc.invalidateQueries({ queryKey: ['events'] })
      setForm(BLANK); setBanner(null); setShowForm(false)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create event')
    } finally { setSaving(false) }
  }

  const events = data?.data || []
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const typeColors = { workshop:'text-vs', seminar:'text-green', fest:'text-yellow-400', activity:'text-orange-400', other:'text-dim' }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="font-display font-semibold text-[28px] tracking-tight text-ink">Events</h1>
        <button onClick={() => setShowForm(v => !v)}
          className="button-primary !px-5 !py-2.5">
          {showForm ? 'Cancel' : '+ New Event'}
        </button>
      </div>

      {showForm && (
        <div className="border border-divider-soft bg-surface-pearl p-6 mb-8 rounded-xl shadow-sm">
          <h2 className="font-display font-semibold text-[18px] text-ink mb-6">Create Event</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Title *</label>
              <input value={form.title} onChange={set('title')} className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="e.g. Workshop on Smart Grid Technologies" />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Type</label>
              <select value={form.type} onChange={set('type')} className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Date *</label>
              <input type="datetime-local" value={form.date} onChange={set('date')} className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Venue</label>
              <input value={form.venue} onChange={set('venue')} className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="e.g. EE Seminar Hall" />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Registration Link</label>
              <input value={form.registrationLink} onChange={set('registrationLink')} className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="https://..." />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Description</label>
              <textarea rows={3} value={form.description} onChange={set('description')} className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none" placeholder="Event details..." />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Banner Image (optional)</label>
              <input type="file" accept="image/*" onChange={e => setBanner(e.target.files[0])}
                className="mt-1 font-sans text-[14px] text-ink-muted-80 file:mr-4 file:bg-canvas-parchment file:text-ink file:border file:border-divider-soft file:rounded-lg file:px-4 file:py-2 file:cursor-pointer" />
            </div>
          </div>
          {error && <p className="font-sans text-red-500 text-[14px] font-medium mt-4">{error}</p>}
          <button onClick={handleCreate} disabled={saving || !form.title || !form.date}
            className="button-primary mt-6">
            {saving ? 'Saving…' : 'Create Event'}
          </button>
        </div>
      )}

      {isLoading ? <p className="font-sans text-ink-muted-80 text-[15px]">Loading…</p>
      : events.length === 0 ? <p className="font-sans text-ink-muted-80 text-[15px]">No events yet. Create one above.</p>
      : (
        <div className="border border-divider-soft bg-surface-pearl rounded-xl overflow-hidden shadow-sm">
          {events.map(e => {
            const upcoming = new Date(e.date) > new Date()
            return (
              <div key={e._id} className={`flex items-start gap-4 px-6 py-4 border-b border-divider-soft last:border-b-0 hover:bg-canvas-parchment transition-colors ${!upcoming ? 'opacity-60' : ''}`}>
                <span className={`font-sans text-[11px] font-semibold uppercase tracking-widest w-20 flex-shrink-0 pt-0.5 text-primary`}>{e.type}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium text-ink truncate">{e.title}</p>
                  <p className="font-sans text-[13px] font-medium text-ink-muted-80 mt-1">
                    {new Date(e.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                    {e.venue ? ` · ${e.venue}` : ''}
                    {upcoming ? ' · Upcoming' : ' · Past'}
                  </p>
                </div>
                <button onClick={() => { if (window.confirm(`Delete "${e.title}"?`)) deleteMut.mutate(e._id) }}
                  className="font-sans text-[13px] font-medium text-red-500/70 hover:text-red-500 transition-colors flex-shrink-0 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-md">Delete</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
