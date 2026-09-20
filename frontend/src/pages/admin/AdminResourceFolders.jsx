import { useState, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Check, Trash2, Pencil, Plus, ExternalLink, GripVertical, X,
  Upload, Play, FileText, FolderOpen,
} from 'lucide-react'
import {
  getFolders, createFolder, updateFolder, deleteFolder,
  uploadToFolder, importPlaylistToFolder, reorderFolderItems,
  removeFolderItem, getFolder,
} from '../../api/folders'
import { getSubjects } from '../../api/subjects'
import { downloadResource } from '../../api/resources'
import ResourcePreviewDrawer from '../../components/ResourcePreviewDrawer'

const TYPES = ['notes', 'books', 'organisers', 'pyqs', 'yt playlist']
const SEMS = [1, 2, 3, 4, 5, 6, 7, 8]
const VISIBILITY = ['GLOBAL', 'BATCH']

export default function AdminResourceFolders() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ title: '', slug: '', description: '', semester: '', subject: '', visibility: 'BATCH' })
  const [editingFolder, setEditingFolder] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [orderedItems, setOrderedItems] = useState([])
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadMode, setUploadMode] = useState('file')
  const [driveLink, setDriveLink] = useState('')
  const [uploadMeta, setUploadMeta] = useState({ title: '', type: 'notes', dueDate: '' })
  const [playlistInput, setPlaylistInput] = useState('')
  const [playlistPrefix, setPlaylistPrefix] = useState('')
  const [uploading, setUploading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)
  const dragIndex = useRef(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [previewResource, setPreviewResource] = useState(null)

  const { data: foldersData, isLoading } = useQuery({
    queryKey: ['folders'],
    queryFn: () => getFolders().then(r => r.data),
  })
  const folders = foldersData?.data || []

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => getSubjects({ status: 'approved' }).then(r => r.data),
  })
  const subjects = subjectsData?.data || []

  const subjectsForSem = (sem) =>
    sem ? subjects.filter(s => s.semester === Number(sem)) : subjects

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const setMeta = (k) => (e) => setUploadMeta(f => ({ ...f, [k]: e.target.value }))

  const closeForm = () => {
    setShowForm(false)
    setEditingFolder(null)
    setForm({ title: '', slug: '', description: '', semester: '', subject: '', visibility: 'BATCH' })
  }

  const openCreate = () => {
    setEditingFolder(null)
    setForm({ title: '', slug: '', description: '', semester: '', subject: '', visibility: 'BATCH' })
    setShowForm(true)
  }

  const openEdit = (folder) => {
    setEditingFolder(folder)
    setForm({
      title: folder.title || '',
      slug: folder.slug || '',
      description: folder.description || '',
      semester: folder.semester || '',
      subject: folder.subject || '',
      visibility: folder.visibility || 'BATCH',
    })
    setShowForm(true)
  }

  const handleSaveFolder = async () => {
    if (!form.title) return setError('Title is required')
    setMessage('')
    try {
      if (editingFolder) {
        await updateFolder(editingFolder._id, form)
      } else {
        await createFolder(form)
      }
      qc.invalidateQueries({ queryKey: ['folders'] })
      closeForm()
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed')
    }
  }

  const handleDeleteFolder = async (folder) => {
    if (!window.confirm(`Delete folder "${folder.title}"? Resources uploaded to this folder will be removed from the folder view.`)) return
    setMessage('')
    try {
      await deleteFolder(folder._id)
      qc.invalidateQueries({ queryKey: ['folders'] })
      if (selectedFolder && selectedFolder._id === folder._id) setSelectedFolder(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed')
    }
  }

  const openFolder = async (folder) => {
    setMessage('')
    setSelectedFolder(folder)
    try {
      const detail = await getFolder(folder._id)
      setSelectedFolder(detail)
      setOrderedItems(detail.items || [])
      setUploadMeta({ title: '', type: 'notes', dueDate: '' })
      setPlaylistInput('')
      setPlaylistPrefix('')
      setUploadFile(null)
      setDriveLink('')
      setUploadMode('file')
    } catch (err) {
      setError(err.response?.data?.error || 'Could not open folder')
    }
  }

  const handleUpload = async () => {
    if (uploadMode === 'file' && !uploadFile) return
    if (uploadMode === 'link' && !driveLink.trim()) return
    if (!uploadMeta.title) return
    setUploading(true)
    setMessage('')
    try {
      const fd = new FormData()
      if (uploadMode === 'file') {
        fd.append('file', uploadFile)
      } else {
        fd.append('driveLink', driveLink.trim())
      }
      fd.append('title', uploadMeta.title)
      fd.append('type', uploadMeta.type)
      if (uploadMeta.dueDate) fd.append('dueDate', uploadMeta.dueDate)
      await uploadToFolder(selectedFolder._id, fd)
      qc.invalidateQueries({ queryKey: ['folder', selectedFolder._id] })
      qc.invalidateQueries({ queryKey: ['folders'] })
      const detail = await getFolder(selectedFolder._id)
      setSelectedFolder(detail)
      setOrderedItems(detail.items || [])
      setUploadFile(null)
      setDriveLink('')
      setUploadMeta({ title: '', type: 'notes', dueDate: '' })
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleImportPlaylist = async () => {
    if (!playlistInput) return
    setImporting(true)
    setMessage('')
    try {
      const res = await importPlaylistToFolder(selectedFolder._id, {
        playlistUrl: playlistInput,
        titlePrefix: playlistPrefix || undefined,
        subject: selectedFolder.subject || undefined,
        semester: selectedFolder.semester || undefined,
      })
      qc.invalidateQueries({ queryKey: ['folder', selectedFolder._id] })
      qc.invalidateQueries({ queryKey: ['folders'] })
      const detail = await getFolder(selectedFolder._id)
      setSelectedFolder(detail)
      setOrderedItems(detail.items || [])
      setPlaylistInput('')
      setPlaylistPrefix('')
      setMessage(`Imported ${res.data.count} lectures into "${selectedFolder.title}".`)
    } catch (err) {
      setError(err.response?.data?.error || 'Playlist import failed')
    } finally {
      setImporting(false)
    }
  }

  const onDragStart = (i) => { dragIndex.current = i }
  const onDragOver = (e) => e.preventDefault()
  const onDrop = (targetIdx) => {
    const from = dragIndex.current
    if (from == null || from === targetIdx) return
    const arr = [...orderedItems]
    const [moved] = arr.splice(from, 1)
    arr.splice(targetIdx, 0, moved)
    setOrderedItems(arr)
    dragIndex.current = null
  }

  const handleSaveOrder = async () => {
    setSavingOrder(true)
    try {
      await reorderFolderItems(selectedFolder._id, orderedItems.map(i => ({ ref: i.ref, type: i.type })))
      qc.invalidateQueries({ queryKey: ['folder', selectedFolder._id] })
      qc.invalidateQueries({ queryKey: ['folders'] })
      const detail = await getFolder(selectedFolder._id)
      setSelectedFolder(detail)
      setOrderedItems(detail.items || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save order')
    } finally {
      setSavingOrder(false)
    }
  }

  const handleRemoveItem = async (item) => {
    if (!window.confirm('Remove this item from the folder? (the file/lecture itself is kept)')) return
    setMessage('')
    try {
      await removeFolderItem(selectedFolder._id, item.ref)
      setOrderedItems(ar => ar.filter(i => !(i.ref === item.ref && i.type === item.type)))
      qc.invalidateQueries({ queryKey: ['folder', selectedFolder._id] })
      qc.invalidateQueries({ queryKey: ['folders'] })
    } catch (err) {
      setError(err.response?.data?.error || 'Could not remove item')
    }
  }

  const bySem = {}
  folders.forEach(f => { (bySem[f.semester || 0] = bySem[f.semester || 0] || []).push(f) })
  const semesters = Object.keys(bySem).map(Number).sort((a, b) => a - b)

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="font-[Inter,system-ui,sans-serif] font-semibold text-[28px] tracking-tight text-ink">Resource Folders</h1>
        <button onClick={openCreate} className="button-primary !px-5 !py-2.5">
          <Plus size={16} className="inline mr-1" /> New Folder
        </button>
      </div>

      {error && <p className="font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-red-500 mb-4">{error}</p>}
      {message && <p className="font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-deep-green mb-4">{message}</p>}

      {showForm && (
        <div className="border-t-2 border-primary bg-white p-6 mb-8 rounded-xl shadow-sm">
          <h2 className="font-[Inter,system-ui,sans-serif] font-semibold text-[18px] text-ink mb-6">{editingFolder ? 'Edit Folder' : 'New Folder'}</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Title *</label>
              <input value={form.title} onChange={set('title')} className="input w-full" placeholder="e.g. Power System I — Lectures & Notes, Sem 5" />
            </div>
            <div>
              <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Slug</label>
              <input value={form.slug} onChange={set('slug')} className="input w-full" placeholder="auto-generated if left blank" />
            </div>
            <div>
              <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Semester</label>
              <select value={form.semester} onChange={set('semester')} className="input w-full">
                <option value="">— none —</option>
                {SEMS.map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Subject</label>
              <select value={form.subject} onChange={set('subject')} className="input w-full">
                <option value="">— select subject —</option>
                {subjectsForSem(form.semester).map(s => <option key={s._id} value={s.name}>{s.name} ({s.code})</option>)}
              </select>
            </div>
            <div>
              <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Visibility</label>
              <select value={form.visibility} onChange={set('visibility')} className="input w-full">
                {VISIBILITY.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Description</label>
              <textarea value={form.description} onChange={set('description')} rows={3} className="input w-full resize-none" placeholder="What this folder/series contains..." />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={handleSaveFolder} className="button-primary">
              {editingFolder ? 'Update Folder' : 'Create Folder'}
            </button>
            <button onClick={closeForm} className="font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 px-4 py-2.5 hover:text-ink transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="font-[Inter,system-ui,sans-serif] text-ink-muted-80 text-[15px]">Loading…</p>
      ) : semesters.length === 0 ? (
        <p className="font-[Inter,system-ui,sans-serif] text-ink-muted-80 text-[15px]">No folders yet. Create one above.</p>
      ) : (
        semesters.map(sem => (
          <div key={sem} className="border border-divider-soft bg-white rounded-xl overflow-hidden shadow-sm mb-6">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-divider-soft font-[Inter,system-ui,sans-serif] font-medium text-[18px] text-ink">
              {sem === 0 ? 'No Semester' : `Semester ${sem}`}
            </div>
            <div className="divide-y divide-hairline">
              {bySem[sem].map(f => (
                <div key={f._id} className="flex items-center gap-4 px-4 sm:px-6 py-3 sm:py-4 hover:bg-[#fff]-parchment transition-colors">
                  <FolderOpen size={18} className="text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium text-ink truncate">{f.title}</p>
                    <p className="font-[Inter,system-ui,sans-serif] text-[13px] font-medium text-ink-muted-80 mt-1 truncate">
                      {f.subject || '—'} · {(f.items?.length || 0)} items · {f.visibility}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0 items-center">
                    <button onClick={() => openEdit(f)} className="font-[Inter,system-ui,sans-serif] text-[13px] font-medium text-blue-500/70 hover:text-blue-500 transition-colors bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-md flex items-center gap-1">
                      <Pencil size={12} /> Edit
                    </button>
                    <button onClick={() => openFolder(f)} className="font-[Inter,system-ui,sans-serif] text-[13px] font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors px-3 py-1.5 rounded-md flex items-center gap-1">
                      <GripVertical size={12} /> Open
                    </button>
                    <button onClick={() => handleDeleteFolder(f)} className="font-[Inter,system-ui,sans-serif] text-[13px] font-medium text-red-500/70 hover:text-red-500 transition-colors bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-md flex items-center gap-1">
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {selectedFolder && (
        <div className="border-t-2 border-primary/30 bg-white p-6 mb-8 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-[Inter,system-ui,sans-serif] font-semibold text-[20px] text-ink">
              {selectedFolder.title} <span className="font-mono text-[11px] text-ink-muted-80 align-top">/{selectedFolder.slug}</span>
            </h2>
            <button onClick={() => setSelectedFolder(null)} className="font-[Inter,system-ui,sans-serif] text-[13px] font-medium text-ink-muted-80 hover:text-ink px-2 py-1 rounded-md hover:bg-soft-stone transition-colors">
              <X size={14} />
            </button>
          </div>

          <p className="font-[Inter,system-ui,sans-serif] text-[13px] text-ink-muted-80 mb-6">
            {selectedFolder.subject && `Subject: ${selectedFolder.subject} · `}
            {selectedFolder.semester && `Semester ${selectedFolder.semester} · `}
            {selectedFolder.visibility} · {(selectedFolder.items?.length || 0)} items
          </p>

          <div className="flex gap-3 mb-6 flex-wrap">
            <button
              onClick={handleSaveOrder}
              disabled={savingOrder || orderedItems.length === 0}
              className="button-primary"
            >
              {savingOrder ? 'Saving order…' : 'Save Order'}
            </button>
          </div>

          <div className="border border-divider-soft rounded-xl overflow-hidden shadow-sm mb-8">
            {orderedItems.length === 0 ? (
              <p className="font-[Inter,system-ui,sans-serif] text-ink-muted-80 text-[15px] p-6">No items yet. Upload a file or import a playlist below.</p>
            ) : (
              orderedItems.map((item, i) => (
                <div
                  key={item.ref + '-' + item.type}
                  draggable
                  onDragStart={() => onDragStart(i)}
                  onDragOver={onDragOver}
                  onDrop={() => onDrop(i)}
                  className="flex items-center gap-4 px-4 sm:px-6 py-3 sm:py-4 border-b border-divider-soft last:border-b-0 hover:bg-[#fff]-parchment transition-colors cursor-grab"
                >
                  <span className="cursor-grab active:cursor-grabbing" title="Drag to reorder">
                    <GripVertical size={18} className="text-ink-muted-80" />
                  </span>
                  {item.type === 'resource' ? (
                    <FileText size={20} className="text-primary flex-shrink-0" />
                  ) : (
                    <img
                      src={item.thumbnail || `https://img.youtube.com/vi/${item.data?.youtubeVideoId}/hqdefault.jpg`}
                      alt={item.title}
                      className="w-10 h-7 object-cover rounded flex-shrink-0"
                      onError={(e) => {
                        if (item.data?.youtubeVideoId) e.target.src = `https://img.youtube.com/vi/${item.data.youtubeVideoId}/hqdefault.jpg`
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium text-ink truncate">{item.title}</p>
                    <p className="font-[Inter,system-ui,sans-serif] text-[12px] text-ink-muted-80 mt-1">
                      <span className="uppercase text-primary font-medium">{item.type}</span>
                      {item.type === 'lecture' && item.data?.lectureNumber ? ` · Lec ${item.data.lectureNumber}` : ''}
                      {item.data?.subject ? ` · ${item.data.subject}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0 items-center">
                    {item.type === 'lecture' && item.data?.youtubeVideoId && (
                      <a href={`https://www.youtube.com/watch?v=${item.data.youtubeVideoId}`} target="_blank" rel="noreferrer" className="font-[Inter,system-ui,sans-serif] text-[13px] font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors px-3 py-1.5 rounded-md flex items-center gap-1">
                        <ExternalLink size={12} /> YouTube
                      </a>
                    )}
                    {item.type === 'resource' && item.data?._id && (
                      <>
                        <button type="button" onClick={() => setPreviewResource(item.data)} className="font-[Inter,system-ui,sans-serif] text-[13px] font-medium text-blue-500/70 hover:text-blue-500 transition-colors bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-md flex items-center gap-1">
                          <FileText size={12} /> Preview
                        </button>
                        <a href={downloadResource(item.data._id)} className="font-[Inter,system-ui,sans-serif] text-[13px] font-medium text-ink-muted-80 hover:text-ink transition-colors bg-soft-stone hover:bg-soft-stone/50 px-3 py-1.5 rounded-md flex items-center gap-1">
                          Download
                        </a>
                      </>
                    )}
                    <button onClick={() => handleRemoveItem(item)} className="font-[Inter,system-ui,sans-serif] text-[13px] font-medium text-red-500/70 hover:text-red-500 transition-colors bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-md flex items-center gap-1">
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-8 pt-6 border-t border-divider-soft">
            <div className="border border-divider-soft bg-[#fff]-parchment/40 rounded-xl p-5">
              <h3 className="font-[Inter,system-ui,sans-serif] font-semibold text-[16px] text-ink mb-4 flex items-center gap-2"><Upload size={16} /> Add File to Folder</h3>
              <div className="flex gap-1 mb-4">
                <button
                  type="button"
                  onClick={() => { setUploadMode('file'); setUploadFile(null) }}
                  className={`flex-1 font-[Inter,system-ui,sans-serif] text-[13px] font-medium px-3 py-2 rounded-md transition-colors ${
                    uploadMode === 'file'
                      ? 'bg-primary text-white'
                      : 'bg-soft-stone text-ink-muted-80 hover:text-ink'
                  }`}
                >
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => { setUploadMode('link'); setDriveLink('') }}
                  className={`flex-1 font-[Inter,system-ui,sans-serif] text-[13px] font-medium px-3 py-2 rounded-md transition-colors ${
                    uploadMode === 'link'
                      ? 'bg-primary text-white'
                      : 'bg-soft-stone text-ink-muted-80 hover:text-ink'
                  }`}
                >
                  Drive Link
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Title *</label>
                  <input value={uploadMeta.title} onChange={setMeta('title')} className="input w-full" placeholder="File title" />
                </div>
                <div>
                  <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Type</label>
                  <select value={uploadMeta.type} onChange={setMeta('type')} className="input w-full">
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                {uploadMode === 'file' ? (
                  <div>
                    <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">File (PDF or image) *</label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={e => setUploadFile(e.target.files[0])}
                      className="mt-1 font-[Inter,system-ui,sans-serif] text-[14px] text-ink-muted-80 file:mr-4 file:bg-[#fff]-parchment file:text-ink file:border file:border-divider-soft file:rounded-lg file:px-4 file:py-2 file:cursor-pointer"
                    />
                    {uploadFile && <p className="font-[Inter,system-ui,sans-serif] text-[13px] font-medium text-green-500 mt-2 truncate"><Check size={14} className="inline mr-1" />{uploadFile.name} ({(uploadFile.size / 1024).toFixed(0)} KB)</p>}
                  </div>
                ) : (
                  <div>
                    <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Google Drive Link *</label>
                    <input
                      type="url"
                      value={driveLink}
                      onChange={e => setDriveLink(e.target.value)}
                      className="input w-full"
                      placeholder="https://drive.google.com/file/d/..."
                    />
                    <p className="font-[Inter,system-ui,sans-serif] text-[12px] text-ink-muted-80 mt-1">
                      Downloads the file from Google Drive and uploads it to the folder.
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={handleUpload}
                disabled={uploading || (uploadMode === 'file' && !uploadFile) || (uploadMode === 'link' && !driveLink.trim()) || !uploadMeta.title}
                className="button-primary mt-4"
              >
                {uploading ? 'Uploading…' : 'Upload to Folder'}
              </button>
            </div>

            <div className="border border-divider-soft bg-[#fff]-parchment/40 rounded-xl p-5">
              <h3 className="font-[Inter,system-ui,sans-serif] font-semibold text-[16px] text-ink mb-4 flex items-center gap-2"><Play size={16} /> Import YouTube Playlist</h3>
              <div className="space-y-4">
                <div>
                  <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Playlist URL or ID *</label>
                  <input value={playlistInput} onChange={e => setPlaylistInput(e.target.value)} className="input w-full" placeholder="https://www.youtube.com/playlist?list=..." />
                </div>
                <div>
                  <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">Title prefix (optional)</label>
                  <input value={playlistPrefix} onChange={e => setPlaylistPrefix(e.target.value)} className="input w-full" placeholder="e.g. Module 2 — " />
                </div>
                <p className="font-[Inter,system-ui,sans-serif] text-[12px] text-ink-muted-80">
                  Videos are added in playlist order as numbered lectures. Maximum 500 videos per import. Duplicates within the folder are skipped.
                </p>
              </div>
              <button
                onClick={handleImportPlaylist}
                disabled={importing || !playlistInput}
                className="button-primary mt-4"
              >
                {importing ? 'Importing…' : 'Import Playlist'}
              </button>
            </div>
          </div>
        </div>
      )}
      <ResourcePreviewDrawer
        resource={previewResource}
        onClose={() => setPreviewResource(null)}
      />
    </div>
  )
}
