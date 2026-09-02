import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getFaculty, createFaculty, updateFaculty, deleteFaculty } from '../../api/faculty'

const BLANK = { name: '', designation: '', qualification: '', specialization: '', email: '', photo: '', isHOD: false }

function initials(name = '') {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function AdminFaculty() {
  const qc = useQueryClient()
  const [form, setForm] = useState(BLANK)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['faculty'],
    queryFn: () => getFaculty().then(r => r.data),
  })

  const saveMut = useMutation({
    mutationFn: (payload) => editing ? updateFaculty(editing._id, payload) : createFaculty(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faculty'] })
      setForm(BLANK); setEditing(null); setShowForm(false); setError('')
    },
    onError: (err) => setError(err.response?.data?.error || 'Save failed'),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => deleteFaculty(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['faculty'] }),
  })

  const openCreate = () => { setEditing(null); setForm(BLANK); setShowForm(true); setError('') }
  const openEdit = (f) => {
    setEditing(f)
    setForm({ name: f.name || '', designation: f.designation || '', qualification: f.qualification || '', specialization: f.specialization || '', email: f.email || '', photo: f.photo || '', isHOD: !!f.isHOD })
    setShowForm(true); setError('')
  }

  const handleSave = () => {
    if (!form.name) return setError('Name is required')
    setError('')
    saveMut.mutate({ ...form, isHOD: !!form.isHOD })
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const faculty = data?.data || []

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="font-display font-semibold text-[28px] tracking-tight text-ink">Faculty Directory</h1>
        <button onClick={() => setShowForm(v => !v)} className="button-primary !px-5 !py-2.5">
          {showForm && !editing ? 'Cancel' : (editing ? 'Edit Form' : '+ New Faculty')}
        </button>
      </div>

      {showForm && (
        <div className="border border-divider-soft bg-white p-6 mb-8 rounded-xl shadow-sm">
          <h2 className="font-display font-semibold text-[18px] text-ink mb-6">{editing ? 'Edit Faculty' : 'New Faculty Member'}</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Name *</label>
              <input value={form.name} onChange={set('name')} className="input w-full" placeholder="e.g. Dr. Priya Sharma" />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Designation *</label>
              <input value={form.designation} onChange={set('designation')} className="input w-full" placeholder="e.g. Associate Professor" />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Qualification</label>
              <input value={form.qualification} onChange={set('qualification')} className="input w-full" placeholder="e.g. Ph.D. (EE)" />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Specialization</label>
              <input value={form.specialization} onChange={set('specialization')} className="input w-full" placeholder="e.g. Power Electronics & Renewable Energy" />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Email</label>
              <input value={form.email} onChange={set('email')} className="input w-full" placeholder="faculty@agemc.edu" />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Photo URL (optional)</label>
              <input value={form.photo} onChange={set('photo')} className="input w-full" placeholder="https://..." />
            </div>
            <div className="flex items-center gap-3 mt-2">
              <input id="isHOD" type="checkbox" checked={!!form.isHOD}
                onChange={e => setForm(f => ({ ...f, isHOD: e.target.checked }))}
                className="h-4 w-4 text-primary focus:ring-primary rounded" />
              <label htmlFor="isHOD" className="font-sans text-[14px] text-ink">Mark as HOD</label>
            </div>
          </div>
          {error && <p className="font-sans text-red-500 text-[14px] font-medium mt-4">{error}</p>}
          <button onClick={handleSave} disabled={saveMut.isPending || !form.name} className="button-primary mt-6">
            {saveMut.isPending ? 'Saving…' : (editing ? 'Update Faculty' : 'Add Faculty')}
          </button>
        </div>
      )}

      {isLoading ? <p className="font-sans text-ink-muted-80 text-[15px]">Loading faculty…</p>
        : faculty.length === 0 ? <p className="font-sans text-ink-muted-80 text-[15px]">No faculty profiles yet. Add one above.</p>
        : (
          <div className="border border-divider-soft bg-white rounded-xl overflow-hidden shadow-sm">
            {faculty.map(f => (
              <div key={f._id} className="flex items-center gap-4 px-4 sm:px-6 py-3 sm:py-4 border-b border-divider-soft last:border-b-0 hover:bg-canvas-parchment transition-colors">
                <div className="w-12 h-12 rounded-22px bg-soft-stone flex items-center justify-center flex-shrink-0 overflow-hidden border border-hairline shadow-sm">
                  {f.photo ? <img src={f.photo} alt={f.name} className="w-full h-full object-cover" />
                    : <span className="font-display font-bold text-[18px] text-ink">{initials(f.name)}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium text-ink flex items-center gap-2">
                    {f.name}
                    {f.isHOD && <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-deep-green text-white">HOD</span>}
                  </p>
                  <p className="font-mono text-[12px] text-slate uppercase tracking-wider">{f.designation}</p>
                  <p className="font-sans text-[13px] text-ink-muted-80 truncate">{f.specialization || f.qualification}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => openEdit(f)} className="font-sans text-[13px] font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors px-3 py-1.5 rounded-md">Edit</button>
                  <button onClick={() => { if (window.confirm(`Remove ${f.name}?`)) deleteMut.mutate(f._id) }}
                    className="font-sans text-[13px] font-medium text-red-500/70 hover:text-red-500 transition-colors bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-md">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}