import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAchievements, createAchievement, updateAchievement, deleteAchievement } from '../../api/achievements'
import { Check, X } from 'lucide-react'

const CATS = ['academic', 'sports', 'cultural', 'other']
const BLANK = { title: '', description: '', date: '', category: 'academic', students: '' }

function toDateTimeLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AdminAchievements() {
  const qc = useQueryClient()
  const [form, setForm] = useState(BLANK)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => getAchievements().then(r => r.data),
  })

  const saveMut = useMutation({
    mutationFn: (fd) => editing ? updateAchievement(editing._id, fd) : createAchievement(fd),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['achievements'] })
      setForm(BLANK); setEditing(null); setShowForm(false); setFile(null); setPreview(''); setError('')
    },
    onError: (err) => setError(err.response?.data?.error || 'Save failed'),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => deleteAchievement(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['achievements'] }),
  })

  const openCreate = () => {
    setEditing(null)
    setForm(BLANK)
    setShowForm(true)
    setFile(null)
    setPreview('')
    setError('')
  }

  const openEdit = (a) => {
    setEditing(a)
    setForm({
      title: a.title || '',
      description: a.description || '',
      date: toDateTimeLocal(a.date),
      category: a.category || 'academic',
      students: (a.students || []).join(', ')
    })
    setPreview(a.image || '')
    setShowForm(true)
    setFile(null)
    setError('')
  }

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    setFile(selected)
    if (selected) {
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result)
      reader.readAsDataURL(selected)
    } else {
      setPreview('')
    }
  }

  const handleSave = () => {
    if (!form.title) return setError('Title is required')
    setError('')

    const fd = new FormData()
    fd.append('title', form.title.trim())
    fd.append('description', form.description.trim())
    fd.append('date', form.date)
    fd.append('category', form.category)
    fd.append('students', form.students)
    if (file) fd.append('image', file)

    saveMut.mutate(fd)
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const achievements = data?.data || []

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="font-display font-semibold text-[28px] tracking-tight text-ink">Achievements</h1>
        <button onClick={() => setShowForm(v => !v)} className="button-primary !px-5 !py-2.5">
          {showForm && !editing ? 'Cancel' : (editing ? 'Edit Form' : '+ New Achievement')}
        </button>
      </div>

      {showForm && (
        <div className="border border-divider-soft bg-surface-pearl p-6 mb-8 rounded-xl shadow-sm">
          <h2 className="font-display font-semibold text-[18px] text-ink mb-6">{editing ? 'Edit Achievement' : 'Add Achievement'}</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Title *</label>
              <input value={form.title} onChange={set('title')} className="input w-full" placeholder="e.g. National Robotics Championship Winner" />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Description</label>
              <textarea rows={3} value={form.description} onChange={set('description')} className="input w-full resize-none"
                placeholder="Describe the achievement..." />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Date</label>
              <input type="datetime-local" value={form.date} onChange={set('date')} className="input w-full" />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Category</label>
              <select value={form.category} onChange={set('category')} className="input w-full">
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Students (comma separated)</label>
              <input value={form.students} onChange={set('students')} className="input w-full" placeholder="e.g. John Doe, Jane Smith" />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Image</label>
              <input type="file" accept="image/*" onChange={handleFileChange}
                className="mt-1 font-sans text-[14px] text-ink-muted-80 file:mr-4 file:bg-canvas-parchment file:text-ink file:border file:border-divider-soft file:rounded-lg file:px-4 file:py-2 file:cursor-pointer" />
              {preview && (
                <div className="mt-3 relative inline-block">
                  <img src={preview} alt="Preview" className="h-32 w-auto rounded-lg border border-divider-soft object-cover" />
                  <button
                    type="button"
                    onClick={() => { setFile(null); setPreview('') }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              {editing && !file && preview && (
                <p className="font-sans text-[12px] text-ink-muted-80 mt-2">Existing image retained — upload a new file to replace.</p>
              )}
            </div>
          </div>
          {error && <p className="font-sans text-red-500 text-[14px] font-medium mt-4">{error}</p>}
          <button onClick={handleSave} disabled={saveMut.isPending || !form.title} className="button-primary mt-6">
            {saveMut.isPending ? 'Saving…' : (editing ? 'Update Achievement' : 'Add Achievement')}
          </button>
        </div>
      )}

      {isLoading ? <p className="font-sans text-ink-muted-80 text-[15px]">Loading achievements…</p>
        : achievements.length === 0 ? <p className="font-sans text-ink-muted-80 text-[15px]">No achievements yet. Add one above.</p>
        : (
          <div className="border border-divider-soft bg-surface-pearl rounded-xl overflow-hidden shadow-sm divide-y divide-hairline">
            {achievements.map(a => (
              <div key={a._id} className="flex items-center gap-4 px-6 py-4 hover:bg-canvas-parchment transition-colors">
                {a.image ? (
                  <img src={a.image} alt={a.title} className="w-16 h-16 rounded-lg object-cover border border-hairline flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-soft-stone flex items-center justify-center text-[24px] border border-hairline flex-shrink-0">🏆</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-semibold text-ink">{a.title}</p>
                  <p className="font-sans text-[13px] text-ink-muted-80 mt-1 line-clamp-2">{a.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate">{a.category}</span>
                    {a.date && (
                      <span className="font-mono text-[11px] text-ink-muted-80">{new Date(a.date).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => openEdit(a)} className="font-sans text-[13px] font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors px-3 py-1.5 rounded-md">Edit</button>
                  <button onClick={() => { if (window.confirm(`Remove ${a.title}?`)) deleteMut.mutate(a._id) }}
                    className="font-sans text-[13px] font-medium text-red-500/70 hover:text-red-500 transition-colors bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-md">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}