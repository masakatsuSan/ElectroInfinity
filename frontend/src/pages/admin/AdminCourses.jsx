import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { getSubjects, createSubject, updateSubject, approveSubject, deleteSubject } from '../../api/subjects'

const BLANK = { name: '', code: '', batch: '', semester: 1, credits: 3, modules: [{title:'',topics:['']}], syllabus: '', referenceBooks: [''], objectives: [''], l: 3, t: 0, p: 0 }
const STATUS_COLORS = {
  pending:  'text-yellow-500',
  approved: 'text-deep-green',
  rejected: 'text-red-500',
}

export default function AdminCourses() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const qc = useQueryClient()
  const [form, setForm] = useState(BLANK)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['subjects', 'admin'],
    queryFn: () => getSubjects({}).then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: (d) => createSubject(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subjects'] }); setForm(BLANK); setEditing(null); setShowForm(false); setError('') },
    onError: (err) => setError(err.response?.data?.error || 'Save failed'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, ...d }) => updateSubject(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subjects'] }); setEditing(null); setShowForm(false); setError('') },
    onError: (err) => setError(err.response?.data?.error || 'Save failed'),
  })

  const approveMut = useMutation({
    mutationFn: (id) => approveSubject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subjects'] }),
    onError: (err) => setError(err.response?.data?.error || 'Approve failed'),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => deleteSubject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subjects'] }),
    onError: (err) => setError(err.response?.data?.error || 'Delete failed'),
  })

  const updateModule = (i, field, value) => {
    const modules = [...form.modules]
    modules[i] = { ...modules[i], [field]: value }
    setForm({ ...form, modules })
  }
  const addModule = () => setForm({ ...form, modules: [...form.modules, {title:'',topics:['']}] })
  const removeModule = (i) => setForm({ ...form, modules: form.modules.filter((_,idx) => idx !== i) })
  const updateModuleTopic = (modIdx, topicIdx, value) => {
    const modules = [...form.modules]
    const topics = [...modules[modIdx].topics]
    topics[topicIdx] = value
    modules[modIdx] = { ...modules[modIdx], topics }
    setForm({ ...form, modules })
  }
  const addModuleTopic = (modIdx) => {
    const modules = [...form.modules]
    modules[modIdx].topics = [...modules[modIdx].topics, '']
    setForm({ ...form, modules })
  }
  const updateBook = (i, value) => {
    const books = [...form.referenceBooks]
    books[i] = value
    setForm({ ...form, referenceBooks: books })
  }
  const addBook = () => setForm({ ...form, referenceBooks: [...form.referenceBooks, ''] })
  const removeBook = (i) => setForm({ ...form, referenceBooks: form.referenceBooks.filter((_,idx) => idx !== i) })
  const updateObjective = (i, value) => {
    const objectives = [...form.objectives]
    objectives[i] = value
    setForm({ ...form, objectives })
  }
  const addObjective = () => setForm({ ...form, objectives: [...form.objectives, ''] })
  const removeObjective = (i) => setForm({ ...form, objectives: form.objectives.filter((_,idx) => idx !== i) })

  const handleSave = () => {
    if (!form.name || !form.code) return setError('Name and code are required')
    setError('')
    const payload = {
      name: form.name,
      code: form.code,
      batch: form.batch || '',
      semester: Number(form.semester),
      credits: Number(form.credits),
      modules: form.modules.filter(m => m.title.trim()),
      syllabus: form.syllabus.trim(),
      referenceBooks: form.referenceBooks.filter(b => b.trim()),
      objectives: form.objectives.filter(o => o.trim()),
      l: Number(form.l) || 0,
      t: Number(form.t) || 0,
      p: Number(form.p) || 0,
    }
    if (editing) {
      updateMut.mutate({ id: editing._id, ...payload })
    } else {
      createMut.mutate(payload)
    }
  }

  const openCreate = () => { setEditing(null); setForm(BLANK); setShowForm(true); setError('') }
  const openEdit = (s) => {
    setEditing(s)
    setForm({
      name: s.name || '',
      code: s.code || '',
      batch: s.batch || '',
      semester: s.semester || 1,
      credits: s.credits || 0,
      modules: s.modules?.length ? s.modules : [{title:'',topics:['']}],
      syllabus: s.syllabus || '',
      referenceBooks: s.referenceBooks?.length ? s.referenceBooks : [''],
      objectives: s.objectives?.length ? s.objectives : [''],
      l: s.l || 0,
      t: s.t || 0,
      p: s.p || 0,
    })
    setShowForm(true); setError('')
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const subjects = data?.data || []

  const bySem = {}
  subjects.forEach(s => { (bySem[s.semester] = bySem[s.semester] || []).push(s) })
  const semesters = Object.keys(bySem).map(Number).sort((a, b) => a - b)

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="font-display font-semibold text-[28px] tracking-tight text-ink">Courses &amp; Subjects</h1>
        <button onClick={openCreate} className="button-primary !px-5 !py-2.5">
          {editing ? 'Edit Form' : '+ New Course'}
        </button>
      </div>

      {showForm && (
        <div className="border border-divider-soft bg-white p-6 mb-8 rounded-xl shadow-sm">
          <h2 className="font-display font-semibold text-[18px] text-ink mb-6">{editing ? 'Edit Course' : 'New Course'}</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Name *</label>
              <input value={form.name} onChange={set('name')} className="input w-full" placeholder="e.g. Electric Circuit Theory" />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Code *</label>
              <input value={form.code} onChange={set('code')} className="input w-full" placeholder="e.g. PC-EE 301" />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Semester</label>
              <input type="number" min={1} max={8} value={form.semester} onChange={set('semester')} className="input w-full" />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Credits</label>
              <input type="number" min={0} value={form.credits} onChange={set('credits')} className="input w-full" />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">L (Lecture)</label>
              <input type="number" min={0} value={form.l} onChange={set('l')} className="input w-full" />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">T (Tutorial)</label>
              <input type="number" min={0} value={form.t} onChange={set('t')} className="input w-full" />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">P (Practical)</label>
              <input type="number" min={0} value={form.p} onChange={set('p')} className="input w-full" />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-2">Modules</label>
              <div className="space-y-4">
                {form.modules.map((mod, i) => (
                  <div key={i} className="border border-divider-soft rounded-xl p-4 bg-canvas">
                    <div className="flex gap-2 mb-2">
                      <input value={mod.title} onChange={e => updateModule(i, 'title', e.target.value)} className="input flex-1" placeholder="Module title" />
                      <button type="button" onClick={() => removeModule(i)} className="text-red-500 text-sm">Remove</button>
                    </div>
                    <div className="space-y-2 pl-4">
                      {mod.topics.map((topic, j) => (
                        <div key={j} className="flex gap-2">
                          <input value={topic} onChange={e => updateModuleTopic(i, j, e.target.value)} className="input flex-1" placeholder={'Topic ' + (j+1)} />
                          <button type="button" onClick={() => {
                            const topics = [...mod.topics]
                            topics.splice(j, 1)
                            updateModule(i, 'topics', topics)
                          }} className="text-red-500 text-sm">×</button>
                        </div>
                      ))}
                      <button type="button" onClick={() => addModuleTopic(i)} className="text-[13px] text-primary font-medium">+ Add topic</button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addModule} className="text-[13px] font-medium text-primary">+ Add Module</button>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Detailed Syllabus</label>
              <textarea rows={4} value={form.syllabus} onChange={e => setForm({...form, syllabus: e.target.value})} className="input w-full resize-none" placeholder="Enter detailed syllabus content..." />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Reference Books</label>
              <div className="space-y-2">
                {form.referenceBooks.map((book, i) => (
                  <div key={i} className="flex gap-2">
                    <input value={book} onChange={e => updateBook(i, e.target.value)} className="input flex-1" placeholder="Book reference" />
                    <button type="button" onClick={() => removeBook(i)} className="text-red-500 text-sm">×</button>
                  </div>
                ))}
                <button type="button" onClick={addBook} className="text-[13px] font-medium text-primary">+ Add Book</button>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Course Objectives</label>
              <div className="space-y-2">
                {form.objectives.map((obj, i) => (
                  <div key={i} className="flex gap-2">
                    <input value={obj} onChange={e => updateObjective(i, e.target.value)} className="input flex-1" placeholder="Objective" />
                    <button type="button" onClick={() => removeObjective(i)} className="text-red-500 text-sm">×</button>
                  </div>
                ))}
                <button type="button" onClick={addObjective} className="text-[13px] font-medium text-primary">+ Add Objective</button>
              </div>
            </div>
          </div>
          {error && <p className="font-sans text-red-500 text-[14px] font-medium mt-4">{error}</p>}
          <div className="flex gap-3 mt-6">
            <button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending || !form.name || !form.code} className="button-primary">
              {createMut.isPending || updateMut.isPending ? 'Saving…' : (editing ? 'Update Course' : 'Create Course')}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); setForm(BLANK); setError('') }} className="button-pill-outline">Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? <p className="font-sans text-ink-muted-80 text-[15px]">Loading courses…</p>
        : semesters.length === 0 ? <p className="font-sans text-ink-muted-80 text-[15px]">No courses found. Create one above.</p>
        : semesters.map(sem => (
          <div key={sem} className="border border-divider-soft bg-white rounded-xl overflow-hidden shadow-sm mb-6">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-divider-soft font-display font-bold text-[18px] text-ink">Semester {sem}</div>
            <div className="divide-y divide-hairline">
              {bySem[sem].map(s => (
                  <div key={s._id} className="flex items-center gap-4 px-4 sm:px-6 py-2 sm:py-3 hover:bg-canvas-parchment transition-colors">
                  <span className="font-mono text-[11px] font-bold uppercase px-2.5 py-1 rounded-md bg-soft-stone text-ink border border-hairline flex-shrink-0">{s.code}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium text-ink truncate">{s.name}</p>
                    <p className="font-sans text-[12px] text-ink-muted-80 mt-0.5">
                      {s.credits !== undefined && s.credits + ' credits'}
                    </p>
                  </div>
                  <span className={'font-mono text-[11px] font-bold uppercase ' + (STATUS_COLORS[s.status] || 'text-slate')}>{s.status || 'pending'}</span>
                  {isAdmin && s.status === 'pending' && (
                    <button onClick={() => approveMut.mutate(s._id)} disabled={approveMut.isPending}
                      className="font-sans text-[12px] font-medium text-deep-green bg-pale-green hover:bg-green-100 transition-colors px-3 py-1.5 rounded-md">Approve</button>
                  )}
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(s)} className="font-sans text-[13px] font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors px-3 py-1.5 rounded-md">Edit</button>
                    <button onClick={() => { if (window.confirm('Delete ' + s.code + '?')) deleteMut.mutate(s._id) }}
                      className="font-sans text-[13px] font-medium text-red-500/70 hover:text-red-500 transition-colors bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-md">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  )
}
