import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getResources, uploadResource, updateResource, deleteResource } from '../../api/resources'
import { getSubjects } from '../../api/subjects'
import { Check } from 'lucide-react'

const TYPES = ['notes','pyq','assignment','lab_manual','syllabus','other']
const SEMS  = [3,4,5,6,7,8]

export default function AdminResources() {
  const qc = useQueryClient()
  const [filterType, setFilterType] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', type: 'notes', semester: '', subject: '' })
  const [editFile, setEditFile] = useState(null)
  const [editError, setEditError] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [form, setForm] = useState({ title: '', type: 'notes', semester: '', subject: '' })
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['resources', filterType],
    queryFn: () => getResources(filterType ? { type: filterType } : {}).then(r => r.data),
  })

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => getSubjects({ status: 'approved' }).then(r => r.data),
  })
  const subjects = subjectsData?.data || []

  const deleteMut = useMutation({
    mutationFn: (id) => deleteResource(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resources'] }),
  })

  const editMut = useMutation({
    mutationFn: ({ id, fd }) => updateResource(id, fd),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resources'] })
      setEditingId(null)
      setEditForm({ title: '', type: 'notes', semester: '', subject: '' })
      setEditFile(null)
      setEditSaving(false)
    },
  })

  const openEdit = (r) => {
    setEditingId(r._id)
    setEditForm({
      title: r.title,
      type: r.type,
      semester: r.semester || '',
      subject: r.subject || '',
    })
    setEditFile(null)
    setEditError('')
  }

  const handleEditUpdate = () => {
    if (!editForm.title) return setEditError('Title is required')
    setEditSaving(true)
    setEditError('')

    const fd = new FormData()
    fd.append('title', editForm.title)
    fd.append('type', editForm.type)
    if (editForm.semester) fd.append('semester', editForm.semester)
    if (editForm.subject)  fd.append('subject', editForm.subject)
    if (editFile) fd.append('file', editFile)

    editMut.mutate({ id: editingId, fd })
  }

  const handleUpload = async () => {
    if (!file || !form.title) return setError('Title and file are required')
    setError('')
    setUploading(true)

    // Build FormData — this is how we send files + text together
    const fd = new FormData()
    fd.append('file', file)
    fd.append('title', form.title)
    fd.append('type', form.type)
    if (form.semester) fd.append('semester', form.semester)
    if (form.subject)  fd.append('subject', form.subject)

    try {
      await uploadResource(fd)
      qc.invalidateQueries({ queryKey: ['resources'] })
      setForm({ title: '', type: 'notes', semester: '', subject: '' })
      setFile(null)
      setShowForm(false)
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const resources = data?.data || []
  const set = (formKey, k) => (e) => {
    const setter = formKey === 'editForm' ? setEditForm : setForm
    const key = k || formKey
    setter(f => ({ ...f, [key]: e.target.value }))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="font-display font-semibold text-[28px] tracking-tight text-ink">Resources</h1>
        <button
          onClick={() => setShowForm(v => !v)}
          className="button-primary !px-5 !py-2.5"
        >
          {showForm ? 'Cancel' : '+ Upload File'}
        </button>
      </div>

      {/* Edit form */}
      {editingId && (
        <div className="border border-primary/30 bg-surface-pearl p-6 mb-8 rounded-xl shadow-sm">
          <h2 className="font-display font-semibold text-[18px] text-ink mb-6">Edit Resource</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Title *</label>
              <input value={editForm.title} onChange={set('editForm', 'title')} className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Type *</label>
              <select value={editForm.type} onChange={set('editForm', 'type')} className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Semester</label>
              <select value={editForm.semester} onChange={set('editForm', 'semester')} className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                <option value="">— none —</option>
                {SEMS.map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Subject</label>
              <select value={editForm.subject} onChange={set('editForm', 'subject')} className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                <option value="">— select subject —</option>
                {(editForm.semester ? subjects.filter(s => s.semester === Number(editForm.semester)) : subjects).map(s => (
                  <option key={s._id} value={s.name}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Replace file (optional)</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={e => setEditFile(e.target.files[0])}
                className="mt-1 font-sans text-[14px] text-ink-muted-80 file:mr-4 file:bg-canvas-parchment file:text-ink file:border file:border-divider-soft file:rounded-lg file:px-4 file:py-2 file:cursor-pointer"
              />
              {editFile && (
                <p className="font-sans text-[13px] font-medium text-green-500 mt-2 truncate">
                  <Check size={14} /> {editFile.name} ({(editFile.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>
          </div>
          {editError && <p className="font-sans text-[14px] font-medium text-red-500 mt-3">{editError}</p>}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleEditUpdate}
              disabled={editSaving}
              className="button-primary"
            >
              {editSaving ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              onClick={() => { setEditingId(null); setEditError(''); setEditFile(null) }}
              className="font-sans text-[14px] font-medium text-ink-muted-80 px-4 py-2.5 hover:text-ink transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Upload form */}
      {showForm && (
        <div className="border border-divider-soft bg-surface-pearl p-6 mb-8 rounded-xl shadow-sm">
          <h2 className="font-display font-semibold text-[18px] text-ink mb-6">Upload Resource</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Title *</label>
              <input value={form.title} onChange={set('title')} className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="e.g. Power Systems I — Unit 1 Notes" />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Type *</label>
              <select value={form.type} onChange={set('type')} className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Semester</label>
              <select value={form.semester} onChange={set('semester')} className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                <option value="">— none —</option>
                {SEMS.map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Subject</label>
              <select value={form.subject} onChange={set('subject')} className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                <option value="">— select subject —</option>
                {(form.semester ? subjects.filter(s => s.semester === Number(form.semester)) : subjects).map(s => (
                  <option key={s._id} value={s.name}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">File (PDF or image) *</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={e => setFile(e.target.files[0])}
                className="mt-1 font-sans text-[14px] text-ink-muted-80 file:mr-4 file:bg-canvas-parchment file:text-ink file:border file:border-divider-soft file:rounded-lg file:px-4 file:py-2 file:cursor-pointer"
              />
            </div>
          </div>
          {file && (
            <p className="font-sans text-[13px] font-medium text-green-500 mt-3 truncate">
              <Check size={14} /> {file.name} ({(file.size / 1024).toFixed(0)} KB)
            </p>
          )}
          {error && <p className="font-sans text-[14px] font-medium text-red-500 mt-3">{error}</p>}
          <button
            onClick={handleUpload}
            disabled={uploading || !file || !form.title}
            className="button-primary mt-6"
          >
            {uploading ? 'Uploading to Cloudinary…' : 'Upload'}
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-divider-soft mb-6 overflow-x-auto pb-1 scrollbar-none">
        {['', ...TYPES].map(t => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`font-sans text-[14px] font-medium capitalize px-4 py-2 flex-none border-b-2 transition-colors rounded-t-md ${
              filterType === t ? 'text-ink border-primary bg-surface-pearl' : 'text-ink-muted-80 border-transparent hover:text-ink hover:bg-surface-pearl/50'
            }`}
          >
            {t.replace('_', ' ') || 'All'}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <p className="font-sans text-ink-muted-80 text-[15px]">Loading…</p>
      ) : resources.length === 0 ? (
        <p className="font-sans text-ink-muted-80 text-[15px]">No resources yet. Upload one above.</p>
      ) : (
        <div className="border border-divider-soft bg-surface-pearl rounded-xl overflow-hidden shadow-sm">
          {resources.map(r => (
            <div key={r._id} className="flex items-center gap-4 px-6 py-4 border-b border-divider-soft last:border-b-0 hover:bg-canvas-parchment transition-colors">
              <span className="font-sans text-[11px] font-semibold text-primary uppercase tracking-widest w-24 flex-shrink-0">{r.type.replace('_', ' ')}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-ink truncate">{r.title}</p>
                <p className="font-sans text-[13px] font-medium text-ink-muted-80 mt-1">
                  {r.semester ? `Sem ${r.semester} · ` : ''}{r.fileName} · {r.downloadCount} downloads
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0 items-center">
                <a href={r.fileUrl} target="_blank" rel="noreferrer" className="font-sans text-[13px] font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors px-3 py-1.5 rounded-md">View</a>
                <button
                  onClick={() => openEdit(r)}
                  className="font-sans text-[13px] font-medium text-blue-500/70 hover:text-blue-500 transition-colors bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-md"
                >Edit</button>
                <button
                  onClick={() => { if (window.confirm('Delete this file?')) deleteMut.mutate(r._id) }}
                  className="font-sans text-[13px] font-medium text-red-500/70 hover:text-red-500 transition-colors bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-md"
                >Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
