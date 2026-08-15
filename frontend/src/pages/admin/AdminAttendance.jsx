import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import {
  getAdminFaculty,
  createAdminFaculty,
  updateAdminFaculty,
  toggleFacultyActive,
  deleteAdminFaculty,
  getSubjects,
  createSubject,
  deleteSubject,
  getBatchStats,
} from '../../api/attendance'

const BATCHES = ['2023-2027', '2024-2028', '2025-2029', '2026-2030']

export default function AdminAttendance() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const [tab, setTab] = useState(isAdmin ? 'faculty' : 'stats')

  const tabs = isAdmin
    ? [
        ['faculty', ' Faculty Accounts'],
        ['subjects', ' Subjects & Courses'],
        ['stats', 'Batch Attendance Stats'],
      ]
    : [['stats', ' Batch Attendance Stats']]

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-semibold text-[28px] tracking-tight text-ink mb-1">
          Attendance Management
        </h1>
        <p className="font-sans text-[14px] text-ink-muted-80">
          {isAdmin
            ? 'Manage Faculty accounts with teaching assignments, configure subjects, and monitor student attendance.'
            : 'View batch attendance records and low-attendance warnings.'}
        </p>
      </div>

      <div className="flex gap-2 border-b border-divider-soft mb-8 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`font-sans text-[14px] font-medium px-5 py-2.5 rounded-t-lg border-b-2 transition-colors ${
              tab === id
                ? 'text-ink border-primary bg-surface-pearl font-semibold'
                : 'text-ink-muted-80 border-transparent hover:text-ink hover:bg-surface-pearl/50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'faculty' && <FacultyManagementTab />}
      {tab === 'subjects' && <SubjectsManagementTab />}
      {tab === 'stats' && <StatsTab />}
    </div>
  )
}

// ── 1. Faculty Management Tab ──
function FacultyManagementTab() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingFaculty, setEditingFaculty] = useState(null)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  // Form state
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    teachingAssignments: [{ batch: '2024-2028', subject: 'ECT' }],
  })

  const { data: facultyList = [], isLoading } = useQuery({
    queryKey: ['admin-faculty-list'],
    queryFn: () => getAdminFaculty().then(r => r.data.data),
  })

  const { data: subjectCatalog = [] } = useQuery({
    queryKey: ['faculty-subject-options'],
    queryFn: async () => {
      const results = await Promise.all(
        BATCHES.map(batch => getSubjects({ batch }).then(r => r.data.data || []))
      )
      return results.flat()
    },
  })

  const availableSubjects = [...new Map(
    (subjectCatalog || []).map(subject => [subject.code || subject.name, subject])
  ).values()].sort((a, b) => (a.code || a.name).localeCompare(b.code || b.name))

  const openCreateModal = () => {
    setEditingFaculty(null)
    setForm({
      name: '',
      email: '',
      password: '',
      teachingAssignments: [{ batch: '2024-2028', subject: 'ECT' }],
    })
    setError('')
    setMsg('')
    setModalOpen(true)
  }

  const openEditModal = (fac) => {
    setEditingFaculty(fac)
    setForm({
      name: fac.name || '',
      email: fac.email || '',
      password: '',
      teachingAssignments: fac.teachingAssignments?.length
        ? fac.teachingAssignments.map(a => ({ batch: a.batch || '', subject: a.subject || '' }))
        : [{ batch: '2024-2028', subject: 'ECT' }],
    })
    setError('')
    setMsg('')
    setModalOpen(true)
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      if (editingFaculty) {
        return updateAdminFaculty(editingFaculty._id, form)
      } else {
        return createAdminFaculty(form)
      }
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin-faculty-list'] })
      setModalOpen(false)
      setMsg(editingFaculty ? 'Faculty account updated successfully!' : 'Faculty account created successfully!')
      setError('')
    },
    onError: (err) => setError(err.response?.data?.error || 'Failed to save faculty account'),
  })

  const toggleActiveMut = useMutation({
    mutationFn: (id) => toggleFacultyActive(id),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin-faculty-list'] })
      setMsg(res.data.message || 'Status updated')
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id) => deleteAdminFaculty(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-faculty-list'] })
      setMsg('Faculty account removed')
    },
  })

  const addAssignmentRow = () => {
    setForm(f => ({
      ...f,
      teachingAssignments: [...f.teachingAssignments, { batch: '2024-2028', subject: 'ECT' }],
    }))
  }

  const removeAssignmentRow = (index) => {
    setForm(f => ({
      ...f,
      teachingAssignments: f.teachingAssignments.filter((_, i) => i !== index),
    }))
  }

  const updateAssignmentField = (index, field, value) => {
    setForm(f => {
      const updated = [...f.teachingAssignments]
      updated[index] = { ...updated[index], [field]: value }
      return { ...f, teachingAssignments: updated }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-[20px] font-semibold text-ink">Faculty Accounts</h2>
          <p className="font-sans text-[13px] text-ink-muted-80">
            Create top-level faculty accounts and configure their assigned batch and subjects.
          </p>
        </div>
        <button onClick={openCreateModal} className="button-primary text-[14px]">
          + Create Faculty Account
        </button>
      </div>

      {msg && <div className="rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-green-600 text-[14px]">{msg}</div>}
      {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-500 text-[14px]">{error}</div>}

      {isLoading ? (
        <p className="text-ink-muted-80 font-sans">Loading faculty accounts…</p>
      ) : facultyList.length === 0 ? (
        <div className="py-16 text-center border border-divider-soft rounded-2xl bg-surface-pearl">
          <p className="font-sans text-[16px] text-ink-muted-80 font-medium">No faculty accounts created yet.</p>
          <button onClick={openCreateModal} className="button-primary text-[14px] mt-4">
            + Add First Faculty
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {facultyList.map(fac => (
            <div
              key={fac._id}
              className={`border border-divider-soft bg-surface-pearl rounded-2xl p-5 shadow-sm flex flex-col justify-between transition-all ${
                fac.isActive === false ? 'opacity-60 bg-surface-pearl/50' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    fac.isActive !== false
                      ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                      : 'bg-red-500/10 text-red-500 border border-red-500/20'
                  }`}>
                    {fac.isActive !== false ? '● Active' : '○ Deactivated'}
                  </span>
                  <span className="font-mono text-[12px] text-ink-muted-48">Faculty</span>
                </div>

                <h3 className="font-display text-[18px] font-bold text-ink">{fac.name}</h3>
                <p className="font-sans text-[13px] text-ink-muted-80 font-mono mt-0.5">{fac.email}</p>

                {/* Teaching Assignments */}
                <div className="mt-4 pt-3 border-t border-divider-soft space-y-1.5">
                  <p className="font-sans text-[12px] font-bold uppercase tracking-wider text-ink-muted-80">
                    Teaching Assignments ({fac.teachingAssignments?.length || 0})
                  </p>
                  {fac.teachingAssignments?.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {fac.teachingAssignments.map((a, i) => (
                        <span key={i} className="font-sans text-[12px] bg-canvas border border-divider-soft px-2.5 py-1 rounded-lg text-ink">
                          <strong>{a.subject}</strong> · {a.batch} {a.section && `(Sec ${a.section})`}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="font-sans text-[12px] text-ink-muted-48 italic">All batches (General)</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-divider-soft flex items-center gap-2">
                <button
                  onClick={() => openEditModal(fac)}
                  className="button-secondary flex-1 text-[13px] !py-1.5"
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleActiveMut.mutate(fac._id)}
                  className={`px-3 py-1.5 rounded-xl text-[13px] font-medium border transition-colors ${
                    fac.isActive !== false
                      ? 'border-amber-500/40 text-amber-600 hover:bg-amber-500/10'
                      : 'border-green-500/40 text-green-600 hover:bg-green-500/10'
                  }`}
                >
                  {fac.isActive !== false ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete faculty account for ${fac.name}?`)) deleteMut.mutate(fac._id)
                  }}
                  className="px-2.5 py-1.5 text-red-500 hover:bg-red-500/10 rounded-xl text-[13px] transition-colors"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal: Create / Edit Faculty ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-canvas text-ink border border-divider-soft rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-divider-soft flex items-center justify-between">
              <div>
                <h3 className="font-display text-[22px] font-bold">
                  {editingFaculty ? 'Edit Faculty Account' : 'Create Faculty Account'}
                </h3>
                <p className="font-sans text-[13px] text-ink-muted-80">
                  Assign batches and subjects for attendance taking.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-pearl border border-divider-soft flex items-center justify-center hover:bg-divider-soft"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                saveMut.mutate()
              }}
              className="p-6 overflow-y-auto space-y-5 flex-1"
            >
              <div>
                <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Full Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Dr. A. K. Sharma"
                  className="w-full bg-surface-pearl border border-divider-soft rounded-xl px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="faculty@agemc.edu"
                  className="w-full bg-surface-pearl border border-divider-soft rounded-xl px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">
                  Password {editingFaculty ? '(leave blank to keep current)' : '* (min 6 chars)'}
                </label>
                <input
                  type="password"
                  required={!editingFaculty}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder={editingFaculty ? '••••••••' : 'Set login password'}
                  className="w-full bg-surface-pearl border border-divider-soft rounded-xl px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary"
                />
              </div>

              {/* Teaching Assignments Builder */}
              <div className="pt-3 border-t border-divider-soft">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="font-sans text-[14px] font-bold text-ink">Teaching Assignments</label>
                    <p className="font-sans text-[12px] text-ink-muted-80">Which batch and subject does this faculty teach?</p>
                  </div>
                  <button
                    type="button"
                    onClick={addAssignmentRow}
                    className="button-secondary text-[12px] !py-1 !px-3"
                  >
                    + Add Row
                  </button>
                </div>

                <div className="space-y-3">
                  {form.teachingAssignments.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-surface-pearl p-3 rounded-xl border border-divider-soft">
                      {/* Batch */}
                      <select
                        value={row.batch}
                        onChange={e => updateAssignmentField(idx, 'batch', e.target.value)}
                        className="bg-canvas border border-divider-soft rounded-lg px-2.5 py-1.5 text-[13px] font-sans text-ink flex-1"
                      >
                        {BATCHES.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>

                      {/* Subject */}
                      <select
                        value={row.subject || ''}
                        onChange={e => updateAssignmentField(idx, 'subject', e.target.value)}
                        className="bg-canvas border border-divider-soft rounded-lg px-2.5 py-1.5 text-[13px] font-sans text-ink flex-1"
                      >
                        <option value="">Select subject</option>
                        {(availableSubjects.filter(subject => (!subject.batch || subject.batch === row.batch))).map(subject => (
                          <option key={`${subject.batch || row.batch}-${subject.code || subject.name}`} value={subject.code || subject.name}>
                            {subject.code || subject.name}
                          </option>
                        ))}
                      </select>

                      {form.teachingAssignments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAssignmentRow(idx)}
                          className="text-red-500 hover:text-red-700 px-2 py-1 text-[13px]"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {error && <p className="font-sans text-[13px] text-red-500 font-medium">{error}</p>}

              <div className="pt-4 border-t border-divider-soft flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="button-secondary text-[14px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMut.isPending}
                  className="button-primary text-[14px]"
                >
                  {saveMut.isPending ? 'Saving…' : editingFaculty ? 'Update Faculty' : 'Create Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 2. Subjects Management Tab ──
function SubjectsManagementTab() {
  const qc = useQueryClient()
  const [selectedBatch, setSelectedBatch] = useState('2024-2028')
  const [newSubject, setNewSubject] = useState({ name: '', code: '', batch: '2024-2028', section: '', semester: 3 })
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ['subjects-list', selectedBatch],
    queryFn: () => getSubjects({ batch: selectedBatch }).then(r => r.data.data),
  })

  const addMut = useMutation({
    mutationFn: () => createSubject(newSubject),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subjects-list'] })
      setNewSubject({ name: '', code: '', batch: selectedBatch, section: '', semester: 3 })
      setMsg('Subject created successfully!')
      setError('')
    },
    onError: (err) => setError(err.response?.data?.error || 'Failed to add subject'),
  })

  const delMut = useMutation({
    mutationFn: (id) => deleteSubject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subjects-list'] }),
  })

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Form */}
        <div className="lg:col-span-5 border border-divider-soft bg-surface-pearl rounded-2xl p-6 shadow-sm">
          <h3 className="font-display text-[18px] font-bold text-ink mb-4">Add New Subject</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              addMut.mutate()
            }}
            className="space-y-4"
          >
            <div>
              <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1">Subject Name *</label>
              <input
                required
                placeholder="e.g. Electric Circuit Theory"
                value={newSubject.name}
                onChange={e => setNewSubject(s => ({ ...s, name: e.target.value }))}
                className="w-full bg-canvas border border-divider-soft rounded-xl px-4 py-2.5 text-[14px] text-ink focus:outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1">Code *</label>
                <input
                  required
                  placeholder="e.g. ECT"
                  value={newSubject.code}
                  onChange={e => setNewSubject(s => ({ ...s, code: e.target.value.toUpperCase() }))}
                  className="w-full bg-canvas border border-divider-soft rounded-xl px-4 py-2.5 text-[14px] text-ink uppercase focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1">Batch *</label>
                <select
                  value={newSubject.batch}
                  onChange={e => setNewSubject(s => ({ ...s, batch: e.target.value }))}
                  className="w-full bg-canvas border border-divider-soft rounded-xl px-3 py-2.5 text-[14px] text-ink focus:outline-none focus:border-primary"
                >
                  {BATCHES.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1">Section (optional)</label>
                <input
                  placeholder="e.g. A or blank for all"
                  value={newSubject.section}
                  onChange={e => setNewSubject(s => ({ ...s, section: e.target.value.toUpperCase() }))}
                  className="w-full bg-canvas border border-divider-soft rounded-xl px-4 py-2.5 text-[14px] text-ink uppercase focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1">Semester</label>
                <select
                  value={newSubject.semester}
                  onChange={e => setNewSubject(s => ({ ...s, semester: Number(e.target.value) }))}
                  className="w-full bg-canvas border border-divider-soft rounded-xl px-3 py-2.5 text-[14px] text-ink focus:outline-none focus:border-primary"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <option key={sem} value={sem}>Sem {sem}</option>
                  ))}
                </select>
              </div>
            </div>

            {msg && <p className="text-green-600 text-[13px] font-medium">{msg}</p>}
            {error && <p className="text-red-500 text-[13px] font-medium">{error}</p>}

            <button type="submit" disabled={addMut.isPending} className="button-primary w-full text-[14px]">
              {addMut.isPending ? 'Adding…' : 'Add Subject'}
            </button>
          </form>
        </div>

        {/* List */}
        <div className="lg:col-span-7 border border-divider-soft bg-surface-pearl rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-[18px] font-bold text-ink">Configured Subjects</h3>
            <select
              value={selectedBatch}
              onChange={e => setSelectedBatch(e.target.value)}
              className="bg-canvas border border-divider-soft rounded-xl px-3 py-1.5 text-[13px] text-ink"
            >
              {BATCHES.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <p className="text-ink-muted-80">Loading subjects…</p>
          ) : subjects.length === 0 ? (
            <p className="text-ink-muted-80 text-[14px] py-8 text-center">No subjects configured for batch {selectedBatch}.</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {subjects.map(s => (
                <div key={s._id} className="flex items-center justify-between p-3.5 bg-canvas rounded-xl border border-divider-soft">
                  <div>
                    <span className="font-mono text-primary font-bold text-[13px]">{s.code}</span>
                    <p className="font-semibold text-[14px] text-ink">{s.name}</p>
                    <p className="text-[12px] text-ink-muted-80">
                      Batch {s.batch} {s.section && `· Sec ${s.section}`} · Sem {s.semester}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete subject ${s.code}?`)) delMut.mutate(s._id)
                    }}
                    className="text-red-500 hover:text-red-700 text-[13px] p-2"
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── 3. Batch Stats Tab ──
function StatsTab() {
  const { user } = useAuth()
  const [batch, setBatch] = useState(user?.batch || BATCHES[0])

  const { data: stats = [], isLoading } = useQuery({
    queryKey: ['attendance-batch-stats', batch],
    queryFn: () => getBatchStats(batch).then(r => r.data.data),
    enabled: !!batch,
  })

  return (
    <div className="border border-divider-soft bg-surface-pearl rounded-2xl shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-divider-soft">
        <div>
          <h2 className="font-display text-[20px] font-bold text-ink">Batch Attendance Performance</h2>
          <p className="font-sans text-[13px] text-ink-muted-80">
            Overall student attendance percentages and low-attendance warnings for batch {batch}.
          </p>
        </div>
        <select
          value={batch}
          onChange={e => setBatch(e.target.value)}
          className="rounded-xl border border-divider-soft bg-canvas px-4 py-2 text-[14px] font-sans text-ink"
        >
          {BATCHES.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="font-sans text-ink-muted-80">Loading batch statistics…</p>
      ) : stats.length === 0 ? (
        <p className="font-sans text-[14px] text-ink-muted-80 py-12 text-center">
          No attendance records for batch {batch} yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px] font-sans">
            <thead>
              <tr className="text-ink-muted-80 border-b border-divider-soft text-[12px] font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Student Name</th>
                <th className="py-3 px-3">Roll Number</th>
                <th className="py-3 px-3">Attended</th>
                <th className="py-3 px-3">Percentage</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider-soft/50">
              {stats.map(({ student, attended, totalSessions, percentage, flagged, lowAttendance }) => (
                <tr key={student._id} className={`hover:bg-canvas/50 transition-colors ${lowAttendance ? 'bg-amber-500/5' : ''}`}>
                  <td className="py-3 px-3 font-medium text-ink">{student.name}</td>
                  <td className="py-3 px-3 font-mono text-primary">{student.rollNumber}</td>
                  <td className="py-3 px-3 text-ink-muted-80">{attended} / {totalSessions}</td>
                  <td className="py-3 px-3 font-bold">
                    <span className={lowAttendance ? 'text-amber-600' : 'text-green-600'}>{percentage}%</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      lowAttendance
                        ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                        : 'bg-green-500/10 text-green-600 border border-green-500/20'
                    }`}>
                      {lowAttendance ? 'Low Attendance (<75%)' : 'Eligible'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
