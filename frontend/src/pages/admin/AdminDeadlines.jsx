import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { getDeadlines, createDeadline, deleteDeadline } from '../../api/deadlines';
import { getBatchStudents } from '../../api/students';
import { CheckCircle2, X } from 'lucide-react';

export default function AdminDeadlines() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', subject: '', type: 'CA', deadline: '', driveLink: '' });

  const { data: deadlinesData, isLoading } = useQuery({
    queryKey: ['deadlines', user?.batch],
    queryFn: () => getDeadlines({ batch: user?.batch }).then(r => r.data),
  });

  const { data: batchData } = useQuery({
    queryKey: ['batchRoster', user?.batch],
    queryFn: () => getBatchStudents(user?.batch).then(r => r.data),
    enabled: !!user?.batch,
  });

  const createMut = useMutation({
    mutationFn: (data) => createDeadline(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deadlines'] });
      setShowModal(false);
      setForm({ title: '', description: '', subject: '', type: 'CA', deadline: '', driveLink: '' });
    }
  });

  const deleteMut = useMutation({
    mutationFn: (id) => deleteDeadline(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deadlines'] }),
  });

  const deadlines = deadlinesData?.data || [];
  const roster = batchData?.data || [];
  const totalStudents = roster.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display font-semibold text-[28px] tracking-tight text-ink">Deadlines Manager</h1>
        <button onClick={() => setShowModal(true)} className="button-primary">
          + Post Deadline
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-6 border border-divider-soft rounded-[24px] bg-white flex flex-col md:flex-row md:items-start justify-between gap-6 animate-pulse">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-6 w-16 bg-soft-stone rounded-full" />
                  <div className="h-4 w-24 bg-soft-stone rounded" />
                </div>
                <div className="h-6 w-48 bg-soft-stone rounded mb-1" />
                <div className="h-4 w-full max-w-md bg-soft-stone rounded mb-3" />
                <div className="h-4 w-32 bg-soft-stone rounded" />
              </div>
              <div className="md:w-[250px] flex-shrink-0 bg-canvas rounded-2xl p-5 border border-divider-soft">
                <div className="flex items-end justify-between mb-2">
                  <div className="h-4 w-20 bg-soft-stone rounded" />
                  <div className="h-4 w-16 bg-soft-stone rounded" />
                </div>
                <div className="h-2 mb-4 bg-soft-stone rounded-full" />
                <div className="space-y-2">
                  <div className="h-3 w-full bg-soft-stone rounded" />
                  <div className="h-3 w-3/4 bg-soft-stone rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : deadlines.length === 0 ? (
        <p className="text-ink-muted-80 font-sans text-[15px]">No deadlines posted yet.</p>
      ) : (
        <div className="grid gap-6">
          {deadlines.map(d => {
            const submitCount = d.submittedBy?.length || 0;
            const isComplete = totalStudents > 0 && submitCount >= totalStudents;
            const missingStudents = totalStudents > 0 ? roster.filter(s => !d.submittedBy?.includes(s._id)) : [];

            return (
              <div key={d._id} className="p-6 border border-divider-soft rounded-[24px] bg-white flex flex-col md:flex-row md:items-start justify-between gap-6 relative group hover:border-primary/50 transition-colors">
                
                <button 
                  onClick={() => { if(window.confirm('Delete this deadline?')) deleteMut.mutate(d._id) }}
                  className="absolute top-6 right-6 text-red-500 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors opacity-0 group-hover:opacity-100"
                >
                  Delete
                </button>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-sans text-[12px] font-bold bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-wider">
                      {d.type}
                    </span>
                    <span className="font-sans text-[13px] font-medium text-ink-muted-80">
                      {d.subject}
                    </span>
                  </div>
                  <h3 className="font-display text-[22px] font-semibold text-ink mb-1">{d.title}</h3>
                  {d.description && <p className="text-ink-muted-80 font-sans text-[15px] mb-3">{d.description}</p>}
                  
                  <div className="font-sans text-[13px] text-ink-muted-80">
                    Due: {new Date(d.deadline).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>

                {/* CR Progress View */}
                <div className="md:w-[250px] flex-shrink-0 bg-canvas rounded-2xl p-5 border border-divider-soft shadow-inner">
                  <div className="flex items-end justify-between mb-2">
                    <span className="font-sans text-[13px] font-bold text-ink uppercase tracking-wider">Progress</span>
                    <span className="font-sans text-[16px] font-medium text-ink">{submitCount} / {totalStudents}</span>
                  </div>
                  <div className="w-full h-2 mb-4 overflow-hidden rounded-full bg-white">
                    <div className="h-full transition-all duration-500 bg-green-500" style={{ width: `${totalStudents > 0 ? (submitCount/totalStudents)*100 : 0}%` }}></div>
                  </div>
                  
                  {isComplete ? (
                    <p className="text-green-500 text-[13px] font-bold">Ready to deliver                     <CheckCircle2 size={14} /></p>
                  ) : (
                    <div className="max-h-[100px] overflow-y-auto pr-1">
                      <span className="font-sans text-[11px] font-bold text-ink-muted-48 uppercase tracking-wider block mb-1">Missing ({missingStudents.length})</span>
                      <ul className="space-y-1">
                        {missingStudents.map(student => (
                          <li key={student._id} className="text-[12px] text-ink font-medium truncate">{student.name} ({student.rollNumber})</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-canvas border border-divider-soft w-full max-w-lg rounded-[24px] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-divider-soft">
              <h3 className="font-display text-[22px] font-semibold text-ink">Post New Deadline</h3>
              <button onClick={() => setShowModal(false)} className="text-ink-muted-80 hover:text-ink"><X size={16} /></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-ink-muted-80 mb-1.5">Title</label>
                <input type="text" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} className="w-full bg-white border border-divider-soft text-ink px-4 py-2.5 rounded-lg focus:outline-none focus:border-primary" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-ink-muted-80 mb-1.5">Subject</label>
                  <input type="text" value={form.subject} onChange={e => setForm(f=>({...f,subject:e.target.value}))} className="w-full bg-white border border-divider-soft text-ink px-4 py-2.5 rounded-lg focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-ink-muted-80 mb-1.5">Type</label>
                  <select value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))} className="w-full bg-white border border-divider-soft text-ink px-4 py-2.5 rounded-lg focus:outline-none focus:border-primary">
                    <option value="CA">CA</option><option value="PCA">PCA</option><option value="LA">LA</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-[13px] font-bold text-ink-muted-80 mb-1.5">Deadline Time</label>
                <input type="datetime-local" value={form.deadline} onChange={e => setForm(f=>({...f,deadline:e.target.value}))} className="w-full bg-white border border-divider-soft text-ink px-4 py-2.5 rounded-lg focus:outline-none focus:border-primary" />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-ink-muted-80 mb-1.5">Drive Link (Optional)</label>
                <input type="url" value={form.driveLink} onChange={e => setForm(f=>({...f,driveLink:e.target.value}))} className="w-full bg-white border border-divider-soft text-ink px-4 py-2.5 rounded-lg focus:outline-none focus:border-primary" />
              </div>
              
              <div>
                <label className="block text-[13px] font-bold text-ink-muted-80 mb-1.5">Description (Optional)</label>
                <textarea rows="2" value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} className="w-full bg-white border border-divider-soft text-ink px-4 py-2.5 rounded-lg focus:outline-none focus:border-primary resize-none" />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t border-divider-soft bg-white">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-ink-muted-80">Cancel</button>
              <button onClick={() => createMut.mutate({ ...form, batch: user.batch })} disabled={createMut.isPending || !form.title || !form.subject || !form.deadline} className="button-primary">
                {createMut.isPending ? 'Posting...' : 'Post Deadline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
