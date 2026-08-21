import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getLabs, createLab, updateLab, deleteLab } from '../../api/labs'
import { FlaskConical } from 'lucide-react'

const BLANK = { name: '', icon: <FlaskConical size={20} />, desc: '', equip: '' }

export default function AdminLabs() {
  const qc = useQueryClient()
  const [form, setForm] = useState(BLANK)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['labs'],
    queryFn: () => getLabs().then(r => r.data),
  })

  const saveMut = useMutation({
    mutationFn: (payload) => editing ? updateLab(editing._id, payload) : createLab(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['labs'] })
      setForm(BLANK); setEditing(null); setShowForm(false); setError('')
    },
    onError: (err) => setError(err.response?.data?.error || 'Save failed'),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => deleteLab(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['labs'] }),
  })

  const openCreate = () => { setEditing(null); setForm(BLANK); setShowForm(true); setError('') }
  const openEdit = (l) => {
    setEditing(l)
    setForm({ name: l.name || '', icon: l.icon || <FlaskConical size={20} />, desc: l.desc || '', equip: (l.equip || []).join(', ') })
    setShowForm(true); setError('')
  }

  const handleSave = () => {
    if (!form.name) return setError('Lab name is required')
    setError('')
    const payload = {
      name:   form.name.trim(),
      icon:   form.icon || <FlaskConical size={20} />,
      desc:   form.desc.trim(),
      equip:  form.equip ? form.equip.split(',').map(s => s.trim()).filter(Boolean) : [],
    }
    saveMut.mutate(payload)
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const labs = data?.data || []

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="font-display font-semibold text-[28px] tracking-tight text-ink">Department Laboratories</h1>
        <button onClick={() => setShowForm(v => !v)} className="button-primary !px-5 !py-2.5">
          {showForm && !editing ? 'Cancel' : (editing ? 'Edit Form' : '+ New Lab')}
        </button>
      </div>

      {showForm && (
        <div className="border border-divider-soft bg-surface-pearl p-6 mb-8 rounded-xl shadow-sm">
          <h2 className="font-display font-semibold text-[18px] text-ink mb-6">{editing ? 'Edit Laboratory' : 'New Laboratory'}</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Name *</label>
              <input value={form.name} onChange={set('name')} className="input w-full" placeholder="e.g. Power Electronics Lab" />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Icon</label>
              <input value={form.icon} onChange={set('icon')} className="input w-full" placeholder="FlaskConical" />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Description</label>
              <textarea rows={3} value={form.desc} onChange={set('desc')} className="input w-full resize-none"
                placeholder="Five specialized engineering laboratories where students bridge academic theory with circuit hardware, instrumentation, and power testbeds." />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Equipment (comma separated)</label>
              <input value={form.equip} onChange={set('equip')} className="input w-full" placeholder="e.g. Digital Storage Oscillator, Power Analyzer, Function Generator" />
            </div>
          </div>
          {error && <p className="font-sans text-red-500 text-[14px] font-medium mt-4">{error}</p>}
          <button onClick={handleSave} disabled={saveMut.isPending || !form.name} className="button-primary mt-6">
            {saveMut.isPending ? 'Saving…' : (editing ? 'Update Lab' : 'Add Lab')}
          </button>
        </div>
      )}

      {isLoading ? <p className="font-sans text-ink-muted-80 text-[15px]">Loading laboratories…</p>
        : labs.length === 0 ? <p className="font-sans text-ink-muted-80 text-[15px]">No labs added yet. Add one above.</p>
        : (
          <div className="border border-divider-soft bg-surface-pearl rounded-xl overflow-hidden shadow-sm divide-y divide-hairline">
            {labs.map(l => (
              <div key={l._id} className="flex items-center gap-4 px-6 py-4 hover:bg-canvas-parchment transition-colors">
                <div className="w-14 h-14 rounded-22px bg-soft-stone flex items-center justify-center text-[24px] border border-hairline flex-shrink-0 shadow-sm">
                  {l.icon || <FlaskConical size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-semibold text-ink">{l.name}</p>
                  <p className="font-sans text-[13px] text-ink-muted-80 mt-1 line-clamp-2">{l.desc}</p>
                  {l.equip && l.equip.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {l.equip.map(eq => (
                        <span key={eq} className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-soft-stone text-ink border border-hairline">{eq}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => openEdit(l)} className="font-sans text-[13px] font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors px-3 py-1.5 rounded-md">Edit</button>
                  <button onClick={() => { if (window.confirm(`Remove ${l.name}?`)) deleteMut.mutate(l._id) }}
                    className="font-sans text-[13px] font-medium text-red-500/70 hover:text-red-500 transition-colors bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-md">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}