import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Trash2, Pencil, Plus, ExternalLink, ChevronDown } from 'lucide-react'
import { getYTLectures, createYTLecture, updateYTLecture, deleteYTLecture } from '../../api/ytLectures'
import { getSubjects } from '../../api/subjects'

const SEMS = [1,2,3,4,5,6,7,8]

function FilterSelect({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false)
  const ref = useState(null)
  const selected = options.find(o => o.value === value)

  const handleSelect = (option) => {
    onChange(option.value)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`
          flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[14px] font-sans
          transition-all duration-150 cursor-pointer select-none
          ${open
            ? 'border-primary ring-1 ring-primary bg-soft-stone/40'
            : 'border-hairline bg-canvas text-ink hover:border-ink/30 hover:shadow-sm'
          }
        `}
      >
        <span className={!value ? 'text-body-muted' : 'text-ink'}>{selected?.label || placeholder}</span>
        <ChevronDown
          size={16}
          className={`text-slate transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full min-w-[220px] bg-white border border-hairline rounded-xl shadow-lg py-1.5 animate-in fade-in duration-150 origin-top">
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option)}
              className={`
                w-full text-left px-4 py-2 text-[14px] font-sans transition-colors
                ${option.value === value
                  ? 'bg-primary text-white'
                  : 'text-ink hover:bg-soft-stone'
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminYTLectures() {
  const qc = useQueryClient()
  const [filterSemester, setFilterSemester] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState({ title: '', lectureNumber: '', youtubeUrl: '', semester: '', subject: '' })
  const [editForm, setEditForm] = useState({ title: '', lectureNumber: '', youtubeUrl: '', semester: '', subject: '' })
  const [error, setError] = useState('')
  const [editError, setEditError] = useState('')
  const [saving, setSaving] = useState(false)
  const [editSaving, setEditSaving] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['yt-lectures', filterSemester],
    queryFn: () => getYTLectures(filterSemester ? { semester: Number(filterSemester) } : {}).then(r => r.data),
  })

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => getSubjects({ status: 'approved' }).then(r => r.data),
  })
  const subjects = subjectsData?.data || []

  const deleteMut = useMutation({
    mutationFn: (id) => deleteYTLecture(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['yt-lectures'] })
    },
    onError: (err) => setError(err.response?.data?.error || 'Delete failed'),
  })

  const editMut = useMutation({
    mutationFn: ({ id, data }) => updateYTLecture(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['yt-lectures'] })
      setEditingId(null)
      setEditForm({ title: '', lectureNumber: '', youtubeUrl: '', semester: '', subject: '' })
      setEditSaving(false)
      setEditError('')
    },
    onError: (err) => {
      setEditError(err.response?.data?.error || 'Update failed')
      setEditSaving(false)
    },
  })

  const createMut = useMutation({
    mutationFn: (data) => createYTLecture(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['yt-lectures'] })
      setForm({ title: '', lectureNumber: '', youtubeUrl: '', semester: '', subject: '' })
      setShowForm(false)
      setError('')
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Create failed')
      setSaving(false)
    },
  })

  const handleCreate = () => {
    if (!form.title || !form.lectureNumber || !form.youtubeUrl) {
      return setError('Title, lecture number, and YouTube URL are required')
    }
    setSaving(true)
    setError('')
    createMut.mutate({
      title: form.title,
      lectureNumber: form.lectureNumber,
      youtubeVideoId: form.youtubeUrl,
      semester: form.semester || undefined,
      subject: form.subject || undefined,
    })
  }

  const handleEdit = () => {
    if (!editForm.title || !editForm.lectureNumber || !editForm.youtubeUrl) {
      return setEditError('Title, lecture number, and YouTube URL are required')
    }
    setEditSaving(true)
    setEditError('')
    editMut.mutate({
      id: editingId,
      data: {
        title: editForm.title,
        lectureNumber: editForm.lectureNumber,
        youtubeVideoId: editForm.youtubeUrl,
        semester: editForm.semester || undefined,
        subject: editForm.subject || undefined,
      },
    })
  }

  const openEdit = (l) => {
    setEditingId(l._id)
    setEditForm({
      title: l.title,
      lectureNumber: String(l.lectureNumber),
      youtubeUrl: `https://www.youtube.com/watch?v=${l.youtubeVideoId}`,
      semester: l.semester || '',
      subject: l.subject || '',
    })
    setEditError('')
  }

  const lectures = data?.data || []

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="font-display font-semibold text-[28px] tracking-tight text-ink">YT Lectures</h1>
        <button
          onClick={() => setShowForm(v => !v)}
          className="button-primary !px-5 !py-2.5"
        >
          {showForm ? 'Cancel' : <span className="flex items-center gap-2"><Plus size={16} /> Add Lecture</span>}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="border border-divider-soft bg-surface-pearl p-6 mb-8 rounded-xl shadow-sm">
          <h2 className="font-display font-semibold text-[18px] text-ink mb-6">Add YT Lecture</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Title *</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="e.g. Introduction to Circuit Theory"
              />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Lecture Number *</label>
              <input
                type="number"
                min="1"
                value={form.lectureNumber}
                onChange={e => setForm(f => ({ ...f, lectureNumber: e.target.value }))}
                className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="1"
              />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">YouTube URL *</label>
              <input
                value={form.youtubeUrl}
                onChange={e => setForm(f => ({ ...f, youtubeUrl: e.target.value }))}
                className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Semester</label>
              <select value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))} className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                <option value="">— none —</option>
                {SEMS.map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Subject</label>
              <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                <option value="">— select subject —</option>
                {(form.semester ? subjects.filter(s => s.semester === Number(form.semester)) : subjects).map(s => (
                  <option key={s._id} value={s.name}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
          </div>
          {error && <p className="font-sans text-[14px] font-medium text-red-500 mt-3">{error}</p>}
          <button
            onClick={handleCreate}
            disabled={saving}
            className="button-primary mt-6"
          >
            {saving ? 'Adding…' : 'Add Lecture'}
          </button>
        </div>
      )}

      {/* Edit form */}
      {editingId && (
        <div className="border border-primary/30 bg-surface-pearl p-6 mb-8 rounded-xl shadow-sm">
          <h2 className="font-display font-semibold text-[18px] text-ink mb-6">Edit YT Lecture</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Title *</label>
              <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Lecture Number *</label>
              <input type="number" min="1" value={editForm.lectureNumber} onChange={e => setEditForm(f => ({ ...f, lectureNumber: e.target.value }))} className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">YouTube URL *</label>
              <input value={editForm.youtubeUrl} onChange={e => setEditForm(f => ({ ...f, youtubeUrl: e.target.value }))} className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Semester</label>
              <select value={editForm.semester} onChange={e => setEditForm(f => ({ ...f, semester: e.target.value }))} className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                <option value="">— none —</option>
                {SEMS.map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Subject</label>
              <select value={editForm.subject} onChange={e => setEditForm(f => ({ ...f, subject: e.target.value }))} className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                <option value="">— select subject —</option>
                {(editForm.semester ? subjects.filter(s => s.semester === Number(editForm.semester)) : subjects).map(s => (
                  <option key={s._id} value={s.name}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
          </div>
          {editError && <p className="font-sans text-[14px] font-medium text-red-500 mt-3">{editError}</p>}
          <div className="flex gap-3 mt-6">
            <button onClick={handleEdit} disabled={editSaving} className="button-primary">Save Changes</button>
            <button onClick={() => { setEditingId(null); setEditError('') }} className="font-sans text-[14px] font-medium text-ink-muted-80 px-4 py-2.5 hover:text-ink transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Semester filter for admin */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label className="font-sans text-[13px] font-medium text-ink-muted-80">Filter by Semester:</label>
        <FilterSelect
          value={filterSemester}
          onChange={setFilterSemester}
          options={[{ value: '', label: 'All Semesters' }, ...SEMS.map(s => ({ value: String(s), label: `Semester ${s}` }))]}
          placeholder="All Semesters"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <p className="font-sans text-ink-muted-80 text-[15px]">Loading…</p>
      ) : lectures.length === 0 ? (
        <p className="font-sans text-ink-muted-80 text-[15px]">No YT lectures yet. Add one above.</p>
      ) : (
        <div className="border border-divider-soft bg-surface-pearl rounded-xl overflow-hidden shadow-sm">
          {lectures.map(l => (
            <div key={l._id} className="flex items-center gap-4 px-6 py-4 border-b border-divider-soft last:border-b-0 hover:bg-canvas-parchment transition-colors">
              <span className="font-mono text-[11px] font-bold text-primary uppercase tracking-widest w-20 flex-shrink-0">Lec {l.lectureNumber}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-ink truncate">{l.title}</p>
                <p className="font-sans text-[13px] font-medium text-ink-muted-80 mt-1">
                  {l.semester ? `Sem ${l.semester} · ` : ''}{l.subject || '—'}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0 items-center">
                <a href={`https://www.youtube.com/watch?v=${l.youtubeVideoId}`} target="_blank" rel="noreferrer" className="font-sans text-[13px] font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors px-3 py-1.5 rounded-md flex items-center gap-1">
                  <ExternalLink size={12} /> YouTube
                </a>
                <button onClick={() => openEdit(l)} className="font-sans text-[13px] font-medium text-blue-500/70 hover:text-blue-500 transition-colors bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-md flex items-center gap-1">
                  <Pencil size={12} /> Edit
                </button>
                <button onClick={() => { if (window.confirm('Delete this lecture?')) deleteMut.mutate(l._id) }} className="font-sans text-[13px] font-medium text-red-500/70 hover:text-red-500 transition-colors bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-md flex items-center gap-1">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
