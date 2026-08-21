import { useState, useMemo } from 'react'
import { Megaphone, GraduationCap, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import ProtectedRoute from '../../components/ProtectedRoute'
import SEO from '../../components/SEO'
import { getFacultyNotices, createNotice, deleteNotice } from '../../api/notices'
import { getMyClasses } from '../../api/attendance'

const CATS = ['general', 'exam', 'lab', 'event', 'academic', 'placement']

export default function FacultyDashboard() {
  return (
    <ProtectedRoute role="faculty">
      <FacultyDashboardInner />
    </ProtectedRoute>
  )
}

function FacultyDashboardInner() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const [tab, setTab] = useState('notices') // 'notices' | 'classes'
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    category: 'general',
    batchId: '',
    subject: '',
    date: '',
    time: '',
    title: '',
    body: '',
    expiresAt: '',
  })

  // Batch + Subject options come from the faculty's own teaching assignments
  const assignments = user?.teachingAssignments || []
  const availableBatches = useMemo(
    () => [...new Set(assignments.map(a => a.batch).filter(Boolean))],
    [assignments],
  )
  const availableSubjects = useMemo(() => {
    if (!form.batchId) return []
    return [
      ...new Set(
        assignments
          .filter(a => a.batch === form.batchId)
          .map(a => a.subject)
          .filter(Boolean),
      ),
    ]
  }, [assignments, form.batchId])

  // Notices authored by this faculty ("Notices I've sent")
  const { data, isLoading } = useQuery({
    queryKey: ['faculty-notices', user?._id],
    queryFn: () => getFacultyNotices().then(r => r.data),
    enabled: tab === 'notices',
    staleTime: 60_000,
  })
  const notices = data?.data || []

  // Recent sessions for the "My Classes" tab
  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ['my-classes'],
    queryFn: () => getMyClasses().then(r => r.data),
    enabled: tab === 'classes',
    staleTime: 60_000,
  })
  const sessions = classesData?.data || []

  // Mutations
  const createMut = useMutation({
    mutationFn: () => createNotice(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faculty-notices'] })
      qc.invalidateQueries({ queryKey: ['notices'] })
      setForm({ category: 'general', batchId: '', subject: '', date: '', time: '', title: '', body: '', expiresAt: '' })
      setShowForm(false)
      setError('')
    },
    onError: (err) => setError(err.response?.data?.error || 'Failed to create notice'),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => deleteNotice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faculty-notices'] })
      qc.invalidateQueries({ queryKey: ['notices'] })
    },
    onError: (err) => setError(err.response?.data?.error || 'Failed to delete notice'),
  })

  const handleCreate = () => {
    setError('')
    if (!form.batchId) return setError('Select a batch/class')
    if (!form.subject) return setError('Select a subject')
    if (!form.title.trim()) return setError('Title is required')
    createMut.mutate()
  }

  const handleDelete = (id, title) => {
    if (!window.confirm(`Delete notice "${title}"?`)) return
    deleteMut.mutate(id)
  }

  return (
    <div className="min-h-screen bg-canvas text-ink pt-28 pb-24">
      <SEO title="Faculty Dashboard | Electro Infinity" description="Upload class notices and manage your classes." />
      <div className="max-w-[1100px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-10">
          <span className="font-mono text-[12px] uppercase tracking-wider text-deep-green font-semibold block mb-2">
            Faculty Control
          </span>
          <h1 className="font-display text-[36px] md:text-[44px] font-bold tracking-tight text-ink">
            Faculty Dashboard
          </h1>
          <p className="font-sans text-[15px] text-body-muted mt-1 max-w-2xl">
            Post class notices (subject, date &amp; time) for a specific batch — only students of that
            batch will see them. Review your recent class sessions below.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-hairline">
          <button
            onClick={() => { setTab('notices'); setShowForm(false); setError('') }}
            className={`font-display text-[15px] font-semibold py-3 px-6 rounded-t-xl transition-colors ${
              tab === 'notices' ? 'bg-primary text-white' : 'text-body-muted hover:text-ink hover:bg-soft-stone'
            }`}
          >
            <Megaphone size={16} /> Notices
          </button>
          <button
            onClick={() => { setTab('classes'); setError('') }}
            className={`font-display text-[15px] font-semibold py-3 px-6 rounded-t-xl transition-colors ${
              tab === 'classes' ? 'bg-primary text-white' : 'text-body-muted hover:text-ink hover:bg-soft-stone'
            }`}
          >
            <GraduationCap size={16} /> My Classes
          </button>
        </div>

        {/* ── Tab: Notices ── */}
        {tab === 'notices' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="font-display font-semibold text-[22px] text-ink">Notices I&apos;ve sent</h2>
              <button onClick={() => setShowForm(v => !v)} className="button-primary !px-5 !py-2.5">
                {showForm ? 'Cancel' : '+ New Class Notice'}
              </button>
            </div>
            {/* Create form */}
            {showForm && (
              <div className="border border-divider-soft bg-surface-pearl p-6 mb-6 rounded-2xl shadow-sm">
                <h3 className="font-display font-semibold text-[18px] text-ink mb-6">New Class Notice</h3>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Category</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input">
                      {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Batch *</label>
                    <select value={form.batchId} onChange={e => setForm(f => ({ ...f, batchId: e.target.value, subject: '' }))} className="input" disabled={availableBatches.length === 0}>
                      <option value="">Select batch</option>
                      {availableBatches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Subject *</label>
                    <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="input" disabled={!form.batchId || availableSubjects.length === 0}>
                      <option value="">Select subject</option>
                      {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Date</label>
                    <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input" />
                  </div>
                  <div>
                    <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Time</label>
                    <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="input" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Title *</label>
                    <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input" placeholder="e.g. Class cancelled tomorrow" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Message (optional)</label>
                    <textarea rows={3} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} className="input resize-none" placeholder="Notice details…" />
                  </div>
                  <div>
                    <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Expiry date (optional)</label>
                    <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} className="input" />
                  </div>
                </div>
                {availableBatches.length === 0 && (
                  <p className="font-sans text-[13px] text-coral mt-4">
                    No teaching assignments found for your faculty account. Contact the admin to assign batches/subjects
                    before posting class notices.
                  </p>
                )}
                {error && <p className="font-sans text-red-500 text-[14px] font-medium mt-4">{error}</p>}
                <button onClick={handleCreate} disabled={!form.title || !form.batchId || !form.subject || createMut.isPending} className="button-primary mt-6">
                  {createMut.isPending ? 'Posting…' : 'Post Notice'}
                </button>
              </div>
            )}

            {/* Notice list */}
            {isLoading ? (
              <p className="font-sans text-ink-muted-80 text-[15px]">Loading notices…</p>
            ) : notices.length === 0 ? (
              <p className="font-sans text-ink-muted-80 text-[15px]">No notices posted yet. Create one above.</p>
            ) : (
              <div className="border border-divider-soft bg-surface-pearl rounded-2xl overflow-hidden shadow-sm divide-y divide-hairline">
                {notices.map(n => (
                  <NoticeRow key={n._id} notice={n} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: My Classes ── */}
        {tab === 'classes' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="font-display font-semibold text-[22px] text-ink">My Classes</h2>
              <Link to="/attendance/faculty" className="button-primary whitespace-nowrap !py-2.5 !px-5">
                <Zap size={16} /> Open Attendance Console
              </Link>
            </div>

            <div className="border border-divider-soft bg-surface-pearl rounded-2xl p-6 shadow-sm">
              <h3 className="font-display font-semibold text-[16px] text-ink mb-4">Teaching Assignments</h3>
              {assignments.length === 0 ? (
                <p className="font-sans text-ink-muted-80 text-[14px]">No teaching assignments configured.</p>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className="font-mono text-[11px] uppercase tracking-wider text-slate py-2">Batch</th>
                      <th className="font-mono text-[11px] uppercase tracking-wider text-slate py-2">Subject</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {assignments.map((a, i) => (
                      <tr key={i}>
                        <td className="py-2.5 font-sans text-[14px] text-ink">{a.batch || '—'}</td>
                        <td className="py-2.5 font-sans text-[14px] text-ink">{a.subject || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="border border-divider-soft bg-surface-pearl rounded-2xl p-6 shadow-sm">
              <h3 className="font-display font-semibold text-[16px] text-ink mb-4">Recent Sessions</h3>
              {classesLoading ? (
                <p className="font-sans text-ink-muted-80 text-[14px]">Loading…</p>
              ) : sessions.length === 0 ? (
                <p className="font-sans text-ink-muted-80 text-[14px]">No past sessions conducted yet.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {sessions.map(s => (
                    <div key={s._id} className="border border-hairline rounded-lg p-3">
                      <p className="font-sans text-[14px] font-medium text-ink truncate">{s.subject || s.course || '—'}</p>
                      <p className="font-mono text-[12px] text-slate">
                        {s.batch} · {new Date(s.startTime).toLocaleString('en-IN', { dateStyle: 'medium' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function NoticeRow({ notice, onDelete }) {
  const createdAt = new Date(notice.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
  const classDate = notice.date
    ? new Date(notice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : null

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-soft-stone/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-pale-green text-deep-green border border-green-200">
            {notice.category || 'General'}
          </span>
          {notice.isPinned && (
            <span className="font-mono text-[10px] font-bold uppercase bg-ink text-white px-2 py-0.5 rounded-full">Pinned</span>
          )}
          <span className="font-mono text-[11px] text-slate">
            {notice.subject && <span>Subject: {notice.subject} · </span>}
            {notice.batchId && <span>Batch: {notice.batchId} · </span>}
            {notice.time && <span>Time: {notice.time}</span>}
          </span>
        </div>
        <h4 className="font-sans text-[15px] font-semibold text-ink mt-1.5 truncate">{notice.title}</h4>
        {notice.body && <p className="font-sans text-[13px] text-body-muted mt-1 line-clamp-2">{notice.body}</p>}
        <div className="font-sans text-[12px] text-slate mt-1.5">
          {classDate && <span>Class date: {classDate} · </span>}
          <span>Posted: {createdAt}</span>
        </div>
      </div>
      <button
        onClick={() => onDelete(notice._id, notice.title)}
        className="font-sans text-[13px] font-medium text-red-500/70 hover:text-red-500 transition-colors bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-md flex-shrink-0"
      >
        Delete
      </button>
    </div>
  )
}

