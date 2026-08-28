import { useState, useRef } from 'react';
import { Camera, BarChart3, Check, AlertTriangle, XCircle, CheckCircle2, Mail, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { changePassword, forgotPassword, verifyOtp, resetPassword } from '../api/auth';
import { getAnnouncements } from '../api/announcements';
import { uploadPhoto, getBatchStudents } from '../api/students';
import { getDeadlines, submitDeadline } from '../api/deadlines';
import { getRoutine } from '../api/routines';
import { getStudentHistory } from '../api/attendance';
import ImageGuard from '../components/ImageGuard';

export default function Students() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef(null);
  const [activeTab, setActiveTab] = useState('attendance');
  const [photoError,  setPhotoError]  = useState('');
  const [pwForm,      setPwForm]      = useState({ current:'', next:'', confirm:'' });
  const [pwMsg,       setPwMsg]       = useState('');
  const [pwErr,       setPwErr]       = useState('');
  const [pwLoading,   setPwLoading]   = useState(false);
  const [otpSent,     setOtpSent]     = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resetToken,  setResetToken]  = useState('');
  const [otpInput,    setOtpInput]    = useState('');
  const [otpLoading,  setOtpLoading]  = useState(false);
  const [otpError,    setOtpError]    = useState('');
  const [otpMsg,      setOtpMsg]      = useState('');

  // Attendance History Query
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['studentAttendanceHistory', user?._id],
    queryFn: () => getStudentHistory().then(r => r.data.data),
    enabled: activeTab === 'attendance',
  });

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

  // Announcements Query
  const { data: announcementsData, isLoading: announcementsLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => getAnnouncements({ limit: 20 }).then(r => r.data),
    enabled: activeTab === 'announcements',
  });

  // Batch roster for deadlines and visible batch mates
  const { data: batchData } = useQuery({
    queryKey: ['batchRoster', user?.batch],
    queryFn: () => getBatchStudents(user?.batch).then(r => r.data),
    enabled: activeTab === 'deadlines' && user?.role === 'cr' && !!user?.batch,
  });

  const { data: batchMatesData, isLoading: batchMatesLoading } = useQuery({
    queryKey: ['batchMates', user?.batch],
    queryFn: () => getBatchStudents(user?.batch).then(r => r.data),
    enabled: !!user?.batch && user?.role !== 'faculty' && user?.role !== 'admin' && user?.role !== 'super_admin',
  });

  const submitDeadlineMut = useMutation({
    mutationFn: (id) => submitDeadline(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deadlines'] });
    }
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
  const batchMates = (batchMatesData?.data || []).filter(student => student._id !== user?._id);
  const totalStudents = roster.length;

  const TABS = ['attendance', 'deadlines', 'routine', 'announcements', 'password'];

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

  const overall = attendanceData?.overall || { totalLectures: 0, attendedLectures: 0, percentage: 100, lowAttendance: false };
  const perSubject = attendanceData?.perSubject || [];
  const history = attendanceData?.history || [];

  return (
    <div className="container min-h-screen pt-32 pb-20">
      {/* ── Profile header ── */}
      <div className="flex flex-col items-center gap-8 pb-12 mb-12 border-b md:flex-row md:items-start border-divider-soft">
        <div className="relative flex-shrink-0">
          <div
            onClick={() => fileRef.current?.click()}
            className="flex items-center justify-center overflow-hidden transition-colors border rounded-full shadow-sm cursor-pointer w-28 h-28 bg-canvas-parchment group border-divider-soft hover:border-ink"
          >
            {user?.photo ? (
              <img src={user.photo} alt={user.name} className="object-cover w-full h-full" />
            ) : (
              <span className="text-4xl font-display text-ink-muted-48 group-hover:text-ink">{user?.name?.charAt(0)}</span>
            )}
            <div className="absolute inset-0 flex items-center justify-center transition-opacity opacity-0 bg-black/40 group-hover:opacity-100">
              <span className="text-xs font-medium text-white">Edit</span>
            </div>
          </div>
          <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
        </div>

        <div className="flex-1 text-center md:text-left">
          <h1 className="font-display font-semibold text-[32px] md:text-[40px] tracking-tight text-ink leading-tight mb-2">
            {user?.name}
          </h1>
          <p className="font-sans text-[17px] font-medium text-ink-muted-80 flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1">
            <span>Roll {user?.rollNumber || '—'}</span>
            <span className="opacity-50">·</span>
             <span>Batch {user?.batch}</span>
          </p>
          {photoError && <p className="text-red-500 text-[14px] mt-2 font-[450]">{photoError}</p>}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4 md:justify-start">
            <Link to="/attendance/student" className="button-primary text-[14px] !py-2 !px-4">
              <Camera size={16} /> Scan Class QR →
            </Link>
          </div>
        </div>
      </div>

      {!batchMatesLoading && user?.batch && user?.role !== 'faculty' && user?.role !== 'admin' && user?.role !== 'super_admin' && (
        <div className="mb-10 border rounded-[24px] border-divider-soft bg-surface-pearl p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <p className="font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-ink-muted-80">Your batch</p>
              <h2 className="font-display text-[28px] font-semibold tracking-[-0.03em] text-ink">Batch Mates</h2>
            </div>
            <span className="font-sans text-[12px] font-semibold text-ink-muted-80">{batchMates.length + 1} people</span>
          </div>

          {batchMates.length === 0 ? (
            <p className="font-sans text-[14px] text-ink-muted-80">No other students in your batch have joined yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {batchMates.map((mate) => (
                <div key={mate._id} className="flex items-center gap-3 p-3 border rounded-2xl border-divider-soft bg-canvas">
                  <div className="flex items-center justify-center w-12 h-12 overflow-hidden rounded-full bg-ink/5 text-ink-muted-80">
                    <ImageGuard className="w-full h-full">
                      {mate.photo ? (
                        <img src={mate.photo} alt={mate.name} className="object-cover w-full h-full" />
                      ) : (
                        <span className="font-display text-[15px] font-bold">
                          {(mate.name || 'S').split(' ').map(part => part[0]).slice(0,2).join('').toUpperCase()}
                        </span>
                      )}
                    </ImageGuard>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-sans text-[14px] font-semibold text-ink">{mate.name}</p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-muted-80">{mate.rollNumber || 'Roll —'}</p>
                    {mate.role === 'cr' && (
                      <span className="inline-flex mt-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-amber-600">
                        CR
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tabs (Pill style) ── */}
      <div className="flex gap-2 mb-10 overflow-x-auto scrollbar-none p-1 bg-surface-pearl border border-divider-soft rounded-[999px] w-max max-w-full">
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`font-sans text-[14px] font-bold uppercase tracking-[0.04em] px-6 py-3 flex-none rounded-[999px] transition-all whitespace-nowrap ${
              activeTab === t ? 'bg-ink text-canvas shadow-sm' : 'text-[#696969] bg-transparent hover:text-ink hover:bg-canvas-parchment'
            }`}>
            {t === 'attendance' ?  'Attendance'
            : t === 'deadlines' ? 'Deadlines'
            : t === 'routine' ? 'Routine'
                        : t === 'password' ? 'Password'
            : 'Announcements'}
          </button>
        ))}
      </div>

      {/* ── Tab: Attendance History ── */}
      {activeTab === 'attendance' && (
        <div className="space-y-8 duration-300 animate-in fade-in">
          {attendanceLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-40 bg-black/5 rounded-2xl"></div>
              <div className="h-64 bg-black/5 rounded-2xl"></div>
            </div>
          ) : (
            <>
              {/* Overall & Subject Breakdown Cards */}
              <div className="grid gap-6 md:grid-cols-12">
                {/* Overall Score Card */}
                <div className={`md:col-span-4 border border-divider-soft bg-surface-pearl rounded-2xl p-6 shadow-sm flex flex-col justify-between ${
                  overall.lowAttendance ? 'border-amber-500/40 bg-amber-500/5' : ''
                }`}>
                  <div>
                    <span className="font-sans text-[12px] font-bold uppercase tracking-wider text-ink-muted-80">
                      Overall Attendance
                    </span>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="font-display text-[48px] font-bold text-ink leading-none">{overall.percentage}%</span>
                      <span className={`text-[12px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        overall.percentage >= 75 ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/15 text-amber-600'
                      }`}>
                        {overall.percentage >= 75 ? 'Good Standing' : 'Below 75%'}
                      </span>
                    </div>
                    <p className="font-sans text-[14px] text-ink-muted-80 mt-2">
                      Attended <strong>{overall.attendedLectures}</strong> out of <strong>{overall.totalLectures}</strong> conducted lectures.
                    </p>
                  </div>

                  <div className="pt-4 mt-6 border-t border-divider-soft">
                    <div className="h-2.5 w-full bg-divider-soft rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          overall.percentage >= 75 ? 'bg-green-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, overall.percentage)}%` }}
                      ></div>
                    </div>
                    <p className="font-sans text-[11px] text-ink-muted-48 mt-2">
                      Minimum 75% attendance required for semester exams.
                    </p>
                  </div>
                </div>

                {/* Per-Subject Breakdown Grid */}
                <div className="p-6 border shadow-sm md:col-span-8 border-divider-soft bg-surface-pearl rounded-2xl">
                  <h3 className="font-display text-[18px] font-bold text-ink mb-4">Subject-Wise Breakdown</h3>
                  {perSubject.length === 0 ? (
                    <p className="font-sans text-[14px] text-ink-muted-80 py-8 text-center">No subject lecture records yet.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {perSubject.map((sub) => (
                        <div
                          key={sub.subject}
                          className="p-4 border shadow-sm border-divider-soft bg-canvas rounded-xl"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-sans text-[13px] font-bold text-ink truncate">{sub.subject}</span>
                            <span className={`text-[12px] font-bold ${
                              sub.percentage >= 75 ? 'text-green-600' : 'text-amber-600'
                            }`}>
                              {sub.percentage}%
                            </span>
                          </div>
                          <div className="w-full h-2 mb-2 overflow-hidden rounded-full bg-divider-soft">
                            <div
                              className={`h-full rounded-full ${sub.percentage >= 75 ? 'bg-green-500' : 'bg-amber-500'}`}
                              style={{ width: `${Math.min(100, sub.percentage)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-[11px] font-sans text-ink-muted-80">
                            <span>{sub.attended} / {sub.total} attended</span>
                            {sub.flagged > 0 && <span className="text-amber-500">{sub.flagged} flagged</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Past Lectures History Table */}
              <div className="p-6 border shadow-sm border-divider-soft bg-surface-pearl rounded-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-display text-[20px] font-bold text-ink">Past Lectures History</h3>
                    <p className="font-sans text-[13px] text-ink-muted-80">Chronological log of verified classroom attendance</p>
                  </div>
                </div>

                {history.length === 0 ? (
                  <div className="py-12 text-center border text-ink-muted-80 border-divider-soft rounded-xl bg-canvas">
                    <p className="font-sans text-[15px]">No attendance records found for your batch.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans text-[14px]">
                      <thead>
                        <tr className="border-b border-divider-soft text-[12px] font-bold uppercase tracking-wider text-ink-muted-80">
                          <th className="px-3 pb-3">Date & Time</th>
                          <th className="px-3 pb-3">Subject</th>
                          <th className="px-3 pb-3">Faculty</th>
                           <th className="px-3 pb-3">Status</th>
                          <th className="px-3 pb-3 text-right">Distance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-divider-soft/50">
                        {history.map((h) => (
                          <tr key={h._id} className="transition-colors hover:bg-canvas/50">
                            <td className="py-3.5 px-3">
                              <p className="font-medium text-ink">
                                {new Date(h.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                              <p className="text-[12px] text-ink-muted-80">
                                {new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </td>
                            <td className="py-3.5 px-3 font-semibold text-ink">{h.subject}</td>
                            <td className="py-3.5 px-3 text-ink-muted-80">{h.facultyName}</td>
                             <td className="py-3.5 px-3">
                              <span className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                h.status === 'present'
                                  ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                                  : h.status === 'flagged'
                                  ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                                  : 'bg-red-500/10 text-red-500 border border-red-500/20'
                              }`}>
                                {h.status === 'present' ? <><Check size={14} /> Present</> : h.status === 'flagged' ? <><AlertTriangle size={14} /> Flagged</> : <><XCircle size={14} /> Absent</>}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono text-[12px] text-ink-muted-80">
                              {h.distanceInMeters != null ? `${h.distanceInMeters}m` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Deadlines Feed (Premium Glassy Tracking UI) ── */}
      {activeTab === 'deadlines' && (
        <div className="duration-300 animate-in fade-in">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-[28px] font-medium tracking-[-0.02em] text-ink">Assignments & Deadlines</h2>
          </div>
          
          {deadlinesLoading ? <div className="space-y-4 animate-pulse"><div className="h-40 bg-black/5 rounded-2xl"></div></div> : deadlines.length === 0 ? (
            <div className="py-16 text-center border border-divider-soft rounded-[24px] bg-surface-pearl">
              <p className="text-ink-muted-80 font-sans text-[16px] font-[450]">No upcoming deadlines.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-1">
              {deadlines.map(d => {
                const hasSubmitted = d.submittedBy?.includes(user?._id);
                const submitCount = d.submittedBy?.length || 0;
                const isComplete = totalStudents > 0 && submitCount >= totalStudents;
                
                let missingStudents = [];
                if (user?.role === 'cr' && totalStudents > 0) {
                  missingStudents = roster.filter(s => !d.submittedBy?.includes(s._id));
                }

                return (
                  <div key={d._id} className="p-6 md:p-8 border border-white/20 dark:border-white/10 rounded-[24px] bg-gradient-to-br from-blue-50/50 to-white/50 dark:from-blue-900/10 dark:to-black/20 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] flex flex-col hover:shadow-lg transition-shadow relative group">
                    <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
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
                        
                        <div className="flex flex-wrap items-center gap-6 pt-4 mt-4 border-t border-black/5 dark:border-white/5">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
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
                              {hasSubmitted ? <>Submitted</> : 'Mark as Submitted'}
                            </button>
                            <p className="font-sans text-[12px] text-ink-muted-48 mt-3">
                              {hasSubmitted ? 'You have completed this task.' : 'Click to mark your work as done.'}
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col h-full">
                            <div className="flex items-end justify-between mb-2">
                              <span className="font-sans text-[13px] font-bold text-ink uppercase tracking-wider">Progress</span>
                              <span className="font-sans text-[18px] font-medium text-ink">{submitCount} / {totalStudents}</span>
                            </div>
                            <div className="w-full h-2 mb-4 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                              <div 
                                className="h-full transition-all duration-500 bg-blue-500 rounded-full" 
                                style={{ width: `${totalStudents > 0 ? (submitCount/totalStudents)*100 : 0}%` }}
                              ></div>
                            </div>
                            
                            {isComplete ? (
                              <button className="w-full py-2.5 bg-green-500 text-white rounded-lg font-sans font-bold text-[13px] shadow-sm uppercase tracking-wide cursor-default">
                                Ready to deliver to professor <CheckCircle2 size={14} />
                              </button>
                            ) : (
                              <div className="flex-1 overflow-y-auto pr-1 max-h-[120px] scrollbar-none scrollbar-thumb-black/10">
                                <span className="font-sans text-[11px] font-bold text-ink-muted-48 uppercase tracking-wider block mb-2">Not Submitted ({missingStudents.length})</span>
                                <ul className="space-y-1.5">
                                  {missingStudents.map(student => (
                                    <li key={student._id} className="flex justify-between items-center text-[13px] font-sans">
                                      <span className="pr-2 font-medium truncate text-ink">{student.name}</span>
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
        <div className="overflow-x-auto duration-300 text-ink animate-in fade-in">
          {routineLoading ? (
             <div className="space-y-4 animate-pulse"><div className="h-40 bg-black/5 rounded-2xl"></div></div>
          ) : routineData?.data?.length > 0 ? (
            <table className="w-full min-w-[600px] border-collapse text-[14px] font-sans border border-divider-soft rounded-[20px] bg-surface-pearl">
              <thead>
                <tr className="border-b border-divider-soft bg-canvas">
                  <th className="w-32 px-4 py-4 font-bold text-left text-ink-muted-80">Time</th>
                  {['Mon','Tue','Wed','Thu','Fri'].map(d => (
                    <th key={d} className="px-2 py-4 font-bold text-center text-ink-muted-80">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {routineData.data.map((row, i) => (
                  <tr key={i} className="transition-colors border-b border-divider-soft hover:bg-canvas-parchment last:border-b-0">
                    <td className="px-4 py-4 font-medium text-ink whitespace-nowrap">{row.time}</td>
                    {['mon','tue','wed','thu','fri'].map(d => (
                      <td key={d} className="px-2 py-4 text-center text-ink-muted-80">
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

      

      {/* -- Announcements -- */}
      {activeTab === 'announcements' && (
        <div className="space-y-4 duration-300 animate-in fade-in">
          {announcementsLoading ? (
            <div className="h-40 rounded-lg animate-pulse bg-black/5"></div>
          ) : announcementsData?.data?.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {announcementsData.data.map(a => (
                <div key={a._id} className="bg-surface-pearl rounded-lg p-[24px] border border-divider-soft text-left hover:shadow-product transition-shadow duration-300">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-pale-green text-deep-green border border-green-200">
                      {a.category || 'general'}
                    </span>
                    <span className="font-sans text-[13px] text-ink-muted-80">{new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-sans text-[17px] font-semibold text-ink mb-1">{a.title}</h3>
                  {a.content && <p className="font-sans text-[14px] text-ink-muted-80 line-clamp-3">{a.content}</p>}
                  {a.targetAudience === 'batch' && a.batchId && (
                    <p className="font-mono text-[12px] text-slate mt-2">Target classroom: {a.batchId}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-ink-muted-80 text-[17px] py-12 text-center font-sans border border-divider-soft rounded-lg bg-surface-pearl">No announcements yet.</p>
          )}
        </div>
      )}

{activeTab === 'password' && (
  <div className="max-w-[400px] animate-in fade-in duration-300">
    <p className="font-sans text-[17px] font-normal text-ink-muted-80 mb-8">
      Change your account password.
    </p>

    {!otpSent ? (
      <div className="flex flex-col gap-5">
        <div className="p-6 border border-divider-soft rounded-2xl bg-surface-pearl text-center">
          <div className="w-14 h-14 rounded-full bg-soft-stone flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={24} className="text-body-muted" />
          </div>
          <p className="font-sans text-[15px] text-ink-muted-80 mb-1">
            Verify your identity before changing password
          </p>
          <p className="font-sans text-[13px] text-slate mb-6">
            We'll send a 6-digit OTP to your registered Gmail
          </p>
          {otpError && <p className="font-sans text-[14px] font-medium text-red-500 text-center mb-3">{otpError}</p>}
          {otpMsg && <p className="font-sans text-[14px] font-medium text-primary text-center mb-3">{otpMsg}</p>}
          <button
            disabled={otpLoading}
            onClick={async () => {
              setOtpError(''); setOtpMsg('');
              setOtpLoading(true);
              try {
                const res = await forgotPassword({ rollNumber: user?.rollNumber });
                if (res.data?.success) {
                  setOtpSent(true);
                  setOtpMsg(res.data?.message || 'OTP sent to your registered email');
                }
              } catch (err) {
                setOtpError(err.response?.data?.error || 'Failed to send OTP. Try again.');
              } finally {
                setOtpLoading(false);
              }
            }}
            className="justify-center w-full button-primary disabled:opacity-50"
          >
            {otpLoading ? 'Sending OTP...' : <><Mail size={16} /> Send OTP to Gmail</>}
          </button>
        </div>
      </div>
    ) : !otpVerified ? (
      <div className="flex flex-col gap-5">
        <div className="p-6 border border-divider-soft rounded-2xl bg-surface-pearl">
          <p className="font-sans text-[15px] font-normal text-ink mb-1">Enter OTP</p>
          <p className="font-sans text-[13px] text-slate mb-5">
            Enter the 6-digit code sent to your registered email
          </p>
          {otpError && <p className="font-sans text-[14px] font-medium text-red-500 text-center mb-3">{otpError}</p>}
          {otpMsg && <p className="font-sans text-[14px] font-medium text-primary text-center mb-3">{otpMsg}</p>}
          <div className="flex gap-3">
            <input
              type="text"
              value={otpInput}
              onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="flex-1 bg-canvas border border-divider-soft text-ink px-4 py-3 text-[17px] text-center tracking-[0.3em] font-mono rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-ink-muted-48"
            />
            <button
              disabled={otpLoading || otpInput.length !== 6}
              onClick={async () => {
                setOtpError(''); setOtpMsg('');
                setOtpLoading(true);
                try {
                  const res = await verifyOtp({ rollNumber: user?.rollNumber, otp: otpInput });
                  if (res.data?.success && res.data?.resetToken) {
                    setResetToken(res.data.resetToken);
                    setOtpVerified(true);
                    setOtpMsg('Identity verified! You can now set a new password.');
                  }
                } catch (err) {
                  setOtpError(err.response?.data?.error || 'Invalid OTP. Please try again.');
                } finally {
                  setOtpLoading(false);
                }
              }}
              className="px-6 py-3 bg-primary text-white rounded-lg text-[14px] font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Verify <ArrowRight size={16} />
            </button>
          </div>
          <button
            onClick={() => { setOtpSent(false); setOtpInput(''); setOtpError(''); setOtpMsg(''); }}
            className="w-full mt-3 text-[13px] font-medium text-body-muted hover:text-ink transition-colors"
          >
            Didn't receive OTP? Send again
          </button>
        </div>
      </div>
    ) : (
      <div className="flex flex-col gap-5">
        <div className="p-4 border border-green-200 rounded-xl bg-pale-green flex items-center gap-3">
          <CheckCircle2 size={20} className="text-deep-green flex-shrink-0" />
          <p className="font-sans text-[14px] font-medium text-deep-green">
            Identity verified! Set your new password below.
          </p>
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
              await resetPassword({ resetToken, newPassword: pwForm.next });
              setPwMsg('Password changed successfully');
              setPwForm({ next:'', confirm:'' });
              setOtpSent(false);
              setOtpVerified(false);
              setResetToken('');
              setOtpInput('');
            } catch (err) {
              setPwErr(err.response?.data?.error || 'Failed to change password');
            } finally {
              setPwLoading(false);
            }
          }}
          className="justify-center w-full mt-2 button-primary disabled:opacity-50">
          {pwLoading ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    )}
  </div>
)}
    </div>
  );
}
