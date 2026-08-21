import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getContacts, updateContact, deleteContact } from '../../api/contact'

const TABS = ['', 'new', 'read', 'archived']

export default function AdminContact() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState('')
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', filter],
    queryFn: () => getContacts(filter ? { status: filter } : {}).then(r => r.data),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, ...d }) => updateContact(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contacts'] }); setError('') },
    onError: (err) => setError(err.response?.data?.error || 'Update failed'),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => deleteContact(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
    onError: (err) => setError(err.response?.data?.error || 'Delete failed'),
  })

  const markRead = (c) => updateMut.mutate({ id: c._id, status: c.status === 'new' ? 'read' : 'read', isReplied: c.isReplied })
  const archive = (c) => updateMut.mutate({ id: c._id, status: 'archived' })
  const toggleReplied = (c) => updateMut.mutate({ id: c._id, isReplied: !c.isReplied })

  const contacts = data?.data || []

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="font-display font-semibold text-[28px] tracking-tight text-ink">Contact Inbox</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 border-b border-divider-soft">
        {TABS.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`font-sans text-[14px] font-medium px-4 py-2 rounded-full transition-all whitespace-nowrap ${filter === t ? 'bg-primary text-white' : 'bg-soft-stone text-ink-muted-80 hover:text-ink'}`}>
            {t ? `${t.charAt(0).toUpperCase() + t.slice(1)}` : 'All Messages'}
          </button>
        ))}
      </div>

      {error && <p className="font-sans text-red-500 text-[14px] font-medium mb-4">{error}</p>}

      {isLoading ? <p className="font-sans text-ink-muted-80 text-[15px]">Loading messages…</p>
        : contacts.length === 0 ? <p className="font-sans text-ink-muted-80 text-[15px]">No messages in this view.</p>
        : (
          <div className="border border-divider-soft bg-surface-pearl rounded-xl overflow-hidden shadow-sm divide-y divide-hairline">
            {contacts.map(c => (
              <div key={c._id} className={`flex items-start gap-4 px-6 py-4 hover:bg-canvas-parchment transition-colors ${c.status === 'new' ? 'bg-pale-blue/30' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[15px] font-medium text-ink">{c.name}</p>
                    <span className={`font-mono text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${c.status === 'new' ? 'bg-pale-blue text-action-blue' : c.status === 'read' ? 'bg-soft-stone text-ink-muted-80' : 'bg-slate-200 text-slate'}`}>{c.status}</span>
                  </div>
                  <p className="font-mono text-[12px] text-slate mt-1">{c.email}</p>
                  {c.subject && <p className="font-sans text-[13px] font-semibold text-ink mt-1">{c.subject}</p>}
                  <p className="font-sans text-[14px] text-ink-muted-80 mt-2 leading-relaxed line-clamp-3">{c.message.replace(/\n/g, ' ')}</p>
                  <div className="flex items-center gap-4 mt-3 text-[12px] text-slate">
                    <span>• {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    {c.isReplied && <span className="text-deep-green font-semibold">Replied</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {c.status !== 'archived' && (
                    <button onClick={() => markRead(c)} className="font-sans text-[12px] font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors px-3 py-1.5 rounded-md">Mark Read</button>
                  )}
                  {c.status !== 'archived' && (
                    <button onClick={() => archive(c)} className="font-sans text-[12px] font-medium text-ink-muted-80 hover:text-ink bg-soft-stone hover:bg-soft-stone/70 transition-colors px-3 py-1.5 rounded-md">Archive</button>
                  )}
                  <button onClick={() => toggleReplied(c)} className="font-sans text-[12px] font-medium text-ink-muted-80 hover:text-deep-green bg-soft-stone hover:bg-soft-stone/70 transition-colors px-3 py-1.5 rounded-md">{c.isReplied ? 'Unmark Reply' : 'Mark Replied'}</button>
                  <button onClick={() => { if (window.confirm('Delete this message?')) deleteMut.mutate(c._id) }}
                    className="font-sans text-[12px] font-medium text-red-500/70 hover:text-red-500 transition-colors bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-md">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}