import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../api/auth';
import { getNotices } from '../api/notices';
import { uploadPhoto, getBatchStudents } from '../api/students';
import { getDeadlines, submitDeadline } from '../api/deadlines';
import NoticeCard from '../components/NoticeCard';

import { getRoutine } from '../api/routines';
import { getEvents } from '../api/events';

export default function Students() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef(null);
  const [activeTab, setActiveTab] = useState('deadlines');
  const [photoError,  setPhotoError]  = useState('');
  const [pwForm,      setPwForm]      = useState({ current:'', next:'', confirm:'' });
  const [pwMsg,       setPwMsg]       = useState('');
  const [pwErr,       setPwErr]       = useState('');
  const [pwLoading,   setPwLoading]   = useState(false);


  // Deadlines Query
  const { data: deadlinesData, isLoading: deadlinesLoading } = useQuery({
    queryKey: ['deadlines', user?.batch],
    queryFn: () => getDeadlines({ batch: user?.batch }).then(r => r.data),
    enabled: activeTab === 'deadlines',
  });

  // Routine Query
  const { data: routineData, isLoading: routineLoading } = useQuery({
    queryKey: ['routine', user?.batch],
    queryFn: () => getRoutine(user?.batch).then(r => r.data),
    enabled: activeTab === 'routine' && !!user?.batch,
  });

  // Calendar Query
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => getEvents().then(r => r.data),
    enabled: activeTab === 'calendar',
  });

  // Batch Roster Query (For CRs to track missing submissions)
  const { data: batchData } = useQuery({
    queryKey: ['batchRoster', user?.batch],
    queryFn: () => getBatchStudents(user?.batch).then(r => r.data),
    enabled: activeTab === 'deadlines' && user?.role === 'cr' && !!user?.batch,
  });



  const submitDeadlineMut = useMutation({
    mutationFn: (id) => submitDeadline(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deadlines'] });
    }
  });

  const { data: noticeData, isLoading: noticeLoading } = useQuery({
    queryKey: ['notices', 'student'],
    queryFn: () => getNotices({ limit: 20 }).then(r => r.data),
    enabled: activeTab === 'notices',
  });

  const photoMut = useMutation({
    mutationFn: (fd) => uploadPhoto(fd),
    onSuccess: (res) => {
      const updated = { ...user, photo: res.data.data.photo };
      localStorage.setItem('ei_user', JSON.stringify(updated));
      qc.invalidateQueries({ queryKey: ['me'] });
      setPhotoError('');
    },
    onError: (err) => setPhotoError(err.response?.data?.error || 'Upload failed'),
  });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('photo', file);
    photoMut.mutate(fd);
  };

  const deadlines = deadlinesData?.data || [];
  const roster = batchData?.data || [];
  const totalStudents = roster.length;

  const TABS = ['deadlines', 'routine', 'calendar', 'notices', 'password'];

  // Helper to format countdown
  const getCountdown = (dateStr) => {
    const deadline = new Date(dateStr);
    const now = new Date();
    const diff = deadline - now;
    if (diff < 0) return 'Past Due';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  return (
    <div className="page-wrap pt-32 pb-20 min-h-screen">
      {/* ── Profile header ── */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12 pb-12 border-b border-divider-soft">
        <div className="relative flex-shrink-0">
          <div
            onClick={() => fileRef.current?.click()}
            className="w-28 h-28 rounded-full bg-canvas-parchment flex items-center justify-center cursor-pointer overflow-hidden group border border-divider-soft hover:border-ink transition-colors shadow-sm"
          >
            {user?.photo ? (
              <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-display text-4xl text-ink-muted-48 group-hover:text-ink">{user?.name?.charAt(0)}</span>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-xs font-medium">Edit</span>
            </div>
          </div>
          <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
        </div>

        <div className="text-center md:text-left flex-1">
          <h1 className="font-display font-semibold text-[32px] md:text-[40px] tracking-tight text-ink leading-tight mb-2">
            {user?.name}
          </h1>
          <p className="font-sans text-[17px] font-medium text-ink-muted-80 flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1">
            <span>Roll {user?.rollNumber || '—'}</span>
            <span className="opacity-50">·</span>
            <span>Batch {user?.batch}</span>
            {user?.section && <span className="opacity-50">·</span>}
            {user?.section && <span>Sec {user.section}</span>}
          </p>
          {photoError && <p className="text-red-500 text-[14px] mt-2 font-[450]">{photoError}</p>}
        </div>
      </div>

      {/* ── Tabs (Pill style) ── */}
      <div className="flex gap-2 mb-10 overflow-x-auto scrollbar-none p-1 bg-surface-pearl border border-divider-soft rounded-[999px] w-max max-w-full">
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`font-sans text-[14px] font-bold uppercase tracking-[0.04em] px-6 py-3 flex-none rounded-[999px] transition-all whitespace-nowrap ${
              activeTab === t ? 'bg-ink text-canvas shadow-sm' : 'text-[#696969] bg-transparent hover:text-ink hover:bg-canvas-parchment'
            }`}>
            {t === 'deadlines' ? 'Deadlines'
              : t === 'routine' ? 'Routine'
              : t === 'calendar' ? 'Calendar'
              : t === 'password' ? 'Password'
              : 'Notices'}
          </button>
        ))}
      </div>

      {/* ── Deadlines Feed (Premium Glassy Tracking UI) ── */}
      {activeTab === 'deadlines' && (
        <div className="animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-display text-[28px] font-medium tracking-[-0.02em] text-ink">Assignments & Deadlines</h2>
          </div>
          
          {deadlinesLoading ? <div className="animate-pulse space-y-4"><div className="h-40 bg-black/5 rounded-2xl"></div></div> : deadlines.length === 0 ? (
            <div className="py-16 text-center border border-divider-soft rounded-[24px] bg-surface-pearl">
              <p className="text-ink-muted-80 font-sans text-[16px] font-[450]">No upcoming deadlines.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-1">
              {deadlines.map(d => {
                const hasSubmitted = d.submittedBy?.includes(user?._id);
                const submitCount = d.submittedBy?.length || 0;
                const isComplete = totalStudents > 0 && submitCount >= totalStudents;
                
                // For CRs: Identify who hasn't submitted
                let missingStudents = [];
                if (user?.role === 'cr' && totalStudents > 0) {
                  missingStudents = roster.filter(s => !d.submittedBy?.includes(s._id));
                }

                return (
                  <div key={d._id} className="p-6 md:p-8 border border-white/20 dark:border-white/10 rounded-[24px] bg-gradient-to-br from-blue-50/50 to-white/50 dark:from-blue-900/10 dark:to-black/20 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] flex flex-col hover:shadow-lg transition-shadow relative group">
                    
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="font-sans text-[12px] font-bold bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 px-3 py-1 rounded-full uppercase tracking-wider border border-blue-500/20">
                            {d.type}
                          </span>
                          <span className="font-sans text-[13px] font-medium text-ink-muted-80">
                            {d.subject}
                          </span>
                        </div>
                        <h3 className="font-display text-[22px] font-semibold text-ink line-clamp-2 mb-2">
                          {d.title}
                        </h3>
                        {d.description && <p className="text-ink-muted-80 font-sans text-[15px] mb-4">{d.description}</p>}
                        
                        <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t border-black/5 dark:border-white/5">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            <span className="font-sans text-[14px] font-medium text-red-600 dark:text-red-400">
                              {getCountdown(d.deadline)}
                            </span>
                          </div>
                          <span className="font-sans text-[13px] text-ink-muted-48">
                            Due: {new Date(d.deadline).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                          {d.driveLink && (
                            <a href={d.driveLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-sans text-[14px] font-medium text-blue-600 hover:text-blue-800 transition-colors">
                              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                              Submit Link
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Right Panel: Student View vs CR View */}
                      <div className="md:w-[300px] flex-shrink-0 bg-white/40 dark:bg-black/20 rounded-2xl p-5 border border-white/20 dark:border-white/5 shadow-inner">
                        {user?.role === 'student' ? (
                          <div className="flex flex-col items-center justify-center h-full text-center">
                            <button 
                              onClick={() => submitDeadlineMut.mutate(d._id)}
                              className={`w-full py-3 px-6 rounded-[999px] font-sans font-bold text-[14px] transition-all duration-300 ${
                                hasSubmitted 
                                  ? 'bg-green-500 text-white shadow-[0_4px_14px_rgba(34,197,94,0.3)] hover:bg-green-600' 
                                  : 'bg-ink text-canvas hover:bg-ink/80 shadow-md'
                              }`}
                            >
                              {hasSubmitted ? 'Submitted ✅' : 'Mark as Submitted'}
                            </button>
                            <p className="font-sans text-[12px] text-ink-muted-48 mt-3">
                              {hasSubmitted ? 'You have completed this task.' : 'Click to mark your work as done.'}
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col h-full">
                            <div className="flex justify-between items-end mb-2">
                              <span className="font-sans text-[13px] font-bold text-ink uppercase tracking-wider">Progress</span>
                              <span className="font-sans text-[18px] font-medium text-ink">{submitCount} / {totalStudents}</span>
                            </div>
                            {/* Progress Bar */}
                            <div className="h-2 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden mb-4">
                              <div 
                                className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                                style={{ width: `${totalStudents > 0 ? (submitCount/totalStudents)*100 : 0}%` }}
                              ></div>
                            </div>
                            
                            {isComplete ? (
                              <button className="w-full py-2.5 bg-green-500 text-white rounded-lg font-sans font-bold text-[13px] shadow-sm uppercase tracking-wide cursor-default">
                                Ready to deliver to professor ✅
                              </button>
                            ) : (
                              <div className="flex-1 overflow-y-auto pr-1 max-h-[120px] scrollbar-thin scrollbar-thumb-black/10">
                                <span className="font-sans text-[11px] font-bold text-ink-muted-48 uppercase tracking-wider block mb-2">Not Submitted ({missingStudents.length})</span>
                                <ul className="space-y-1.5">
                                  {missingStudents.map(student => (
                                    <li key={student._id} className="flex justify-between items-center text-[13px] font-sans">
                                      <span className="text-ink font-medium truncate pr-2">{student.name}</span>
                                      <span className="text-ink-muted-48 font-mono text-[11px]">{student.rollNumber}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Routine ── */}
      {activeTab === 'routine' && (
        <div className="overflow-x-auto text-ink animate-in fade-in duration-300">
          {routineLoading ? (
             <div className="animate-pulse space-y-4"><div className="h-40 bg-black/5 rounded-2xl"></div></div>
          ) : routineData?.data?.length > 0 ? (
            <table className="w-full min-w-[600px] border-collapse text-[14px] font-sans border border-divider-soft rounded-[20px] bg-surface-pearl">
              <thead>
                <tr className="border-b border-divider-soft bg-canvas">
                  <th className="font-bold text-ink-muted-80 text-left py-4 px-4 w-32">Time</th>
                  {['Mon','Tue','Wed','Thu','Fri'].map(d => (
                    <th key={d} className="font-bold text-ink-muted-80 text-center py-4 px-2">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {routineData.data.map((row, i) => (
                  <tr key={i} className="border-b border-divider-soft hover:bg-canvas-parchment transition-colors last:border-b-0">
                    <td className="font-medium text-ink py-4 px-4 whitespace-nowrap">{row.time}</td>
                    {['mon','tue','wed','thu','fri'].map(d => (
                      <td key={d} className="py-4 px-2 text-center text-ink-muted-80">
                        {row[d] === '—' || !row[d] ? <span className="opacity-30">—</span> : row[d]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-16 text-center border border-divider-soft rounded-[24px] bg-surface-pearl">
              <p className="text-ink-muted-80 font-sans text-[16px] font-[450]">No class routine published yet.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Calendar ── */}
      {activeTab === 'calendar' && (
        <div className="flex flex-col text-ink animate-in fade-in duration-300 border border-divider-soft rounded-lg overflow-hidden">
          {eventsLoading ? (
            <div className="animate-pulse h-40 bg-black/5"></div>
          ) : eventsData?.data?.length > 0 ? (
            eventsData.data.map((c, i) => (
              <div key={i} className="flex justify-between items-center py-4 px-6 border-b border-divider-soft last:border-b-0 bg-surface-pearl hover:bg-canvas-parchment transition-colors">
                <p className="font-sans text-[17px] font-medium text-ink">{c.title}</p>
                <p className="font-sans text-[14px] font-normal text-ink-muted-80">{new Date(c.date).toLocaleDateString()}</p>
              </div>
            ))
          ) : (
            <div className="py-16 text-center bg-surface-pearl">
              <p className="text-ink-muted-80 font-sans text-[16px] font-[450]">No upcoming events.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Notices ── */}
      {activeTab === 'notices' && (
        <div className="animate-in fade-in duration-300">
          {noticeLoading ? <div className="animate-pulse h-40 bg-black/5 rounded-lg"></div> : noticeData?.data?.length > 0
            ? (
               <div className="grid gap-6 md:grid-cols-2">
                 {noticeData.data.map(n => (
                   <div key={n._id} className="bg-surface-pearl rounded-lg p-[24px] border border-divider-soft text-left flex flex-col justify-between hover:shadow-product transition-shadow duration-300">
                      <h3 className="font-sans text-[17px] font-semibold text-ink line-clamp-2 mb-2">{n.title}</h3>
                      <div className="flex justify-between items-center mt-4">
                        <span className="font-sans text-[14px] text-ink-muted-80">{new Date(n.createdAt).toLocaleDateString()}</span>
                        <a href={n.pdfUrl || '#'} className="button-secondary-pill !px-3 !py-1 !text-[14px]">View</a>
                      </div>
                   </div>
                 ))}
               </div>
            )
            : <p className="text-ink-muted-80 text-[17px] py-12 text-center font-sans border border-divider-soft rounded-lg bg-surface-pearl">No notices yet.</p>}
        </div>
      )}

      {/* ── Change Password ── */}
      {activeTab === 'password' && (
        <div className="max-w-[400px] animate-in fade-in duration-300">
          <p className="font-sans text-[17px] font-normal text-ink-muted-80 mb-8">
            Change your account password.
          </p>
          <div className="flex flex-col gap-5">
            <div>
              <label className="sr-only">Current Password</label>
              <input type="password" value={pwForm.current} placeholder="Current Password"
                onChange={e => setPwForm(f=>({...f,current:e.target.value}))}
                className="w-full bg-canvas border border-divider-soft text-ink px-4 py-3 text-[17px] rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-ink-muted-48" />
            </div>
            <div>
              <label className="sr-only">New Password</label>
              <input type="password" value={pwForm.next} placeholder="New Password"
                onChange={e => setPwForm(f=>({...f,next:e.target.value}))}
                className="w-full bg-canvas border border-divider-soft text-ink px-4 py-3 text-[17px] rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-ink-muted-48" />
            </div>
            <div>
              <label className="sr-only">Confirm Password</label>
              <input type="password" value={pwForm.confirm} placeholder="Confirm Password"
                onChange={e => setPwForm(f=>({...f,confirm:e.target.value}))}
                className="w-full bg-canvas border border-divider-soft text-ink px-4 py-3 text-[17px] rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-ink-muted-48" />
            </div>
            
            {pwErr && <p className="font-sans text-[14px] font-medium text-red-500 text-center">{pwErr}</p>}
            {pwMsg && <p className="font-sans text-[14px] font-medium text-primary text-center">{pwMsg}</p>}
            
            <button
              disabled={pwLoading}
              onClick={async () => {
                setPwErr(''); setPwMsg('');
                if (pwForm.next.length < 6) return setPwErr('New password must be at least 6 characters');
                if (pwForm.next !== pwForm.confirm) return setPwErr('Passwords do not match');
                setPwLoading(true);
                try {
                  await changePassword({ currentPassword: pwForm.current, newPassword: pwForm.next });
                  setPwMsg('Password changed successfully');
                  setPwForm({ current:'', next:'', confirm:'' });
                } catch (err) {
                  setPwErr(err.response?.data?.error || 'Failed to change password');
                } finally {
                  setPwLoading(false);
                }
              }}
              className="button-primary w-full justify-center mt-2 disabled:opacity-50">
              {pwLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>
      )}


    </div>
  );
}
