import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRooms, createRoom, updateRoom, deleteRoom } from '../../api/rooms'
import { Plus, Edit2, Trash2, Users, MessageSquare } from 'lucide-react'

const BLANK = { name: '', description: '', icon: '', color: '#4F46E5', isPopular: false, isActive: true }

export default function AdminRooms() {
  const qc = useQueryClient()
  const [form, setForm] = useState(BLANK)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['rooms', 'admin'],
    queryFn: () => getRooms().then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: (d) => createRoom(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] })
      setForm(BLANK); setEditing(null); setShowForm(false); setError('')
    },
    onError: (err) => setError(err.response?.data?.error || 'Save failed'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, ...d }) => updateRoom(id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] })
      setEditing(null); setShowForm(false); setError('')
    },
    onError: (err) => setError(err.response?.data?.error || 'Save failed'),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => deleteRoom(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
    onError: (err) => setError(err.response?.data?.error || 'Delete failed'),
  })

  const handleSave = () => {
    if (!form.name) return setError('Name is required')
    setError('')
    if (editing) {
      updateMut.mutate({ id: editing._id, ...form })
    } else {
      createMut.mutate(form)
    }
  }

  const openCreate = () => { setEditing(null); setForm(BLANK); setShowForm(true); setError('') }
  const openEdit = (r) => {
    setEditing(r)
    setForm({ name: r.name || '', description: r.description || '', icon: r.icon || '', color: r.color || '#4F46E5', isPopular: !!r.isPopular, isActive: r.isActive !== false })
    setShowForm(true); setError('')
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const rooms = data?.data || []

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="font-display font-semibold text-[28px] tracking-tight text-ink">Rooms</h1>
        <button onClick={openCreate} className="button-primary !px-5 !py-2.5">
          {editing ? 'Edit Form' : '+ New Room'}
        </button>
      </div>

      {showForm && (
        <div className="border border-divider-soft bg-white p-6 mb-8 rounded-xl shadow-sm">
          <h2 className="font-display font-semibold text-[18px] text-ink mb-6">{editing ? 'Edit Room' : 'New Room'}</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Name *</label>
              <input value={form.name} onChange={set('name')} className="input w-full" placeholder="e.g. Electrical Machines" />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Icon</label>
              <input value={form.icon} onChange={set('icon')} className="input w-full" placeholder="e.g. zap" />
            </div>
            <div>
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Color</label>
              <div className="flex gap-2">
                <input type="color" value={form.color} onChange={set('color')} className="h-10 w-14 rounded-md border border-divider-soft bg-canvas p-1 cursor-pointer" />
                <input value={form.color} onChange={set('color')} className="input flex-1" placeholder="#4F46E5" />
              </div>
            </div>
            <div className="flex items-center gap-6 pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPopular} onChange={set('isPopular')} className="w-4 h-4 rounded border-divider-soft text-primary focus:ring-primary" />
                <span className="font-sans text-[14px] font-medium text-ink">Popular</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={set('isActive')} className="w-4 h-4 rounded border-divider-soft text-primary focus:ring-primary" />
                <span className="font-sans text-[14px] font-medium text-ink">Active</span>
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className="block font-sans text-[14px] font-medium text-ink-muted-80 mb-1">Description</label>
              <textarea rows={3} value={form.description} onChange={set('description')} className="input w-full resize-none" placeholder="Room description..." />
            </div>
          </div>
          {error && <p className="font-sans text-red-500 text-[14px] font-medium mt-4">{error}</p>}
          <div className="flex gap-3 mt-6">
            <button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending || !form.name} className="button-primary">
              {createMut.isPending || updateMut.isPending ? 'Saving…' : (editing ? 'Update Room' : 'Create Room')}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); setForm(BLANK); setError('') }} className="button-pill-outline">Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? <p className="font-sans text-ink-muted-80 text-[15px]">Loading rooms…</p>
        : rooms.length === 0 ? <p className="font-sans text-ink-muted-80 text-[15px]">No rooms found. Create one above.</p>
        : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {rooms.map(room => (
              <div key={room._id} className="border border-divider-soft bg-white rounded-xl p-5 shadow-sm hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: room.color }}>
                      {room.icon ? <span className="text-xl">{room.icon}</span> : '#'}
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-ink">{room.name}</p>
                      <p className="font-sans text-[12px] text-ink-muted-80 capitalize">{room.isActive !== false ? 'Active' : 'Inactive'} {room.isPopular ? '· Popular' : ''}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(room)} className="p-1.5 rounded-md text-ink-muted-80 hover:text-primary hover:bg-primary/10 transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => { if (window.confirm(`Delete "${room.name}"?`)) deleteMut.mutate(room._id) }} className="p-1.5 rounded-md text-ink-muted-80 hover:text-red-500 hover:bg-red-500/10 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="font-sans text-[14px] text-ink-muted-80 line-clamp-2 mb-4">{room.description || '—'}</p>
                <div className="flex items-center gap-4 font-mono text-[11px] text-slate">
                  {typeof room.postCount === 'number' && <span className="flex items-center gap-1"><MessageSquare size={12} /> {room.postCount}</span>}
                  {typeof room.memberCount === 'number' && <span className="flex items-center gap-1"><Users size={12} /> {room.memberCount}</span>}
                  {room.createdAt && <span className="ml-auto">{new Date(room.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}
