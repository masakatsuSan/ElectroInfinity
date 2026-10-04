import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getResources,
  updateResource,
  deleteResource,
  getUploadSignature,
  uploadToCloudinaryDirect,
  createResource,
  isGoogleDriveUrl,
  isGoogleFolderUrl,
  isGoogleNonFileUrl,
  extractGoogleDriveFileId,
} from '../../api/resources'
import { getSubjects } from '../../api/subjects'
import { Check } from 'lucide-react'
import { useToast } from '../../context/ToastContext'

const TYPES = ['notes','books','organisers','pyqs','yt playlist']
const SEMS  = [1,2,3,4,5,6,7,8]

// Cloudinary's Free plan caps raw (PDF) uploads at 10 MB — well below multer's
// 20 MB limit. Validate client-side so the failure is instant and readable
// instead of a slow rejection after the whole file has travelled.
const MAX_PDF_SIZE = 10 * 1024 * 1024

// Mirrors resolveExternalLink() in backend/src/utils/resourceLinks.js so the admin
// finds out about a folder link (or an unparseable Drive URL) before submitting
// instead of after a round trip.
function validateFileLink(rawLink) {
  const link = String(rawLink || '').trim()
  if (!link) return 'Drive link is required'
  if (!/^https?:\/\//i.test(link)) return 'Link must start with http:// or https://'
  if (isGoogleFolderUrl(link)) return 'That is a Google Drive folder link — copy the link to a single file'
  if (isGoogleNonFileUrl(link)) return 'That is a Google Form or Drawing — publish or export it as a file first'
  if (isGoogleDriveUrl(link) && !extractGoogleDriveFileId(link)) {
    return 'Could not read a Google Drive file ID from that link — copy the "Share" link from Drive'
  }
  return ''
}

export default function AdminResources() {
  const qc = useQueryClient()
  const { showToast } = useToast()
  const [filterType, setFilterType] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', type: 'notes', semester: '', subject: '' })
  const [editFile, setEditFile] = useState(null)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ title: '', type: 'notes', semester: '', subject: '' })
  const [file, setFile] = useState(null)
  const [fileUrl, setFileUrl] = useState('')
  const [sourceType, setSourceType] = useState('file')
  const [editError, setEditError] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadPhase, setUploadPhase] = useState('') // '' | 'signature' | 'uploading' | 'saving'

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
      showToast('Resource updated successfully!')
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
    if (!form.title) return setError('Title is required')
    if (sourceType === 'file' && !file) return setError('File is required')
    if (sourceType === 'link') {
      const linkError = validateFileLink(fileUrl)
      if (linkError) return setError(linkError)
    }
    setError('')
    setProgress(0)
    setUploading(true)

    try {
      let uploaded = null

      if (sourceType === 'file') {
        // ── Validate BEFORE anything is sent ──────────────────────────
        if (file.type !== 'application/pdf') {
          return setError('Only PDF files are allowed — please choose a .pdf file.')
        }
        if (file.size > MAX_PDF_SIZE) {
          return setError(`"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB — the maximum is 10 MB.`)
        }

        // ── 1. One-time signature from our API (secret stays server-side) ──
        setUploadPhase('signature')
        const signature = await getUploadSignature()

        // ── 2. Direct upload to Cloudinary with live progress ─────────
        // The bytes go straight to Cloudinary and never through the Render
        // server, so this cannot hit the API's 30s timeout or wait behind a
        // free-dyno cold start.
        setUploadPhase('uploading')
        const response = await uploadToCloudinaryDirect(file, signature, setProgress)
        const cloud = response.data

        uploaded = {
          fileUrl: cloud.secure_url,
          publicId: cloud.public_id,
          fileName: file.name,
        }
      } else {
        // Drive link: stored as a plain link; the backend normalises it to the
        // direct-download URL and rejects folder links (validated above).
        uploaded = { fileUrl: fileUrl.trim(), publicId: '', fileName: '' }
      }

      // ── 3. Save the resource record in MongoDB ─────────────────────
      setUploadPhase('saving')
      await createResource({
        title: form.title,
        type: form.type,
        semester: form.semester ? Number(form.semester) : undefined,
        subject: form.subject || '',
        fileUrl: uploaded.fileUrl,
        publicId: uploaded.publicId,
        fileName: uploaded.fileName,
      })

      qc.invalidateQueries({ queryKey: ['resources'] })
      setForm({ title: '', type: 'notes', semester: '', subject: '' })
      setFile(null)
      setFileUrl('')
      setSourceType('file')
      setShowForm(false)
      showToast('Resource uploaded successfully!')
    } catch (err) {
      // Surface the real reason (Cloudinary rejection, validation, network)
      // instead of a blanket "Internal error".
      const data = err?.response?.data
      const message =
        data?.error ||
        (err?.code === 'ECONNABORTED' || String(err?.message || '').includes('timeout')
          ? 'Upload timed out — check your connection and try again'
          : null) ||
        err?.message ||
        'Upload failed'
      setError(typeof message === 'string' ? message : 'Upload failed')
    } finally {
      setUploading(false)
      setUploadPhase('')
      setProgress(0)
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
        <h1 className="font-[Inter,system-ui,sans-serif] font-semibold text-[28px] tracking-tight text-ink">Resources</h1>
        <button
          onClick={() => setShowForm(v => !v)}
          className="button-primary !px-5 !py-2.5"
        >
          {showForm ? 'Cancel' : '+ Upload File'}
        </button>
      </div>

      {/* Edit form */}
      {editingId && (
        <div className="border border-primary/30 bg-white p-6 mb-8 rounded-xl shadow-sm">
          <h2 className="font-[Inter,system-ui,sans-serif] font-semibold text-[18px] text-ink mb-6">Edit Resource</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Title *</label>
              <input value={editForm.title} onChange={set('editForm', 'title')} className="w-full bg-[#fff] border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-[Inter,system-ui,sans-serif] text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Type *</label>
              <select value={editForm.type} onChange={set('editForm', 'type')} className="w-full bg-[#fff] border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-[Inter,system-ui,sans-serif] text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Semester</label>
              <select value={editForm.semester} onChange={set('editForm', 'semester')} className="w-full bg-[#fff] border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-[Inter,system-ui,sans-serif] text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                <option value="">— none —</option>
                {SEMS.map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Subject</label>
              <select value={editForm.subject} onChange={set('editForm', 'subject')} className="w-full bg-[#fff] border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-[Inter,system-ui,sans-serif] text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                <option value="">— select subject —</option>
                {(editForm.semester ? subjects.filter(s => s.semester === Number(editForm.semester)) : subjects).map(s => (
                  <option key={s._id} value={s.name}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Replace file (optional)</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={e => setEditFile(e.target.files[0])}
                className="mt-1 font-[Inter,system-ui,sans-serif] text-[14px] text-ink-muted-80 file:mr-4 file:bg-[#fff]-parchment file:text-ink file:border file:border-divider-soft file:rounded-lg file:px-4 file:py-2 file:cursor-pointer"
              />
              {editFile && (
                <p className="font-[Inter,system-ui,sans-serif] text-[13px] font-medium text-green-500 mt-2 truncate">
                  <Check size={14} /> {editFile.name} ({(editFile.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>
          </div>
          {editError && <p className="font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-red-500 mt-3">{editError}</p>}
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
              className="font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 px-4 py-2.5 hover:text-ink transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Upload form */}
      {showForm && (
        <div className="border border-divider-soft bg-white p-6 mb-8 rounded-xl shadow-sm">
          <h2 className="font-[Inter,system-ui,sans-serif] font-semibold text-[18px] text-ink mb-6">Upload Resource</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Title *</label>
              <input value={form.title} onChange={set('title')} className="w-full bg-[#fff] border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-[Inter,system-ui,sans-serif] text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="e.g. Power Systems I — Unit 1 Notes" />
            </div>
            <div>
              <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Type *</label>
              <select value={form.type} onChange={set('type')} className="w-full bg-[#fff] border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-[Inter,system-ui,sans-serif] text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Semester</label>
              <select value={form.semester} onChange={set('semester')} className="w-full bg-[#fff] border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-[Inter,system-ui,sans-serif] text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                <option value="">— none —</option>
                {SEMS.map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Subject</label>
              <select value={form.subject} onChange={set('subject')} className="w-full bg-[#fff] border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-[Inter,system-ui,sans-serif] text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                <option value="">— select subject —</option>
                {(form.semester ? subjects.filter(s => s.semester === Number(form.semester)) : subjects).map(s => (
                  <option key={s._id} value={s.name}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-2">Source *</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setSourceType('file'); setFile(null); setFileUrl('') }}
                  className={`font-[Inter,system-ui,sans-serif] text-[14px] font-medium px-5 py-2.5 rounded-lg border transition-all duration-150 ${
                    sourceType === 'file'
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-ink border-divider-soft hover:border-ink/30'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => { setSourceType('link'); setFile(null); setFileUrl('') }}
                  className={`font-[Inter,system-ui,sans-serif] text-[14px] font-medium px-5 py-2.5 rounded-lg border transition-all duration-150 ${
                    sourceType === 'link'
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-ink border-divider-soft hover:border-ink/30'
                  }`}
                >
                  Drive Link
                </button>
              </div>
            </div>
            {sourceType === 'file' ? (
              <div>
                <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">File (PDF, max 10 MB) *</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={e => { setFile(e.target.files[0]); setError('') }}
                  className="mt-1 font-[Inter,system-ui,sans-serif] text-[14px] text-ink-muted-80 file:mr-4 file:bg-[#fff]-parchment file:text-ink file:border file:border-divider-soft file:rounded-lg file:px-4 file:py-2 file:cursor-pointer"
                />
              </div>
            ) : (
              <div>
                <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Drive Link *</label>
                <input
                  type="url"
                  value={fileUrl}
                  onChange={e => { setFileUrl(e.target.value); setError('') }}
                  placeholder="https://drive.google.com/file/d/FILE_ID/view"
                  className="w-full bg-[#fff] border border-divider-soft rounded-lg px-4 py-2.5 text-[15px] font-[Inter,system-ui,sans-serif] text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <p className="font-[Inter,system-ui,sans-serif] text-[12px] text-ink-muted-80 mt-2">
                  Paste the link to a <strong>single file</strong> (not a folder), with sharing set to
                  &ldquo;Anyone with the link&rdquo;. Drive links are normalised to their direct-download
                  URL and the Download button sends the browser straight to Drive &mdash; for the most
                  reliable downloads, upload the file instead so it is stored on Cloudinary.
                </p>
              </div>
            )}
          </div>
          {sourceType === 'file' && file && (
            <p className="font-[Inter,system-ui,sans-serif] text-[13px] font-medium text-green-500 mt-3 truncate">
              <Check size={14} /> {file.name} ({file.size > 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `${(file.size / 1024).toFixed(0)} KB`})
            </p>
          )}
          {uploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-[Inter,system-ui,sans-serif] text-[13px] font-medium text-ink-muted-80">
                  {uploadPhase === 'signature' && 'Generating secure upload signature…'}
                  {uploadPhase === 'uploading' && 'Uploading to Cloudinary…'}
                  {uploadPhase === 'saving' && 'Saving resource…'}
                </span>
                {uploadPhase === 'uploading' && (
                  <span className="font-[Inter,system-ui,sans-serif] text-[13px] font-semibold text-primary">{progress}%</span>
                )}
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-200"
                  style={{ width: `${uploadPhase === 'uploading' ? progress : uploadPhase === 'signature' ? 5 : 90}%` }}
                />
              </div>
            </div>
          )}
          {error && <p className="font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-red-500 mt-3">{error}</p>}
          <button
            onClick={handleUpload}
            disabled={uploading || (sourceType === 'file' ? !file : !fileUrl.trim()) || !form.title}
            className="button-primary mt-6"
          >
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-divider-soft mb-6 overflow-x-auto pb-1">
        {['', ...TYPES].map(t => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`font-[Inter,system-ui,sans-serif] text-[14px] font-medium capitalize px-4 py-2 flex-none border-b-2 transition-colors rounded-t-md ${
              filterType === t ? 'text-ink border-primary bg-white' : 'text-ink-muted-80 border-transparent hover:text-ink hover:bg-white/50'
            }`}
          >
            {t.replace('_', ' ') || 'All'}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <p className="font-[Inter,system-ui,sans-serif] text-ink-muted-80 text-[15px]">Loading…</p>
      ) : resources.length === 0 ? (
        <p className="font-[Inter,system-ui,sans-serif] text-ink-muted-80 text-[15px]">No resources yet. Upload one above.</p>
      ) : (
        <div className="border border-divider-soft bg-white rounded-xl overflow-hidden shadow-sm">
          {resources.map(r => (
            <div key={r._id} className="flex items-center gap-4 px-4 sm:px-6 py-3 sm:py-4 border-b border-divider-soft last:border-b-0 hover:bg-[#fff]-parchment transition-colors">
              <span className="font-[Inter,system-ui,sans-serif] text-[11px] font-semibold text-primary uppercase tracking-widest w-24 flex-shrink-0">{r.type.replace('_', ' ')}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-ink truncate">{r.title}</p>
                <p className="font-[Inter,system-ui,sans-serif] text-[13px] font-medium text-ink-muted-80 mt-1">
                  {r.semester ? `Sem ${r.semester} · ` : ''}{r.fileName} · {r.downloadCount} downloads
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0 items-center">
                <button
                  onClick={() => openEdit(r)}
                  className="font-[Inter,system-ui,sans-serif] text-[13px] font-medium text-blue-500/70 hover:text-blue-500 transition-colors bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-md"
                >Edit</button>
                <button
                  onClick={() => { if (window.confirm('Delete this file?')) deleteMut.mutate(r._id) }}
                  className="font-[Inter,system-ui,sans-serif] text-[13px] font-medium text-red-500/70 hover:text-red-500 transition-colors bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-md"
                >Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
