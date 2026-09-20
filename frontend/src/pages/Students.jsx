import { useState, useRef } from 'react';
import { Check, AlertTriangle, XCircle, CheckCircle2, Mail, ShieldCheck, ArrowRight, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext';
import { changePassword, forgotPassword, verifyOtp, resetPassword } from '../api/auth';
import { getAnnouncements } from '../api/announcements';
import { uploadPhoto, getBatchStudents } from '../api/students';
import { getDeadlines, submitDeadline } from '../api/deadlines';
import { getRoutine } from '../api/routines';

export default function Students() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [activeTab, setActiveTab] = useState('deadlines');
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

  const submitDeadlineMut = useMutation({
    mutationFn: (id) => submitDeadline(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deadlines'] });
      showToast('Deadline submitted successfully!')
    }
  });

  

  const photoMut = useMutation({
    mutationFn: (fd) => uploadPhoto(fd),
    onSuccess: (res) => {
      const updated = { ...user, photo: res.data.data.photo };
      localStorage.setItem('ei_user', JSON.stringify(updated));
      qc.invalidateQueries({ queryKey: ['me'] });
      setPhotoError('');
      showToast('Profile photo updated successfully!')
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

  const TABS = ['deadlines', 'routine', 'announcements', 'password'];

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
    <div className="w-full px-4 min-h-screen pt-32 pb-20 sm:max-w-[1280px] sm:mx-auto sm:px-6 md:px-8 lg:px-10">
      {/* ── Profile header ── */}
      <div className="flex flex-col items-center gap-8 pb-12 mb-12 border-b md:flex-row md:items-start border-divider-soft">
        <div className="relative flex-shrink-0">
          <div
            onClick={() => fileRef.current?.click()}
            className="flex items-center justify-center overflow-hidden transition-colors border rounded-full shadow-sm cursor-pointer w-28 h-28 bg-[#f8fafc] group border-divider-soft hover:border-ink"
          >
            {user?.photo ? (
              <img src={user.photo} alt={user.name} className="object-cover w-full h-full" />
            ) : (
              <span className="font-sans text-4xl text-ink-muted-48 group-hover:text-ink">{user?.name?.charAt(0)}</span>
            )}
            <div className="absolute inset-0 flex items-center justify-center transition-opacity opacity-0 bg-black/40 group-hover:opacity-100">
              <span className="text-xs font-medium text-white">Edit</span>
            </div>
          </div>
          <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
        </div>

        <div className="flex-1 text-center md:text-left">
          <h1 className="font-sans font-medium text-[32px] md:text-[40px] tracking-tight text-ink leading-tight mb-2">
            {user?.name}
          </h1>
          <p className="font-sans text-[17px] font-medium text-ink-muted-80 flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1">
            <span>Roll {user?.rollNumber || '—'}</span>
            <span className="opacity-50">·</span>
             <span>Batch {user?.batch}</span>
          </p>
          {photoError && <p className="text-red-500 text-[14px] mt-2 font-[450]">{photoError}</p>}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4 md:justify-start">
          </div>
        </div>
      </div>

      {/* ── Tabs (Pill style) ── */}
      <div className="flex w-full gap-2 px-4 py-3 mb-10 overflow-x-auto bg-white border rounded-md border-divider-soft scrollbar-thin scroll-smooth">
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`font-sans text-[13px] sm:text-[14px] font-medium uppercase tracking-[0.02em] sm:tracking-[0.04em] px-5 py-3 shrink-0 rounded-md transition-all whitespace-nowrap ${
              activeTab === t ? 'bg-ink text-canvas shadow-sm' : 'text-[#696969] bg-transparent hover:text-ink hover:bg-[#f8fafc]'
            }`}
            style={{ transitionDuration: '0.22s', transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}>
            {t === 'deadlines' ? 'Deadlines'
            : t === 'routine' ? 'Routine'
                        : t === 'password' ? 'Password'
            : 'Announcements'}
          </button>
        ))}
      </div>

      {/* ── Deadlines Feed (Premium Glassy Tracking UI) ── */}
      {activeTab === 'deadlines' && (
        <div className="duration-300 animate-in fade-in">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-sans text-[28px] font-medium tracking-[-0.02em] text-ink">Assignments & Deadlines</h2>
          </div>
          
          {deadlinesLoading ? <div className="space-y-4 skeleton-shimmer"><div className="h-40 bg-[#f8fafc] rounded-[10px]" /></div> : !user?.batch ? (
            <div className="py-16 text-center bg-white border rounded-md border-divider-soft">
              <p className="text-ink-muted-80 font-sans text-[16px] font-[450] mb-4">No batch assigned yet.</p>
              <p className="text-slate font-sans text-[14px] mb-6">Please set your batch in <Link to="/profile/edit" className="underline text-link hover:text-link-active">Edit Profile</Link> to see your deadlines and routine.</p>
            </div>
          ) : deadlines.length === 0 ? (
            <div className="py-16 text-center bg-white border rounded-md border-divider-soft">
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
                  <div key={d._id} className="p-6 md:p-8 border border-divider-soft bg-[#ffffff] rounded-md flex flex-col transition-colors hover:border-ink relative group">
                    <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="font-sans text-[12px] font-medium bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 px-3 py-1 rounded-full uppercase tracking-wider border border-blue-500/20">
                            {d.type}
                          </span>
                          <span className="font-sans text-[13px] font-medium text-ink-muted-80">
                            {d.subject}
                          </span>
                        </div>
                        <h3 className="font-sans text-[22px] font-medium text-ink line-clamp-2 mb-2">
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

                      <div className="md:w-[300px] flex-shrink-0 bg-[#ffffff] rounded-md p-5 border border-divider-soft">
                        {user?.role === 'student' ? (
                          <div className="flex flex-col items-center justify-center h-full text-center">
                            <button
                              onClick={() => submitDeadlineMut.mutate(d._id)}
                              className={`w-full py-3 px-6 rounded-lg font-sans font-medium text-[14px] transition-colors ${
                                hasSubmitted
                                  ? 'bg-success text-white hover:bg-success/90'
                                  : 'bg-ink text-canvas hover:bg-ink/90'
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
                              <span className="font-sans text-[13px] font-medium text-ink uppercase tracking-wider">Progress</span>
                              <span className="font-sans text-[18px] font-medium text-ink">{submitCount} / {totalStudents}</span>
                            </div>
                            <div className="w-full h-2 mb-4 overflow-hidden rounded-md bg-[#f8fafc]">
                              <div 
                                className="h-full transition-all duration-500 rounded-md bg-link"
                                style={{ width: `${totalStudents > 0 ? (submitCount/totalStudents)*100 : 0}%` }}
                              ></div>
                            </div>
                            
                            {isComplete ? (
                              <button className="w-full py-2.5 bg-success text-white rounded-md font-sans font-medium text-[13px] shadow-sm uppercase tracking-wide cursor-default">
                                Ready to deliver to professor <CheckCircle2 size={14} />
                              </button>
                            ) : (
                              <div className="flex-1 overflow-y-auto pr-1 max-h-[120px] scrollbar-thumb-black/10">
                                <span className="font-sans text-[11px] font-medium text-ink-muted-48 uppercase tracking-wider block mb-2">Not Submitted ({missingStudents.length})</span>
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
             <div className="space-y-4 skeleton-shimmer"><div className="h-40 bg-[#f8fafc] rounded-[10px]" /></div>
          ) : !user?.batch ? (
            <div className="py-16 text-center bg-white border rounded-md border-divider-soft">
              <p className="text-ink-muted-80 font-sans text-[16px] font-[450] mb-4">No batch assigned yet.</p>
              <p className="text-slate font-sans text-[14px] mb-6">Please set your batch in <Link to="/profile/edit" className="underline text-link hover:text-link-active">Edit Profile</Link> to see your class routine.</p>
            </div>
          ) : routineData?.data?.length > 0 ? (
            <table className="w-full min-w-[600px] border-collapse text-[14px] font-sans border border-divider-soft rounded-md bg-white">
              <thead>
                <tr className="border-b border-divider-soft bg-[#ffffff]">
                  <th className="w-32 px-4 py-4 font-medium text-left text-ink-muted-80">Time</th>
                  {['Mon','Tue','Wed','Thu','Fri'].map(d => (
                    <th key={d} className="px-2 py-4 font-medium text-center text-ink-muted-80">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {routineData.data.map((row, i) => (
                  <tr key={i} className="transition-colors border-b border-divider-soft hover:bg-[#f8fafc] last:border-b-0">
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
            <div className="py-16 text-center bg-white border rounded-md border-divider-soft">
              <p className="text-ink-muted-80 font-sans text-[16px] font-[450]">No class routine published yet.</p>
            </div>
          )}
        </div>
      )}

      

      {/* -- Announcements -- */}
      {activeTab === 'announcements' && (
        <div className="space-y-4 duration-300 animate-in fade-in">
          {announcementsLoading ? (
            <div className="h-40 rounded-md skeleton-shimmer bg-[#f8fafc]"></div>
          ) : announcementsData?.data?.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {announcementsData.data.map(a => (
                 <div key={a._id} className="bg-white rounded-md p-[24px] border border-divider-soft text-left hover:border-ink transition-shadow duration-300"
                   style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="font-mono text-[11px] font-medium uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-pale-green text-deep-green border border-green-200">
                      {a.category || 'general'}
                    </span>
                    <span className="font-sans text-[13px] text-ink-muted-80">{new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-sans text-[17px] font-medium text-ink mb-1">{a.title}</h3>
                  {a.content && <p className="font-sans text-[14px] text-ink-muted-80 line-clamp-3">{a.content}</p>}
                  {a.targetAudience === 'batch' && a.batchId && (
                    <p className="font-mono text-[12px] text-slate mt-2">Target classroom: {a.batchId}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-ink-muted-80 text-[17px] py-12 text-center font-sans border border-divider-soft rounded-md bg-white">No announcements yet.</p>
          )}
        </div>
      )}

{activeTab === 'password' && (
  <div className="w-full max-w-[400px] mx-auto animate-in fade-in duration-300">
    <p className="font-sans text-[17px] font-normal text-ink-muted-80 mb-8">
      Change your account password.
    </p>

    {!otpSent ? (
      <div className="flex flex-col gap-5">
        <div className="p-6 text-center border border-divider-soft rounded-[10px] bg-white">
          <div className="flex items-center justify-center mx-auto mb-4 rounded-full w-14 h-14 bg-soft-stone">
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
        <div className="p-6 border border-divider-soft rounded-[10px] bg-white">
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
              className="flex-1 w-full max-w-full box-border min-w-0 bg-[#ffffff] border border-divider-soft text-ink px-4 py-3 text-[15px] text-center tracking-[0.15em] font-mono rounded-sm focus:outline-none focus:border-info-border focus:ring-1 focus:ring-info-border transition-all placeholder:text-ink-muted-48"
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
              className="px-6 py-3 bg-primary text-white rounded-lg text-[14px] font-medium hover:bg-primary-active transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
        <div className="flex items-center gap-3 p-4 border border-hairline rounded-md bg-[#f8fafc]">
          <CheckCircle2 size={20} className="flex-shrink-0 text-deep-green" />
          <p className="font-sans text-[14px] font-medium text-deep-green">
            Identity verified! Set your new password below.
          </p>
        </div>
        <div>
          <label className="sr-only">New Password</label>
          <input type="password" value={pwForm.next} placeholder="New Password"
            onChange={e => setPwForm(f=>({...f,next:e.target.value}))}
            className="w-full bg-[#ffffff] border border-divider-soft text-ink px-4 py-3 text-[17px] rounded-sm focus:outline-none focus:border-info-border focus:ring-1 focus:ring-info-border transition-all placeholder:text-ink-muted-48"
            style={{ transitionDuration: '0.22s', transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }} />
        </div>
        <div>
          <label className="sr-only">Confirm Password</label>
          <input type="password" value={pwForm.confirm} placeholder="Confirm Password"
            onChange={e => setPwForm(f=>({...f,confirm:e.target.value}))}
            className="w-full bg-[#ffffff] border border-divider-soft text-ink px-4 py-3 text-[17px] rounded-sm focus:outline-none focus:border-info-border focus:ring-1 focus:ring-info-border transition-all placeholder:text-ink-muted-48"
            style={{ transitionDuration: '0.22s', transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }} />
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
