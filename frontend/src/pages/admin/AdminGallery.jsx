import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getGallery, createGalleryPhoto, updateGalleryPhoto, deleteGalleryPhoto } from '../../api/gallery'
import { Check } from 'lucide-react'

const CATS = ['lab', 'event', 'campus', 'other']
const BLANK = { title: '', category: 'campus', date: '', imageUrl: '' }

function toDateTimeLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AdminGallery() {
  const qc = useQueryClient()
  const [form, setForm] = useState(BLANK)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['gallery'],
    queryFn: () => getGallery().then(r => r.data),
  })

  const saveMut = useMutation({
    mutationFn: (fd) => editing ? updateGalleryPhoto(editing._id, fd) : createGalleryPhoto(fd),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gallery'] })
      setForm(BLANK); setEditing(null); setShowForm(false); setFile(null); setError('')
    },
    onError: (err) => setError(err.response?.data?.error || 'Save failed'),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => deleteGalleryPhoto(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gallery'] }),
  })

  const openCreate = () => { setEditing(null); setForm(BLANK); setShowForm(true); setFile(null); setError('') }
  const openEdit = (p) => {
    setEditing(p)
    setForm({ title: p.title || '', category: p.category || 'campus', date: toDateTimeLocal(p.date), imageUrl: p.imageUrl || '' })
    setShowForm(true); setFile(null); setError('')
  }

  const handleSave = () => {
    if (!file && !form.imageUrl) return setError('Select an image file or paste an image URL')
    setError('')
    const fd = new FormData()
    if (file) fd.append('image', file)
    fd.append('title', form.title)
    fd.append('category', form.category)
    if (form.date) fd.append('date', form.date)
    if (form.imageUrl) fd.append('imageUrl', form.imageUrl)
    saveMut.mutate(fd)
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const photos = data?.data || []

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="font-display font-semibold text-[28px] tracking-tight text-ink">Department Gallery</h1>
        <button onClick={() => setShowForm(v => !v)} className="button-primary !px-5 !py-2.5">
          {showForm && !editing ? 'Cancel' : (editing ? 'Edit Form' : '+ New Moment')}
        </button>
      </div>

      {showForm && (
        <div className="border border-divider-soft bg-white p-6 mb-8 rounded-xl shadow-sm">
          <h2 className="font-display font-semibold text-[18px] text-ink mb-6">{editing ? 'Edit Moment' : 'Add Gallery Moment'}</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Title</label>
              <input value={form.title} onChange={set('title')} className="input w-full" placeholder="e.g. Robotics Competition 2026" />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Category</label>
              <select value={form.category} onChange={set('category')} className="input w-full">
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Date</label>
              <input type="datetime-local" value={form.date} onChange={set('date')} className="input w-full" />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Image</label>
              <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])}
                className="mt-1 font-sans text-[14px] text-ink-muted-80 file:mr-4 file:bg-canvas-parchment file:text-ink file:border file:border-divider-soft file:rounded-lg file:px-4 file:py-2 file:cursor-pointer" />
              {editing && !file && form.imageUrl && (
                <p className="font-sans text-[12px] text-ink-muted-80 mt-2">Existing image retained (current URL) — upload a new file to replace.</p>
              )}
            </div>
            {file &&             <p className="font-sans text-[13px] font-medium text-green-500 mt-3"><Check size={14} /> {file.name} ({(file.size / 1024).toFixed(0)} KB)</p>}
          </div>
          {error && <p className="font-sans text-red-500 text-[14px] font-medium mt-4">{error}</p>}
          <button onClick={handleSave} disabled={saveMut.isPending || (!file && !form.imageUrl) || !form.title} className="button-primary mt-6">
            {saveMut.isPending ? 'Saving…' : (editing ? 'Update Moment' : 'Add Moment')}
          </button>
        </div>
      )}

      {isLoading ? <p className="font-sans text-ink-muted-80 text-[15px]">Loading gallery…</p>
        : photos.length === 0 ? <p className="font-sans text-ink-muted-80 text-[15px]">No moments yet. Add one above.</p>
        : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map(p => (
              <div key={p._id} className="border border-hairline rounded-22px overflow-hidden shadow-card bg-canvas group">
                <img src={p.imageUrl} alt={p.title} className="w-full aspect-video object-cover" />
                <div className="p-4">
                  <p className="text-[15px] font-medium text-ink truncate">{p.title || p.category}</p>
                  <p className="font-mono text-[11px] text-slate uppercase mt-1">{p.category}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-canvas-parchment/80 absolute top-2 right-2">
                  <button onClick={() => openEdit(p)} className="font-sans text-[12px] font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors px-2.5 py-1 rounded-md">Edit</button>
                  <button onClick={() => { if (window.confirm('Remove this photo?')) deleteMut.mutate(p._id) }}
                    className="font-sans text-[12px] font-medium text-red-500/70 hover:text-red-500 transition-colors bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 rounded-md">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}