import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  adminListStats, adminCreateStat, adminUpdateStat, adminDeleteStat, adminReorderStats,
  adminListRecruiters, adminCreateRecruiter, adminUpdateRecruiter, adminDeleteRecruiter, adminReorderRecruiters,
  adminListPlacedStudents, adminCreatePlacedStudent, adminUpdatePlacedStudent, adminDeletePlacedStudent,
  adminListAlumniStories, adminCreateAlumniStory, adminUpdateAlumniStory, adminDeleteAlumniStory, adminReorderAlumniStories,
  adminListOpenings, adminCreateOpening, adminUpdateOpening, adminDeleteOpening,
  adminTogglePublish,
} from '../../api/placements'
import { X } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { FileUpload } from '../../components/FileUpload'

const BLANK_STAT = { academicYear: '', totalStudents: '', placed: '', highestPackage: '', averagePackage: '', medianPackage: '' }
const BLANK_RECRUITER = { name: '', logoUrl: '', website: '', type: 'both' }
const BLANK_STUDENT = { studentName: '', branch: '', batchYear: '', company: '', role: '', package: '', photoUrl: '', type: 'placement' }
const BLANK_ALUMNI = { name: '', batchYear: '', currentRole: '', company: '', quote: '', photoUrl: '', linkedinUrl: '' }
const BLANK_OPENING = { title: '', company: '', type: 'job', location: '', mode: 'onsite', description: '', applyUrl: '', deadline: '', status: 'open' }

const SECTIONS = [
  { key: 'stats', label: 'Placement Stats', blank: BLANK_STAT, orderable: true },
  { key: 'recruiters', label: 'Recruiters', blank: BLANK_RECRUITER, orderable: true },
  { key: 'placed-students', label: 'Placed Students', blank: BLANK_STUDENT, orderable: false },
  { key: 'alumni', label: 'Alumni Stories', blank: BLANK_ALUMNI, orderable: true },
  { key: 'openings', label: 'Career Openings', blank: BLANK_OPENING, orderable: false },
]

function SafeImage({ src, alt, children, className, onErrorMsg }) {
  const [failed, setFailed] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  if (!src || failed) {
    return (
      <>
        {children}
        {errorMsg && <p className="text-red-400 text-[11px] mt-1">{errorMsg}</p>}
      </>
    )
  }
  return <img src={src} alt={alt} onError={(e) => { setFailed(true); setErrorMsg(onErrorMsg || 'Image failed to load'); e.target.onerror = null }} className={className} />
}

function toDateTimeLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AdminPlacements() {
  const qc = useQueryClient()
  const { showToast } = useToast()
  const [tab, setTab] = useState('stats')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(BLANK_STAT)
  const [error, setError] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')

  const section = SECTIONS.find(s => s.key === tab)

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['adminPlacements', 'stats', search],
    queryFn: () => adminListStats({ search }).then(r => r.data),
  })
  const { data: recruitersData, isLoading: recruitersLoading } = useQuery({
    queryKey: ['adminPlacements', 'recruiters', search],
    queryFn: () => adminListRecruiters({ search }).then(r => r.data),
  })
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['adminPlacements', 'placed-students', search],
    queryFn: () => adminListPlacedStudents({ search }).then(r => r.data),
  })
  const { data: alumniData, isLoading: alumniLoading } = useQuery({
    queryKey: ['adminPlacements', 'alumni', search],
    queryFn: () => adminListAlumniStories({ search }).then(r => r.data),
  })
  const { data: openingsData, isLoading: openingsLoading } = useQuery({
    queryKey: ['adminPlacements', 'openings', search],
    queryFn: () => adminListOpenings({ search }).then(r => r.data),
  })

  const map = {
    stats: { data: statsData?.data || [], isLoading: statsLoading },
    recruiters: { data: recruitersData?.data || [], isLoading: recruitersLoading },
    'placed-students': { data: studentsData?.data || [], isLoading: studentsLoading },
    alumni: { data: alumniData?.data || [], isLoading: alumniLoading },
    openings: { data: openingsData?.data || [], isLoading: openingsLoading },
  }
  const current = map[tab]

  const saveMut = useMutation({
    mutationFn: (payload) => {
      if (editing) {
        if (tab === 'stats') return adminUpdateStat(editing._id, payload)
        if (tab === 'recruiters') return adminUpdateRecruiter(editing._id, payload)
        if (tab === 'placed-students') return adminUpdatePlacedStudent(editing._id, payload)
        if (tab === 'alumni') return adminUpdateAlumniStory(editing._id, payload)
        if (tab === 'openings') return adminUpdateOpening(editing._id, payload)
      }
      if (tab === 'stats') return adminCreateStat(payload)
      if (tab === 'recruiters') return adminCreateRecruiter(payload)
      if (tab === 'placed-students') return adminCreatePlacedStudent(payload)
      if (tab === 'alumni') return adminCreateAlumniStory(payload)
      if (tab === 'openings') return adminCreateOpening(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminPlacements'] })
      setForm(section.blank)
      setEditing(null)
      setShowForm(false)
      setFile(null)
      setPreview('')
      setError('')
      showToast(editing ? 'Updated successfully' : 'Created successfully')
    },
    onError: (err) => {
      if (import.meta.env.DEV) console.error('[AdminPlacements saveMut]', err)
      const status = err.response?.status
      const msg = err.response?.data?.error || 'Save failed'
      if (status === 403) setError('Access denied — admin permission required')
      else if (status === 404) setError(msg)
      else setError(msg || 'Save failed')
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id) => {
      if (tab === 'stats') return adminDeleteStat(id)
      if (tab === 'recruiters') return adminDeleteRecruiter(id)
      if (tab === 'placed-students') return adminDeletePlacedStudent(id)
      if (tab === 'alumni') return adminDeleteAlumniStory(id)
      if (tab === 'openings') return adminDeleteOpening(id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminPlacements'] })
      showToast('Deleted successfully')
    },
    onError: (err) => {
      if (import.meta.env.DEV) console.error('[AdminPlacements deleteMut]', err)
      const status = err.response?.status
      const msg = err.response?.data?.error || 'Delete failed'
      setError(status === 403 ? 'Access denied — admin permission required' : msg)
    },
  })

  const reorderMut = useMutation({
    mutationFn: (items) => {
      if (tab === 'stats') return adminReorderStats(items)
      if (tab === 'recruiters') return adminReorderRecruiters(items)
      if (tab === 'alumni') return adminReorderAlumniStories(items)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminPlacements'] })
      showToast('Order updated')
    },
    onError: (err) => {
      if (import.meta.env.DEV) console.error('[AdminPlacements reorderMut]', err)
      const msg = err.response?.data?.error || 'Reorder failed'
      setError(msg)
    },
  })

  const handleReorder = (idx, dir) => {
    const items = current.data
    if (!items || idx + dir < 0 || idx + dir >= items.length) return
    const newItems = [...items]
    const temp = newItems[idx]
    newItems[idx] = newItems[idx + dir]
    newItems[idx + dir] = temp
    reorderMut.mutate(newItems.map((it, i) => ({ id: it._id, order: i })))
  }

  const handleTogglePublish = (section, id) => {
    adminTogglePublish(section, id)
      .then(() => qc.invalidateQueries({ queryKey: ['adminPlacements'] }))
      .catch((err) => {
        if (import.meta.env.DEV) console.error('[AdminPlacements togglePublish]', err)
        const status = err.response?.status
        const msg = err.response?.data?.error || 'Toggle failed'
        setError(status === 403 ? 'Access denied — admin permission required' : msg)
      })
  }

  const openCreate = () => {
    setEditing(null)
    setForm(section.blank)
    setShowForm(true)
    setFile(null)
    setPreview('')
    setError('')
  }

  const openEdit = (item) => {
    setEditing(item)
    if (tab === 'stats') {
      setForm({
        academicYear: item.academicYear || '',
        totalStudents: String(item.totalStudents ?? ''),
        placed: String(item.placed ?? ''),
        highestPackage: item.highestPackage || '',
        averagePackage: item.averagePackage || '',
        medianPackage: item.medianPackage || '',
      })
    } else if (tab === 'recruiters') {
      setForm({
        name: item.name || '',
        logoUrl: item.logoUrl || '',
        website: item.website || '',
        type: item.type || 'both',
      })
    } else if (tab === 'placed-students') {
      setForm({
        studentName: item.studentName || '',
        branch: item.branch || '',
        batchYear: item.batchYear || '',
        company: item.company || '',
        role: item.role || '',
        package: item.package || '',
        photoUrl: item.photoUrl || '',
        type: item.type || 'placement',
      })
    } else if (tab === 'alumni') {
      setForm({
        name: item.name || '',
        batchYear: item.batchYear || '',
        currentRole: item.currentRole || '',
        company: item.company || '',
        quote: item.quote || '',
        photoUrl: item.photoUrl || '',
        linkedinUrl: item.linkedinUrl || '',
      })
    } else if (tab === 'openings') {
      setForm({
        title: item.title || '',
        company: item.company || '',
        type: item.type || 'job',
        location: item.location || '',
        mode: item.mode || 'onsite',
        description: item.description || '',
        applyUrl: item.applyUrl || '',
        deadline: item.deadline ? toDateTimeLocal(item.deadline) : '',
        status: item.status || 'open',
      })
    }
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
    setError('')
    if (tab === 'stats') {
      if (!form.academicYear) return setError('Academic year is required')
      if (!form.totalStudents && form.totalStudents !== 0) return setError('Total students is required')
      if (!form.placed && form.placed !== 0) return setError('Placed count is required')
      if (!form.highestPackage) return setError('Highest package is required')
      if (!form.averagePackage) return setError('Average package is required')
    } else if (tab === 'recruiters') {
      if (!form.name) return setError('Company name is required')
      if (!form.logoUrl && !file) return setError('Logo URL or file is required')
    } else if (tab === 'placed-students') {
      if (!form.studentName) return setError('Student name is required')
      if (!form.branch) return setError('Branch is required')
      if (!form.batchYear) return setError('Batch year is required')
      if (!form.company) return setError('Company is required')
      if (!form.role) return setError('Role is required')
    } else if (tab === 'alumni') {
      if (!form.name) return setError('Name is required')
      if (!form.batchYear) return setError('Batch year is required')
      if (!form.currentRole) return setError('Current role is required')
      if (!form.company) return setError('Company is required')
      if (!form.quote) return setError('Quote / story is required')
    } else if (tab === 'openings') {
      if (!form.title) return setError('Title is required')
      if (!form.company) return setError('Company is required')
      if (!form.location) return setError('Location is required')
      if (!form.description) return setError('Description is required')
      if (!form.applyUrl) return setError('Apply URL is required')
      if (!form.deadline) return setError('Deadline is required')
    }

    // If a file is selected, send FormData; otherwise send JSON
    const payload = file
      ? (() => {
          const fd = new FormData()
          Object.entries(form).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') fd.append(k, v)
          })
          const fieldName = tab === 'recruiters' ? 'logo' : 'photo'
          fd.append(fieldName, file)
          return fd
        })()
      : form

    saveMut.mutate(payload)
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="font-[Inter,system-ui,sans-serif] font-semibold text-[28px] tracking-tight text-ink">Placements &amp; Careers</h1>
        <button onClick={openCreate} className="button-primary !px-5 !py-2.5">
          {showForm && !editing ? 'Cancel' : editing ? 'Edit Form' : '+ New'}
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 border-b border-divider-soft mb-8 overflow-x-auto pb-1">
        {SECTIONS.map(s => (
          <button key={s.key} onClick={() => { setTab(s.key); setSearch(''); setShowForm(false); setEditing(null); setError('') }}
            className={`font-[Inter,system-ui,sans-serif] text-[14px] font-medium capitalize px-4 py-2 flex-none border-b-2 transition-colors rounded-t-md ${
              tab === s.key ? 'text-ink border-primary bg-white' : 'text-ink-muted-80 border-transparent hover:text-ink hover:bg-white/50'
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="border border-divider-soft bg-white p-6 mb-8 rounded-xl shadow-sm">
          <h2 className="font-[Inter,system-ui,sans-serif] font-semibold text-[18px] text-ink mb-6">
            {editing ? 'Edit' : 'Add'} {section.label.slice(0, -1)}
          </h2>

          {tab === 'stats' && (
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Academic Year *</label>
                <input value={form.academicYear} onChange={set('academicYear')} className="input w-full" placeholder="e.g. 2024-25" />
              </div>
              <div>
                <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Total Students *</label>
                <input type="number" min="0" value={form.totalStudents} onChange={set('totalStudents')} className="input w-full" placeholder="e.g. 200" />
              </div>
              <div>
                <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Placed *</label>
                <input type="number" min="0" value={form.placed} onChange={set('placed')} className="input w-full" placeholder="e.g. 188" />
              </div>
              <div>
                <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Highest Package *</label>
                <input value={form.highestPackage} onChange={set('highestPackage')} className="input w-full" placeholder="e.g. 15 LPA" />
              </div>
              <div>
                <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Average Package *</label>
                <input value={form.averagePackage} onChange={set('averagePackage')} className="input w-full" placeholder="e.g. 7.2 LPA" />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Median Package</label>
                <input value={form.medianPackage} onChange={set('medianPackage')} className="input w-full" placeholder="e.g. 6.4 LPA" />
              </div>
            </div>
          )}

{tab === 'recruiters' && (
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Company Name *</label>
                <input value={form.name} onChange={set('name')} className="input w-full" placeholder="e.g. Tata Power" />
              </div>
              <div className="sm:col-span-2">
                <FileUpload
                  fieldName="logo"
                  accept="image/*"
                  maxSizeMB={5}
                  value={form.logoUrl}
                  onChange={(f) => setFile(f)}
                  label="Company Logo *"
                  helpText="JPG, PNG, WebP, GIF — max 5 MB"
                />
              </div>
              <div>
                <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Website</label>
                <input value={form.website} onChange={set('website')} className="input w-full" placeholder="https://..." />
              </div>
              <div>
                <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Type</label>
                <select value={form.type} onChange={set('type')} className="input w-full">
                  <option value="placement">Placement</option>
                  <option value="internship">Internship</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>
          )}

{tab === 'placed-students' && (
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Student Name *</label>
                <input value={form.studentName} onChange={set('studentName')} className="input w-full" placeholder="e.g. Rahul Das" />
              </div>
              <div>
                <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Branch *</label>
                <input value={form.branch} onChange={set('branch')} className="input w-full" placeholder="e.g. Electrical Engineering" />
              </div>
              <div>
                <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Batch Year *</label>
                <input value={form.batchYear} onChange={set('batchYear')} className="input w-full" placeholder="e.g. 2024" />
              </div>
              <div>
                <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Company *</label>
                <input value={form.company} onChange={set('company')} className="input w-full" placeholder="e.g. Tata Power" />
              </div>
              <div>
                <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Role *</label>
                <input value={form.role} onChange={set('role')} className="input w-full" placeholder="e.g. GET" />
              </div>
              <div>
                <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Package (LPA)</label>
                <input value={form.package} onChange={set('package')} className="input w-full" placeholder="e.g. 6.5 LPA" />
              </div>
              <div>
                <FileUpload
                  fieldName="photo"
                  accept="image/*"
                  maxSizeMB={5}
                  value={form.photoUrl}
                  onChange={(f) => setFile(f)}
                  label="Student Photo"
                  helpText="JPG, PNG, WebP, GIF — max 5 MB"
                />
              </div>
              <div>
                <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Type</label>
                <select value={form.type} onChange={set('type')} className="input w-full">
                  <option value="placement">Placement</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
            </div>
          )}

{tab === 'alumni' && (
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Name *</label>
                <input value={form.name} onChange={set('name')} className="input w-full" placeholder="e.g. Vikram Mehta" />
              </div>
              <div>
                <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Batch Year *</label>
                <input value={form.batchYear} onChange={set('batchYear')} className="input w-full" placeholder="e.g. 2020" />
              </div>
              <div>
                <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Current Role *</label>
                <input value={form.currentRole} onChange={set('currentRole')} className="input w-full" placeholder="e.g. Senior Engineer" />
              </div>
              <div>
                <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Company *</label>
                <input value={form.company} onChange={set('company')} className="input w-full" placeholder="e.g. Tata Power" />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Quote / Story *</label>
                <textarea rows={3} value={form.quote} onChange={set('quote')} className="input w-full resize-none" placeholder="Share their story..." />
              </div>
              <div>
                <FileUpload
                  fieldName="photo"
                  accept="image/*"
                  maxSizeMB={5}
                  value={form.photoUrl}
                  onChange={(f) => setFile(f)}
                  label="Alumni Photo"
                  helpText="JPG, PNG, WebP, GIF — max 5 MB"
                />
              </div>
              <div>
                <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">LinkedIn URL</label>
                <input value={form.linkedinUrl} onChange={set('linkedinUrl')} className="input w-full" placeholder="https://linkedin.com/in/..." />
              </div>
            </div>
          )}

          {tab === 'openings' && (
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Title *</label>
                <input value={form.title} onChange={set('title')} className="input w-full" placeholder="e.g. Graduate Engineer Trainee" />
              </div>
              <div>
                <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Company *</label>
                <input value={form.company} onChange={set('company')} className="input w-full" placeholder="e.g. Tata Power" />
              </div>
              <div>
                <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Type *</label>
                <select value={form.type} onChange={set('type')} className="input w-full">
                  <option value="job">Job</option>
                  <option value="internship">Internship</option>
                  <option value="training">Training</option>
                </select>
              </div>
              <div>
                <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Location *</label>
                <input value={form.location} onChange={set('location')} className="input w-full" placeholder="e.g. Mumbai" />
              </div>
              <div>
                <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Mode *</label>
                <select value={form.mode} onChange={set('mode')} className="input w-full">
                  <option value="onsite">Onsite</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Description *</label>
                <textarea rows={3} value={form.description} onChange={set('description')} className="input w-full resize-none" placeholder="Describe the role..." />
              </div>
              <div>
                <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Apply URL *</label>
                <input value={form.applyUrl} onChange={set('applyUrl')} className="input w-full" placeholder="https://..." maxLength={500} />
              </div>
              <div>
                <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Deadline *</label>
                <input type="datetime-local" value={form.deadline} onChange={set('deadline')} className="input w-full" />
              </div>
              <div>
                <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Status</label>
                <select value={form.status} onChange={set('status')} className="input w-full">
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          )}

          {error && <p className="font-[Inter,system-ui,sans-serif] text-red-500 text-[14px] font-medium mt-4">{error}</p>}
          <button onClick={handleSave} disabled={saveMut.isPending} className="button-primary mt-6">
            {saveMut.isPending ? 'Saving…' : editing ? 'Update' : 'Create'}
          </button>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${section.label.toLowerCase()}…`}
          className="input w-full max-w-md"
        />
      </div>

      {/* Table */}
      {current.isLoading ? (
        <p className="font-[Inter,system-ui,sans-serif] text-ink-muted-80 text-[15px]">Loading…</p>
      ) : current.data.length === 0 ? (
        <p className="font-[Inter,system-ui,sans-serif] text-ink-muted-80 text-[15px]">
          No {section.label.toLowerCase()} yet. Click "+ New" to add one.
        </p>
      ) : (
        <div className="border border-divider-soft bg-white rounded-xl overflow-hidden shadow-sm">
          {tab === 'stats' && current.data.map((s, idx) => (
            <div key={s._id} className="flex items-center gap-4 px-4 sm:px-6 py-3 sm:py-4 border-b border-divider-soft last:border-b-0 hover:bg-[#fff]-parchment transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-ink">{s.academicYear}</p>
                <p className="font-[Inter,system-ui,sans-serif] text-[13px] text-ink-muted-80 mt-1">
                  {s.totalStudents} total · {s.placed} placed · Highest: {s.highestPackage} · Avg: {s.averagePackage}
                  {s.medianPackage ? ` · Median: ${s.medianPackage}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {section.orderable && (
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => handleReorder(idx, -1)} disabled={idx === 0} className="text-[10px] text-ink-muted-80 hover:text-ink disabled:opacity-30">▲</button>
                    <button onClick={() => handleReorder(idx, 1)} disabled={idx === current.data.length - 1} className="text-[10px] text-ink-muted-80 hover:text-ink disabled:opacity-30">▼</button>
                  </div>
                )}
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={!!s.published} onChange={() => handleTogglePublish('stats', s._id)} className="h-3.5 w-3.5" />
                  <span className="text-[12px] text-ink-muted-80">Pub</span>
                </label>
                <button onClick={() => openEdit(s)} className="font-[Inter,system-ui,sans-serif] text-[13px] font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors px-3 py-1.5 rounded-md">Edit</button>
                <button onClick={() => { if (window.confirm(`Delete ${s.academicYear}?`)) deleteMut.mutate(s._id) }} className="font-[Inter,system-ui,sans-serif] text-[13px] font-medium text-red-500/70 hover:text-red-500 transition-colors bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-md">Delete</button>
              </div>
            </div>
          ))}

          {tab === 'recruiters' && current.data.map((r, idx) => (
            <div key={r._id} className="flex items-center gap-4 px-4 sm:px-6 py-3 sm:py-4 border-b border-divider-soft last:border-b-0 hover:bg-[#fff]-parchment transition-colors">
              <div className="w-10 h-10 rounded-lg bg-soft-stone flex items-center justify-center flex-shrink-0 border border-hairline overflow-hidden">
                <SafeImage src={r.logoUrl} alt={r.name} className="w-full h-full object-cover">
                  <span className="font-mono text-[12px] font-bold text-ink">{r.name.slice(0,2).toUpperCase()}</span>
                </SafeImage>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-ink">{r.name}</p>
                <p className="font-[Inter,system-ui,sans-serif] text-[13px] text-ink-muted-80">{r.type === 'both' ? 'Placements & Internships' : r.type}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {section.orderable && (
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => handleReorder(idx, -1)} disabled={idx === 0} className="text-[10px] text-ink-muted-80 hover:text-ink disabled:opacity-30">▲</button>
                    <button onClick={() => handleReorder(idx, 1)} disabled={idx === current.data.length - 1} className="text-[10px] text-ink-muted-80 hover:text-ink disabled:opacity-30">▼</button>
                  </div>
                )}
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={!!r.published} onChange={() => handleTogglePublish('recruiters', r._id)} className="h-3.5 w-3.5" />
                  <span className="text-[12px] text-ink-muted-80">Pub</span>
                </label>
                <button onClick={() => openEdit(r)} className="font-[Inter,system-ui,sans-serif] text-[13px] font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors px-3 py-1.5 rounded-md">Edit</button>
                <button onClick={() => { if (window.confirm(`Delete ${r.name}?`)) deleteMut.mutate(r._id) }} className="font-[Inter,system-ui,sans-serif] text-[13px] font-medium text-red-500/70 hover:text-red-500 transition-colors bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-md">Delete</button>
              </div>
            </div>
          ))}

          {tab === 'placed-students' && current.data.map((s) => (
            <div key={s._id} className="flex items-center gap-4 px-4 sm:px-6 py-3 sm:py-4 border-b border-divider-soft last:border-b-0 hover:bg-[#fff]-parchment transition-colors">
              <div className="w-10 h-10 rounded-lg bg-soft-stone flex items-center justify-center flex-shrink-0 border border-hairline overflow-hidden">
                <SafeImage src={s.photoUrl} alt={s.studentName} className="w-full h-full object-cover">
                  <span className="font-mono text-[12px] font-bold text-ink">{s.studentName.slice(0,2).toUpperCase()}</span>
                </SafeImage>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-ink">{s.studentName}</p>
                <p className="font-[Inter,system-ui,sans-serif] text-[13px] text-ink-muted-80 mt-1">
                  {s.company} · {s.role} · {s.type} · Batch {s.batchYear}
                  {s.package ? ` · ${s.package}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={!!s.published} onChange={() => handleTogglePublish('placed-students', s._id)} className="h-3.5 w-3.5" />
                  <span className="text-[12px] text-ink-muted-80">Pub</span>
                </label>
                <button onClick={() => openEdit(s)} className="font-[Inter,system-ui,sans-serif] text-[13px] font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors px-3 py-1.5 rounded-md">Edit</button>
                <button onClick={() => { if (window.confirm(`Delete ${s.studentName}?`)) deleteMut.mutate(s._id) }} className="font-[Inter,system-ui,sans-serif] text-[13px] font-medium text-red-500/70 hover:text-red-500 transition-colors bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-md">Delete</button>
              </div>
            </div>
          ))}

          {tab === 'alumni' && current.data.map((a, idx) => (
            <div key={a._id} className="flex items-center gap-4 px-4 sm:px-6 py-3 sm:py-4 border-b border-divider-soft last:border-b-0 hover:bg-[#fff]-parchment transition-colors">
              <div className="w-10 h-10 rounded-lg bg-soft-stone flex items-center justify-center flex-shrink-0 border border-hairline overflow-hidden">
                <SafeImage src={a.photoUrl} alt={a.name} className="w-full h-full object-cover">
                  <span className="font-mono text-[12px] font-bold text-ink">{a.name.slice(0,2).toUpperCase()}</span>
                </SafeImage>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-ink">{a.name}</p>
                <p className="font-[Inter,system-ui,sans-serif] text-[13px] text-ink-muted-80 mt-1">
                  {a.currentRole} at {a.company} · Batch {a.batchYear}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {section.orderable && (
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => handleReorder(idx, -1)} disabled={idx === 0} className="text-[10px] text-ink-muted-80 hover:text-ink disabled:opacity-30">▲</button>
                    <button onClick={() => handleReorder(idx, 1)} disabled={idx === current.data.length - 1} className="text-[10px] text-ink-muted-80 hover:text-ink disabled:opacity-30">▼</button>
                  </div>
                )}
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={!!a.published} onChange={() => handleTogglePublish('alumni', a._id)} className="h-3.5 w-3.5" />
                  <span className="text-[12px] text-ink-muted-80">Pub</span>
                </label>
                <button onClick={() => openEdit(a)} className="font-[Inter,system-ui,sans-serif] text-[13px] font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors px-3 py-1.5 rounded-md">Edit</button>
                <button onClick={() => { if (window.confirm(`Delete ${a.name}?`)) deleteMut.mutate(a._id) }} className="font-[Inter,system-ui,sans-serif] text-[13px] font-medium text-red-500/70 hover:text-red-500 transition-colors bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-md">Delete</button>
              </div>
            </div>
          ))}

          {tab === 'openings' && current.data.map((o) => (
            <div key={o._id} className="flex items-center gap-4 px-4 sm:px-6 py-3 sm:py-4 border-b border-divider-soft last:border-b-0 hover:bg-[#fff]-parchment transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-ink">{o.title}</p>
                <p className="font-[Inter,system-ui,sans-serif] text-[13px] text-ink-muted-80 mt-1">
                  {o.company} · {o.location} · {o.mode} · {o.type} · {o.status}
                  {o.deadline ? ` · Due ${new Date(o.deadline).toLocaleDateString()}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={!!o.published} onChange={() => handleTogglePublish('openings', o._id)} className="h-3.5 w-3.5" />
                  <span className="text-[12px] text-ink-muted-80">Pub</span>
                </label>
                <button onClick={() => openEdit(o)} className="font-[Inter,system-ui,sans-serif] text-[13px] font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors px-3 py-1.5 rounded-md">Edit</button>
                <button onClick={() => { if (window.confirm(`Delete "${o.title}"?`)) deleteMut.mutate(o._id) }} className="font-[Inter,system-ui,sans-serif] text-[13px] font-medium text-red-500/70 hover:text-red-500 transition-colors bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-md">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

