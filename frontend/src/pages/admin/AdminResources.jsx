import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getResources, uploadResource, deleteResource } from '../../api/resources'
import { Check } from 'lucide-react'

const TYPES = ['notes','pyq','assignment','lab_manual','syllabus','other']
const SEMS  = [3,4,5,6,7,8]

export default function AdminResources() {
  const qc = useQueryClient()
  const [filterType, setFilterType] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', type: 'notes', semester: '', subject: '' })
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['resources', filterType],
    queryFn: () => getResources(filterType ? { type: filterType } : {}).then(r => r.data),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => deleteResource(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resources'] }),
  })

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
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

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
              <input value={form.subject} onChange={set('subject')} className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="e.g. Power Systems I" />
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
