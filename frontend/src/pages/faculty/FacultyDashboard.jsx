import { useState } from 'react'
import { Megaphone, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ProtectedRoute from '../../components/ProtectedRoute'
import { useAuth } from '../../context/AuthContext'
import SEO from '../../components/SEO'
import { getMyAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../../api/announcements'
import { BATCHES } from '../../data/batches'

const CATS = ['general', 'academic', 'class', 'exam', 'urgent']
const BLANK_FORM = { title: '', content: '', category: 'general', batchId: '' }

export default function FacultyDashboard() {
  return (
    <ProtectedRoute role="faculty">
      <FacultyDashboardInner />
    </ProtectedRoute>
  )
}

function FacultyDashboardInner() {
  const qc = useQueryClient()

  const [tab, setTab] = useState('announcements')
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(BLANK_FORM);

  const { data, isLoading } = useQuery({
    queryKey: ['my-announcements'],
    queryFn: () => getMyAnnouncements().then(r => r.data),
    staleTime: 30_000,
  })
  const announcements = data?.data || []

  const resetForm = () => {
    setForm(BLANK_FORM)
    setEditing(null)
    setShowForm(false)
    setError('')
  }

  // Mutations
  const createMut = useMutation({
    mutationFn: (d) => createAnnouncement(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-announcements'] })
      qc.invalidateQueries({ queryKey: ['announcements'] })
      resetForm()
    },
    onError: (err) => setError(err.response?.data?.error || 'Failed to post announcement'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, ...d }) => updateAnnouncement(id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-announcements'] })
      qc.invalidateQueries({ queryKey: ['announcements'] })
      resetForm()
    },
    onError: (err) => setError(err.response?.data?.error || 'Failed to update announcement'),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => deleteAnnouncement(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-announcements'] })
      qc.invalidateQueries({ queryKey: ['announcements'] })
    },
    onError: (err) => setError(err.response?.data?.error || 'Failed to delete announcement'),
  })

  const handleSave = () => {
    setError('')
    if (!form.batchId) return setError('Select a target classroom (batch)')
    if (!form.title.trim()) return setError('Title is required')
    if (!form.content.trim()) return setError('Content is required')
    if (editing) {
      updateMut.mutate({ id: editing._id, ...form })
    } else {
      createMut.mutate(form)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setForm(BLANK_FORM)
    setShowForm(true)
    setError('')
  }

  const openEdit = (a) => {
    setEditing(a)
    setForm({
      title: a.title || '',
      content: a.content || '',
      category: a.category || 'general',
      batchId: a.batchId || '',
    })
    setShowForm(true)
    setError('')
  }

  const handleDelete = (id, title) => {
    if (!window.confirm(`Delete "${title}"? Only students of the targeted batch can see it.`)) return
    deleteMut.mutate(id)
  }

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#181d26] pt-28 pb-24">
      <SEO title="Faculty Dashboard | Electro Infinity" description="Post announcements for your classes and manage your teaching schedule." />
      <div className="max-w-[1100px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-10">
          <span className="font-mono text-[12px] uppercase tracking-wider text-deep-green font-medium block mb-2">
            Faculty Control
          </span>
          <h1 className="font-[Haas,Inter,system-ui,sans-serif] text-[36px] md:text-[44px] font-medium tracking-tight text-[#181d26]">
            Faculty Dashboard
          </h1>
          <p className="font-sans text-[15px] text-[#41454d] mt-1 max-w-2xl">
            Post announcements for a specific batch — only students of that classroom will see them.
            Edit or delete your announcements anytime.
          </p>
        </div>

        {/* Announcements */}
        {tab === 'announcements' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="font-[Haas,Inter,system-ui,sans-serif] font-medium text-[22px] text-[#181d26]">Announcements I&apos;ve posted</h2>
              {!showForm && (
                <button onClick={openCreate} className="button-primary !px-5 !py-2.5">
                  + New Announcement
                </button>
              )}
            </div>

            {/* Create / edit form */}
            {showForm && (
              <div className="border border-[#dddddd] bg-[#ffffff] p-6 rounded-[12px] shadow-sm">
                <h3 className="font-[Haas,Inter,system-ui,sans-serif] font-medium text-[18px] text-[#181d26] mb-6">
                  {editing ? 'Edit Announcement' : 'New Announcement'}
                </h3>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block font-sans text-[14px] font-medium text-[#41454d] mb-1">Category</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input w-full">
                      {CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-sans text-[14px] font-medium text-[#41454d] mb-1">Target Classroom *</label>
                    <select value={form.batchId} onChange={e => setForm(f => ({ ...f, batchId: e.target.value }))} className="input w-full">
                      <option value="">Select a batch</option>
                      {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <p className="font-sans text-[12px] text-[#9297a0] mt-1">Only students of this batch will see the announcement.</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-sans text-[14px] font-medium text-[#41454d] mb-1">Title *</label>
                    <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input w-full" placeholder="e.g. Class cancelled tomorrow" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-sans text-[14px] font-medium text-[#41454d] mb-1">Content *</label>
                    <textarea rows={4} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className="input w-full resize-none" placeholder="Announcement details…" />
                  </div>
                </div>
                {error && <p className="font-sans text-red-500 text-[14px] font-medium mt-4">{error}</p>}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleSave}
                    disabled={!form.title || !form.content || !form.batchId || createMut.isPending || updateMut.isPending}
                    className="button-primary"
                  >
                    {createMut.isPending || updateMut.isPending ? 'Saving…' : (editing ? 'Update Announcement' : 'Post Announcement')}
                  </button>
                  <button onClick={resetForm} className="button-pill-outline">Cancel</button>
                </div>
              </div>
            )}

            {/* Announcement list */}
            {isLoading ? (
              <p className="font-sans text-[#41454d] text-[15px]">Loading announcements…</p>
            ) : announcements.length === 0 ? (
              <p className="font-sans text-[#41454d] text-[15px]">No announcements posted yet. Create one above.</p>
            ) : (
              <div className="border border-[#dddddd] bg-[#ffffff] rounded-[12px] overflow-hidden shadow-sm divide-y divide-[#dddddd]">
                {announcements.map(a => (
                  <AnnouncementRow key={a._id} announcement={a} onEdit={() => openEdit(a)} onDelete={() => handleDelete(a._id, a.title)} />
                ))}
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    )
  }

function AnnouncementRow({ announcement: a, onEdit, onDelete }) {
  const createdAt = new Date(a.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  return (
    <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3 sm:py-4 hover:bg-[#f8fafc]/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-mono text-[11px] font-medium uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-pale-green text-deep-green border border-green-200">
            {a.category || 'General'}
          </span>
          {a.isPinned && (
            <span className="font-mono text-[10px] font-medium uppercase bg-[#181d26] text-white px-2 py-0.5 rounded-full">Pinned</span>
          )}
          {a.batchId && (
            <span className="font-mono text-[11px] text-[#9297a0]">Batch: {a.batchId}</span>
          )}
        </div>
        <h4 className="font-sans text-[15px] font-medium text-[#181d26] mt-1.5 truncate">{a.title}</h4>
        {a.content && <p className="font-sans text-[13px] text-[#41454d] mt-1 line-clamp-2">{a.content}</p>}
        <div className="font-sans text-[12px] text-[#9297a0] mt-1.5">Posted: {createdAt}</div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onEdit}
          className="font-sans text-[13px] font-medium text-action-blue hover:text-action-blue/80 transition-colors bg-pale-blue hover:bg-blue-100 px-3 py-1.5 rounded-md flex items-center gap-1.5"
        >
          <Pencil size={13} /> Edit
        </button>
        <button
          onClick={onDelete}
          className="font-sans text-[13px] font-medium text-red-500/70 hover:text-red-500 transition-colors bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-md"
        >
          Delete
        </button>
      </div>
    </div>
  )
}