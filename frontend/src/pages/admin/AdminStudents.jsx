import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getStudents, addStudent, bulkImport, deleteStudent, updateStudentRole } from '../../api/students'
import { Check } from 'lucide-react'
const SUBJECTS = ['ECT','EM-II','DE','NA','Maths','ECT Lab','EM Lab']
const BATCHES  = ['2023-2027','2024-2028','2025-2029','2026-2030']
const BLANK    = { name:'', rollNumber:'', email:'', batch:'2024-2028', semester:'3', regNumber:'' }

export default function AdminStudents() {
  const qc  = useQueryClient()
  const [tab, setTab] = useState('add')

  return (
    <div>
      <h1 className="font-display font-semibold text-[28px] tracking-tight text-ink mb-8">Students</h1>

      <div className="flex gap-2 border-b border-divider-soft mb-8 overflow-x-auto pb-1">
        {[['add','Add Students'],['directory','Directory']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`font-sans text-[14px] font-medium capitalize px-4 py-2 flex-none border-b-2 transition-colors rounded-t-md ${
              tab===id ? 'text-ink border-primary bg-surface-pearl' : 'text-ink-muted-80 border-transparent hover:text-ink hover:bg-surface-pearl/50'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'add'       && <AddTab       qc={qc} />}
      {tab === 'directory' && <DirectoryTab qc={qc} />}
    </div>
  )
}

// ── Add Students tab ───────────────────────────────────────────────────────
function AddTab({ qc }) {
  const [form,    setForm]    = useState(BLANK)
  const [csvRows, setCsvRows] = useState([])
  const [mode,    setMode]    = useState('single')  // 'single' | 'csv'
  const [msg,     setMsg]     = useState('')
  const [error,   setError]   = useState('')
  const fileRef = useRef(null)

  const addMut = useMutation({
    mutationFn: () => addStudent(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] })
      setForm(BLANK)
      setMsg(<span><Check size={14} /> {form.name} ({form.rollNumber}) added. They can now activate at /activate</span>)
      setError('')
    },
    onError: (err) => setError(err.response?.data?.error || 'Failed to add student'),
  })

  const bulkMut = useMutation({
    mutationFn: () => bulkImport({ students: csvRows }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['students'] })
      setMsg(<span><Check size={14} /> {res.data.message}</span>)
      setCsvRows([])
      setError('')
    },
    onError: (err) => setError(err.response?.data?.error || 'Bulk import failed'),
  })

  // Parse CSV file on the frontend
  const handleCSV = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const lines = ev.target.result.trim().split('\n')
      // Skip header row if it starts with "rollno" or "roll"
      const start = lines[0].toLowerCase().startsWith('roll') ? 1 : 0
      const rows = lines.slice(start).map(line => {
        const cols = line.split(',').map(s => s.trim())
        // Support 2-col (rollno,gmail) or full format (rollno,gmail,name,batch,semester)
        const rollNumber = cols[0] || ''
        const email      = cols[1] || ''
        const name       = cols[2] || ''   // optional — backend uses rollno as fallback
        const batch      = cols[3] || ''
        const semester   = cols[4] || '1'
        return { rollNumber, email, name, batch, semester }
      }).filter(r => r.rollNumber)
      setCsvRows(rows)
      setMsg('')
      setError('')
    }
    reader.readAsText(file)
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div>
      {/* Mode toggle */}
      <div className="flex gap-2 mb-8">
        {[['single','Add Single'],['csv','Bulk CSV Import']].map(([id,label]) => (
          <button key={id} onClick={() => { setMode(id); setMsg(''); setError('') }}
            className={`font-sans text-[13px] font-medium uppercase tracking-widest px-4 py-2 rounded-lg border transition-colors ${
              mode===id ? 'border-primary text-primary bg-primary/10' : 'border-divider-soft text-ink-muted-80 hover:text-ink hover:bg-surface-pearl'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {mode === 'single' && (
        <div className="border border-divider-soft bg-surface-pearl p-6 rounded-xl shadow-sm">
          <p className="text-[14px] font-sans text-ink-muted-80 mb-6">
            Add one student at a time. They'll get an account with no password — they activate it themselves at <span className="text-primary font-medium">/activate</span>
          </p>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Full Name *</label>
              <input value={form.name} onChange={set('name')} className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="Student full name" />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Roll Number * (unique)</label>
              <input value={form.rollNumber} onChange={e => setForm(f=>({...f,rollNumber:e.target.value.toUpperCase()}))}
                className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary uppercase" placeholder="e.g. EE24001" />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Registration No.</label>
              <input value={form.regNumber} onChange={set('regNumber')} className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="e.g. REG24001" />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Email</label>
              <input type="email" value={form.email} onChange={set('email')} className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="student@agemc.edu" />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Batch</label>
              <select value={form.batch} onChange={set('batch')} className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Current Semester</label>
              <select value={form.semester} onChange={set('semester')} className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {error && <p className="font-sans text-[14px] font-medium text-red-500 mt-4">{error}</p>}
          {msg   && <p className="font-sans text-[14px] font-medium text-green-500 mt-4">{msg}</p>}
          <button onClick={() => addMut.mutate()} disabled={!form.name||!form.rollNumber||addMut.isPending}
            className="button-primary mt-6">
            {addMut.isPending ? 'Adding…' : 'Add Student'}
          </button>
        </div>
      )}

      {mode === 'csv' && (
        <div className="border border-divider-soft bg-surface-pearl p-6 rounded-xl shadow-sm">
          <p className="text-[14px] font-sans text-ink-muted-80 mb-4">
            Upload a CSV file to add a whole batch at once.
          </p>
          <div className="border border-divider-soft bg-canvas p-5 font-mono text-[13px] text-ink-muted-80 mb-6 rounded-lg">
            <p className="text-primary mb-2 font-semibold">CSV format (header row optional):</p>
            <p className="text-green-500 mb-1">Minimum (from Google Form / WhatsApp):</p>
            <p className="text-ink">rollno,gmail</p>
            <p className="text-ink">EE24001,rahul@gmail.com</p>
            <p className="mt-4 mb-1">Full format (optional extra columns):</p>
            <p className="text-ink">rollno,gmail,name,batch,semester</p>
            <p className="text-ink">EE24001,rahul@gmail.com,Rahul Das,2024-2028,3</p>
          </div>
          <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleCSV} className="hidden" />
          <button onClick={() => fileRef.current?.click()}
            className="button-secondary-pill">
            Choose CSV File
          </button>

          {csvRows.length > 0 && (
            <div className="mt-6">
              <p className="text-[14px] font-sans text-ink-muted-80 mb-3">{csvRows.length} students ready to import:</p>
              <div className="border border-divider-soft rounded-lg max-h-64 overflow-y-auto bg-canvas">
                {csvRows.map((r, i) => (
                  <div key={i} className="flex gap-4 px-4 py-3 border-b border-divider-soft last:border-b-0 text-[14px] hover:bg-surface-pearl">
                    <span className="font-sans font-semibold text-primary w-20 flex-shrink-0">{r.rollNumber}</span>
                    <span className="flex-1 truncate text-ink">{r.name || '(No name)'}</span>
                    <span className="font-sans text-[12px] font-medium text-ink-muted-80">{r.batch}</span>
                  </div>
                ))}
              </div>
              {error && <p className="font-sans text-[14px] font-medium text-red-500 mt-4">{error}</p>}
              {msg   && <p className="font-sans text-[14px] font-medium text-green-500 mt-4">{msg}</p>}
              <button onClick={() => bulkMut.mutate()} disabled={bulkMut.isPending}
                className="button-primary mt-4">
                {bulkMut.isPending ? 'Importing…' : `Import ${csvRows.length} Students`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Directory tab ──────────────────────────────────────────────────────────
function DirectoryTab({ qc }) {
  const [batch, setBatch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['students', 'admin', batch],
    queryFn: () => getStudents(batch ? { batch } : {}).then(r => r.data),
  })

  const delMut = useMutation({
    mutationFn: (id) => deleteStudent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  })

  const roleMut = useMutation({
    mutationFn: ({ id, role }) => updateStudentRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  })

  const students = data?.data || []

  return (
    <div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {['', ...['2023-2027','2024-2028','2025-2029','2026-2030']].map(b => (
          <button key={b} onClick={() => setBatch(b)}
            className={`font-sans text-[13px] font-medium uppercase tracking-widest px-4 py-2 rounded-lg border transition-colors ${
              batch===b ? 'border-primary text-primary bg-primary/10' : 'border-divider-soft text-ink-muted-80 hover:text-ink hover:bg-surface-pearl'
            }`}>
            {b || 'All Batches'}
          </button>
        ))}
      </div>

      {isLoading ? <p className="font-sans text-[15px] text-ink-muted-80">Loading…</p>
      : students.length === 0 ? (
        <p className="font-sans text-[15px] text-ink-muted-80">No students found. Add some in the Add Students tab.</p>
      ) : (
        <div className="border border-divider-soft bg-surface-pearl rounded-xl overflow-hidden shadow-sm">
          {students.map(s => (
            <div key={s._id} className="flex items-center gap-4 px-4 sm:px-6 py-3 sm:py-4 border-b border-divider-soft last:border-b-0 hover:bg-canvas-parchment transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[15px] font-medium text-ink">{s.name || '(No name)'}</p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${s.role === 'cr' ? 'bg-coral/15 text-coral border border-coral/20' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                    {s.role === 'cr' ? 'CR' : 'Student'}
                  </span>
                </div>
                <p className="font-sans text-[13px] font-medium text-ink-muted-80 mt-1 flex items-center gap-2 flex-wrap">
                  <span className="text-primary font-semibold tracking-wider">{s.rollNumber}</span>
                  {s.email && <span className="opacity-50">·</span>}
                  {s.email && <span>{s.email}</span>}
                  <span className="opacity-50">·</span>
                  <span>{s.batch}</span>
                  <span className={`ml-2 px-2 py-0.5 rounded-sm text-[11px] font-semibold uppercase tracking-widest ${(s.isActivated ?? s.isVerified) ? 'text-green-500 bg-green-500/10' : 'text-yellow-500 bg-yellow-500/10'}`}>
                    {(s.isActivated ?? s.isVerified) ? 'Activated' : 'Not activated'}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    const nextRole = s.role === 'cr' ? 'student' : 'cr'
                    const nextLabel = nextRole === 'cr' ? 'promote to CR' : 'remove CR'
                    if (window.confirm(`Are you sure you want to ${nextLabel} for ${s.name}?`)) {
                      roleMut.mutate({ id: s._id, role: nextRole })
                    }
                  }}
                  disabled={roleMut.isPending}
                  className={`font-sans text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors ${
                    s.role === 'cr'
                      ? 'text-slate-700 bg-slate-100 hover:bg-slate-200'
                      : 'text-amber-700 bg-amber-100 hover:bg-amber-200'
                  }`}
                >
                  {s.role === 'cr' ? 'Remove CR' : 'Make CR'}
                </button>

                <button onClick={() => { if (window.confirm(`Remove ${s.name}?`)) delMut.mutate(s._id) }}
                  className="font-sans text-[13px] font-medium text-red-500/70 hover:text-red-500 transition-colors bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-md flex-shrink-0">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

