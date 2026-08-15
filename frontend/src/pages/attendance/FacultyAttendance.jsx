import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { QRCodeSVG } from 'qrcode.react'
import { io } from 'socket.io-client'
import {
  getActiveSession,
  startSession,
  endSession,
  triggerCheckpoint,
  getSessionFeed,
  getMyClasses,
  getSessionRoster,
  getSubjects,
  deleteAttendanceRecord,
} from '../../api/attendance'
import { getSocketUrl } from '../../utils/socket'

const FALLBACK_BATCHES = ['2023-2027', '2024-2028', '2025-2029', '2026-2030']
const FALLBACK_SECTIONS = ['A', 'B', 'All']
const FALLBACK_SUBJECTS = ['ECT', 'EM-II', 'DE', 'NA', 'Maths', 'ECT Lab', 'EM Lab']

function getBrowserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords
        // Validate coordinates are within valid range
        if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
          reject(new Error('Invalid GPS coordinates received. Please ensure your device GPS is working.'))
          return
        }
        resolve({
          centerLat: latitude,
          centerLng: longitude,
          accuracy: Math.round(accuracy),
        })
      },
      (err) => reject(new Error(err.message || 'Could not get device GPS location. Please allow location permissions.')),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    )
  })
}

export default function FacultyAttendance() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const socketRef = useRef(null)

  const [tab, setTab] = useState('take') // 'take' | 'records'
  const [session, setSession] = useState(null)
  const [feed, setFeed] = useState([])
  const [qrData, setQrData] = useState(null)
  const [qrTimer, setQrTimer] = useState(15)
  const [checkpointAlert, setCheckpointAlert] = useState(null)

  // Selection form
  const [form, setForm] = useState({
    batch: '',
    subject: '',
    durationMinutes: 60,
  })
  const [gpsLocation, setGpsLocation] = useState(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [startLoading, setStartLoading] = useState(false)
  const [sessionGpsDebug, setSessionGpsDebug] = useState(null)

  // My Classes state
  const [myClasses, setMyClasses] = useState([])
  const [classesLoading, setClassesLoading] = useState(false)
  const [selectedRosterSession, setSelectedRosterSession] = useState(null)
  const [rosterData, setRosterData] = useState(null)
  const [rosterLoading, setRosterLoading] = useState(false)
  const [deletingRecordId, setDeletingRecordId] = useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  // Compute available options from teachingAssignments
  const assignments = user?.teachingAssignments || []
  const hasAssignments = assignments.length > 0

  const availableBatches = hasAssignments
    ? [...new Set(assignments.map(a => a.batch).filter(Boolean))]
    : FALLBACK_BATCHES

  const availableSubjects = hasAssignments
    ? [...new Set(assignments.filter(a => !form.batch || a.batch === form.batch).map(a => a.subject).filter(Boolean))]
    : FALLBACK_SUBJECTS

  // Initialize defaults
  useEffect(() => {
    if (availableBatches.length > 0 && !form.batch) {
      const defaultBatch = availableBatches[0]
      setForm(f => ({ ...f, batch: defaultBatch }))
    }
  }, [availableBatches, form.batch])

  useEffect(() => {
    if (availableSubjects.length > 0 && (!form.subject || !availableSubjects.includes(form.subject))) {
      setForm(f => ({ ...f, subject: availableSubjects[0] }))
    }
  }, [availableSubjects, form.subject])

  const loadFeed = useCallback(async (sessionId) => {
    try {
      const res = await getSessionFeed(sessionId)
      if (res.data?.data?.feed) {
        setFeed(res.data.data.feed)
      }
    } catch {
      // feed query fallback
    }
  }, [])

  const loadMyClassesList = useCallback(async () => {
    setClassesLoading(true)
    try {
      const res = await getMyClasses()
      setMyClasses(res.data.data || [])
    } catch {
      // handle error
    } finally {
      setClassesLoading(false)
    }
  }, [])

  // Check active session & setup socket
  useEffect(() => {
    if (user?.role !== 'faculty') {
      navigate('/login')
      return
    }

    const token = localStorage.getItem('ei_token')
    const socket = io(getSocketUrl(), { auth: { token } })
    socketRef.current = socket

    Promise.all([
      getActiveSession().then(r => {
        const s = r.data.data
        setSession(s)
        if (s) {
          socket.emit('join-session', s._id)
          loadFeed(s._id)
        }
      }),
      loadMyClassesList(),
    ]).finally(() => setLoading(false))

    socket.on('qr-update', (data) => {
      setQrData(data)
      setQrTimer(15)
      setCheckpointAlert(data.checkpointNumber > 0 ? data.checkpointNumber : null)
    })

    socket.on('checkpoint-start', (data) => {
      setCheckpointAlert(data.checkpointNumber)
      setMsg(`Checkpoint ${data.checkpointNumber} triggered — students must re-scan!`)
    })

    socket.on('session-ended', () => {
      setSession(null)
      setQrData(null)
      setFeed([])
      setMsg('Class session ended')
      loadMyClassesList()
    })

    return () => {
      socket.disconnect()
    }
  }, [user, navigate, loadFeed, loadMyClassesList])

  // Real-time attendance feed updates
  useEffect(() => {
    if (!session?._id || !socketRef.current) return
    socketRef.current.emit('join-session', session._id)

    const onUpdate = () => loadFeed(session._id)
    socketRef.current.on('attendance-update', onUpdate)
    return () => socketRef.current?.off('attendance-update', onUpdate)
  }, [session?._id, loadFeed])

  // Countdown timer for 15s rotating QR
  useEffect(() => {
    if (!session || !qrData) return
    const interval = setInterval(() => {
      setQrTimer(prev => (prev > 1 ? prev - 1 : 15))
    }, 1000)
    return () => clearInterval(interval)
  }, [session, qrData])

  const handleCaptureGps = async () => {
    setGpsLoading(true)
    setError('')
    try {
      const loc = await getBrowserLocation()
      setGpsLocation(loc)
      setMsg(`GPS location locked: ${loc.centerLat.toFixed(6)}° N, ${loc.centerLng.toFixed(6)}° E (±${loc.accuracy}m)`)
    } catch (err) {
      setError(err.message || 'Failed to capture GPS')
    } finally {
      setGpsLoading(false)
    }
  }

  const handleRecalibrateSessionGps = async () => {
    if (!session) return
    setGpsLoading(true)
    setError('')
    try {
      const loc = await getBrowserLocation()
      setSessionGpsDebug({
        centerLat: loc.centerLat,
        centerLng: loc.centerLng,
        accuracy: loc.accuracy,
        oldLat: session.centerLat,
        oldLng: session.centerLng,
        timestamp: new Date().toLocaleTimeString(),
      })
      setMsg(`GPS recalibrated: ${loc.centerLat.toFixed(6)}° N, ${loc.centerLng.toFixed(6)}° E (±${loc.accuracy}m). Students can now re-scan if needed.`)
    } catch (err) {
      setError(err.message || 'Failed to recalibrate GPS')
    } finally {
      setGpsLoading(false)
    }
  }

  const handleStartSession = async (e) => {
    e.preventDefault()
    setError('')
    setMsg('')
    setStartLoading(true)

    try {
      let loc = gpsLocation
      if (!loc) {
        loc = await getBrowserLocation()
        setGpsLocation(loc)
      }

      const payload = {
        batch: form.batch,
        section: '',
        subject: form.subject,
        centerLat: loc.centerLat,
        centerLng: loc.centerLng,
        durationMinutes: Number(form.durationMinutes) || 60,
      }

      const res = await startSession(payload)
      const s = res.data.data
      setSession(s)
      socketRef.current?.emit('join-session', s._id)
      setMsg(`Session started for ${s.subject} (${s.batch}${s.section ? ` - Sec ${s.section}` : ''})`)
      loadFeed(s._id)
      loadMyClassesList()
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to start session')
    } finally {
      setStartLoading(false)
    }
  }

  const handleEndSession = async () => {
    if (!session) return
    if (!window.confirm('Are you sure you want to end this attendance session?')) return
    setError('')
    try {
      await endSession(session._id)
      setSession(null)
      setQrData(null)
      setFeed([])
      setMsg('Session ended successfully')
      loadMyClassesList()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to end session')
    }
  }

  const handleTriggerCheckpoint = async () => {
    if (!session) return
    try {
      await triggerCheckpoint(session._id)
      setMsg('Surprise checkpoint triggered! QR rotated with checkpoint token.')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to trigger checkpoint')
    }
  }

  const handleViewRoster = async (sess) => {
    setSelectedRosterSession(sess)
    setRosterLoading(true)
    try {
      const res = await getSessionRoster(sess._id)
      setRosterData(res.data.data)
    } catch {
      // handle
    } finally {
      setRosterLoading(false)
    }
  }

  const handleDeleteRecord = async (recordId, studentName) => {
    if (!window.confirm(`Delete attendance record for ${studentName}? This will remove them from calculations and they won't be marked absent for this day.`)) {
      return
    }

    setDeletingRecordId(recordId)
    setError('')
    try {
      const res = await deleteAttendanceRecord(recordId)
      setMsg(res.data.message || `Record deleted for ${studentName}`)

      // Refresh the roster
      if (selectedRosterSession) {
        const rosterRes = await getSessionRoster(selectedRosterSession._id)
        setRosterData(rosterRes.data.data)
      }

      // Clear message after 3 seconds
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to delete record')
    } finally {
      setDeletingRecordId(null)
    }
  }

  const qrPayload = qrData
    ? JSON.stringify({
        sessionId: qrData.sessionId,
        token: qrData.token,
        checkpointNumber: qrData.checkpointNumber || 0,
      })
    : ''

  const presentCount = feed.filter(f => f.initial && f.status === 'present').length
  const flaggedCount = feed.filter(f => f.status === 'flagged').length
  const totalCount = feed.length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas text-ink pt-[48px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-sans text-[15px] text-ink-muted-80">Loading faculty attendance console…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas text-ink pt-[48px] pb-16">
      {/* ── Header ── */}
      <header className="border-b border-divider-soft bg-surface-pearl px-6 py-5 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
              <p className="font-sans text-[12px] uppercase tracking-wider font-semibold text-primary">Faculty Attendance Portal</p>
            </div>
            <h1 className="font-display text-[26px] font-bold tracking-tight text-ink mt-0.5">{user?.name}</h1>
            <p className="font-sans text-[13px] text-ink-muted-80">
              {hasAssignments ? (
                <span>Assigned: {assignments.map(a => `${a.subject} (${a.batch}${a.section ? `-${a.section}` : ''})`).join(' · ')}</span>
              ) : (
                <span>All batches & subjects access</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/" className="button-secondary text-[14px] !py-2 !px-4">← Site</Link>
            <button onClick={() => { logout(); navigate('/login') }} className="button-secondary text-[14px] !py-2 !px-4 hover:text-red-500">
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content tabs ── */}
      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Navigation pill tabs */}
        <div className="flex gap-2 border-b border-divider-soft pb-2 overflow-x-auto">
          {[
            ['take', ' Take Attendance', session ? 'Active Now' : null],
            ['records', ' My Classes & Rosters', `${myClasses.length} Sessions`],
          ].map(([id, label, badge]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`font-sans text-[14px] font-semibold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                tab === id
                  ? 'bg-ink text-canvas shadow-sm'
                  : 'text-ink-muted-80 hover:text-ink hover:bg-surface-pearl'
              }`}
            >
              <span>{label}</span>
              {badge && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                  id === 'take' && session
                    ? 'bg-green-500 text-white animate-pulse'
                    : tab === id ? 'bg-white/20 text-white' : 'bg-surface-pearl text-ink-muted-80 border border-divider-soft'
                }`}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Global status messages */}
        {msg && (
          <div className="rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-green-700 dark:text-green-400 text-[14px] flex items-center justify-between">
            <p className="flex items-center gap-2">
              <span>✓</span> {msg}
            </p>
            <button onClick={() => setMsg('')} className="text-[12px] opacity-70 hover:opacity-100">✕</button>
          </div>
        )}
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-600 dark:text-red-400 text-[14px] flex items-center justify-between">
            <p className="flex items-center gap-2">
              <span>⚠</span> {error}
            </p>
            <button onClick={() => setError('')} className="text-[12px] opacity-70 hover:opacity-100">✕</button>
          </div>
        )}

        {/* ── TAB 1: Take Attendance ── */}
        {tab === 'take' && (
          <div>
            {!session ? (
              <section className="border border-divider-soft bg-surface-pearl rounded-2xl shadow-sm p-6 md:p-8 max-w-2xl mx-auto">
                <div className="mb-6">
                  <h2 className="font-display text-[22px] font-bold text-ink">Start Class Session</h2>
                  <p className="font-sans text-[14px] text-ink-muted-80 mt-1">
                    Select the class details and capture your live device GPS location. The geofence anchors to your device with a 100-meter radius.
                  </p>
                </div>

                <form onSubmit={handleStartSession} className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    {/* Batch */}
                    <div>
                      <label className="block font-sans text-[13px] font-semibold uppercase tracking-wider text-ink-muted-80 mb-2">
                        Batch *
                      </label>
                      <select
                        required
                        value={form.batch}
                        onChange={e => setForm(f => ({ ...f, batch: e.target.value }))}
                        className="w-full rounded-xl border border-divider-soft bg-canvas px-4 py-3 text-[15px] font-sans text-ink focus:outline-none focus:border-primary"
                      >
                        {availableBatches.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="block font-sans text-[13px] font-semibold uppercase tracking-wider text-ink-muted-80 mb-2">
                        Subject *
                      </label>
                      <select
                        required
                        value={form.subject}
                        onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                        className="w-full rounded-xl border border-divider-soft bg-canvas px-4 py-3 text-[15px] font-sans text-ink focus:outline-none focus:border-primary"
                      >
                        {availableSubjects.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block font-sans text-[13px] font-semibold uppercase tracking-wider text-ink-muted-80 mb-2">
                        Duration (Minutes)
                      </label>
                      <input
                        type="number"
                        min="15"
                        max="180"
                        value={form.durationMinutes}
                        onChange={e => setForm(f => ({ ...f, durationMinutes: e.target.value }))}
                        className="w-full rounded-xl border border-divider-soft bg-canvas px-4 py-3 text-[15px] font-sans text-ink focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* Device GPS Anchor Info */}
                  <div className="rounded-xl border border-divider-soft bg-canvas p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${gpsLocation ? 'bg-green-500' : 'bg-amber-500 animate-ping'}`}></span>
                        <span className="font-sans text-[14px] font-semibold text-ink">
                          {gpsLocation ? 'Live Device GPS Locked' : 'Device GPS Anchor (Required)'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCaptureGps}
                        disabled={gpsLoading}
                        className="button-secondary text-[12px] !py-1.5 !px-3"
                      >
                        {gpsLoading ? 'Locating…' : gpsLocation ? 'Re-calibrate GPS' : 'Calibrate Location'}
                      </button>
                    </div>

                    {gpsLocation ? (
                      <p className="font-mono text-[12px] text-green-600 dark:text-green-400">
                        {gpsLocation.centerLat.toFixed(5)}° N, {gpsLocation.centerLng.toFixed(5)}° E · Accuracy ±{gpsLocation.accuracy}m (100m geofence active)
                      </p>
                    ) : (
                      <p className="font-sans text-[12px] text-ink-muted-80">
                        Your device acts as the classroom center. Students must be within 100 meters to scan.
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={startLoading}
                    className="button-primary w-full py-4 text-[16px] font-bold shadow-md"
                  >
                    {startLoading ? 'Creating Live QR Session…' : 'Generate QR & Start Session 🚀'}
                  </button>
                </form>
              </section>
            ) : (
              /* Active Session Live Console */
              <div className="grid gap-6 lg:grid-cols-12">
                {/* QR Section */}
                <section className="lg:col-span-5 border border-divider-soft bg-surface-pearl rounded-2xl shadow-sm p-6 flex flex-col items-center text-center">
                  <div className="w-full flex items-center justify-between pb-4 border-b border-divider-soft mb-6">
                    <div className="text-left">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold bg-green-500/10 text-green-600 border border-green-500/20 uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Live Session
                      </span>
                      <h2 className="font-display text-[22px] font-bold text-ink mt-1.5">{session.subject}</h2>
                      <p className="font-sans text-[13px] text-ink-muted-80">
                        {session.batch} {session.section ? `· Sec ${session.section}` : '· All Sections'}
                      </p>
                    </div>

                    <button
                      onClick={handleEndSession}
                      className="button-secondary text-[13px] text-red-500 border-red-500/30 hover:bg-red-500/10 !py-2 !px-3"
                    >
                      End Session
                    </button>
                    
                    <button
                      onClick={handleRecalibrateSessionGps}
                      disabled={gpsLoading}
                      className="button-secondary text-[13px] !py-2 !px-3"
                    >
                      {gpsLoading ? '🔄 Calibrating…' : '🔄 Recalibrate GPS'}
                    </button>
                  </div>

                  {checkpointAlert > 0 && (
                    <div className="w-full mb-4 rounded-xl bg-amber-500/15 border border-amber-500/30 px-4 py-3 text-amber-700 dark:text-amber-300 text-center font-bold text-[14px] animate-pulse">
                      ⚡ Checkpoint {checkpointAlert} — Surprise QR Active!
                    </div>
                  )}

                  {/* GPS Debug Info */}
                  {session && (
                    <div className="w-full mb-4 rounded-xl bg-canvas border border-divider-soft p-4 space-y-2">
                      <div className="text-[11px] space-y-1">
                        <p className="font-mono text-ink-muted-80">
                          📍 Current GPS: {session.centerLat.toFixed(6)}° N, {session.centerLng.toFixed(6)}° E
                        </p>
                        {sessionGpsDebug && (
                          <>
                            <p className="font-mono text-green-600 dark:text-green-400">
                              ✓ New GPS: {sessionGpsDebug.centerLat.toFixed(6)}° N, {sessionGpsDebug.centerLng.toFixed(6)}° E (±{sessionGpsDebug.accuracy}m)
                            </p>
                            <p className="font-mono text-ink-muted-48 text-[10px]">
                              Updated: {sessionGpsDebug.timestamp}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* QR Code Container with 15s Timer Ring */}
                  <div className="relative p-6 bg-white rounded-3xl shadow-xl border border-black/5 dark:border-white/10">
                    {qrPayload ? (
                      <QRCodeSVG
                        value={qrPayload}
                        size={260}
                        level="M"
                        includeMargin
                        className="rounded-xl"
                      />
                    ) : (
                      <div className="w-[260px] h-[260px] flex items-center justify-center text-ink-muted-48">
                        Generating QR…
                      </div>
                    )}

                    {/* Rotating Indicator */}
                    <div className="absolute top-2 right-2 bg-black/80 text-white text-[11px] font-mono px-2.5 py-1 rounded-full backdrop-blur-md">
                      Rotates in {qrTimer}s
                    </div>
                  </div>

                  <p className="font-sans text-[13px] text-ink-muted-80 mt-5 max-w-xs">
                    Project this code on screen. Code automatically refreshes every 15s to prevent screenshot sharing.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2 w-full justify-center">
                    <button
                      onClick={handleTriggerCheckpoint}
                      className="button-secondary text-[13px] !py-2 !px-4"
                    >
                      ⚡ Trigger Surprise Re-Scan Checkpoint
                    </button>
                  </div>
                </section>

                {/* Live Feed Section */}
                <section className="lg:col-span-7 border border-divider-soft bg-surface-pearl rounded-2xl shadow-sm p-6 flex flex-col">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-divider-soft mb-4 gap-2">
                    <div>
                      <h3 className="font-display text-[20px] font-bold text-ink">Live Attendance Roster</h3>
                      <p className="font-sans text-[13px] text-ink-muted-80">
                        Real-time Socket.io updates as students scan
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-display text-[24px] font-bold text-primary">{presentCount}</span>
                        <span className="font-sans text-[14px] text-ink-muted-80"> / {totalCount || '—'} Present</span>
                      </div>
                    </div>
                  </div>

                  {/* Attendance List */}
                  <div className="flex-1 overflow-y-auto max-h-[480px] space-y-2 pr-1 scrollbar-thin">
                    {feed.length === 0 ? (
                      <div className="py-16 text-center text-ink-muted-80">
                        <p className="font-sans text-[15px]">Waiting for students to scan QR…</p>
                      </div>
                    ) : (
                      feed.map(({ student, status, initial, distanceInMeters, missedCheckpoints }) => (
                        <div
                          key={student._id}
                          className={`flex items-center justify-between rounded-xl px-4 py-3 border transition-all ${
                            status === 'present'
                              ? 'border-green-500/30 bg-green-500/5'
                              : status === 'flagged'
                              ? 'border-amber-500/40 bg-amber-500/10'
                              : 'border-divider-soft/50 bg-canvas/40 opacity-70'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[12px] ${
                              status === 'present'
                                ? 'bg-green-500 text-white'
                                : status === 'flagged'
                                ? 'bg-amber-500 text-white'
                                : 'bg-divider-soft text-ink-muted-80'
                            }`}>
                              {status === 'present' ? '✓' : status === 'flagged' ? '!' : '—'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-sans text-[14px] font-semibold text-ink truncate">{student.name}</p>
                              <p className="font-sans text-[12px] text-ink-muted-80 flex items-center gap-2">
                                <span className="font-mono text-primary font-medium">{student.rollNumber}</span>
                                {student.section && <span>· Sec {student.section}</span>}
                                {distanceInMeters != null && <span>· {distanceInMeters}m away</span>}
                              </p>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <span className={`text-[12px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                              status === 'present'
                                ? 'text-green-600 bg-green-500/10'
                                : status === 'flagged'
                                ? 'text-amber-600 bg-amber-500/15'
                                : 'text-ink-muted-48 bg-black/5 dark:bg-white/5'
                            }`}>
                              {status === 'flagged' && missedCheckpoints?.length
                                ? `Missed CP ${missedCheckpoints.join(',')}`
                                : status}
                            </span>
                            {initial?.timestamp && (
                              <p className="text-[11px] text-ink-muted-48 font-mono mt-0.5">
                                {new Date(initial.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: My Classes & Records ── */}
        {tab === 'records' && (
          <section className="border border-divider-soft bg-surface-pearl rounded-2xl shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-divider-soft">
              <div>
                <h2 className="font-display text-[22px] font-bold text-ink">My Class Records</h2>
                <p className="font-sans text-[14px] text-ink-muted-80">
                  Comprehensive history of past sessions with student attendance ratios and full roster inspection.
                </p>
              </div>
              <button
                onClick={loadMyClassesList}
                disabled={classesLoading}
                className="button-secondary text-[13px] !py-2 !px-4"
              >
                {classesLoading ? 'Refreshing…' : '↻ Refresh Records'}
              </button>
            </div>

            {classesLoading ? (
              <div className="py-12 text-center text-ink-muted-80">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Loading session records…
              </div>
            ) : myClasses.length === 0 ? (
              <div className="py-16 text-center border border-divider-soft rounded-xl bg-canvas">
                <p className="font-sans text-[16px] text-ink-muted-80 font-medium">No sessions conducted yet.</p>
                <p className="font-sans text-[13px] text-ink-muted-48 mt-1">Start a class session in the Take Attendance tab.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {myClasses.map((s) => (
                  <div
                    key={s._id}
                    className="border border-divider-soft bg-canvas rounded-xl p-5 hover:border-primary/50 transition-all shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-sans text-[12px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                          {s.subject}
                        </span>
                        <span className={`text-[12px] font-semibold px-2 py-0.5 rounded-full ${
                          s.status === 'active'
                            ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                            : 'bg-black/5 dark:bg-white/10 text-ink-muted-80'
                        }`}>
                          {s.status === 'active' ? '● Active' : 'Ended'}
                        </span>
                      </div>

                      <h3 className="font-display text-[18px] font-bold text-ink">{s.batch} {s.section && s.section !== 'All' ? `· Sec ${s.section}` : ''}</h3>
                      <p className="font-sans text-[13px] text-ink-muted-80 mt-1">
                        {new Date(s.startTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at{' '}
                        {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>

                      {/* Progress */}
                      <div className="mt-4 pt-3 border-t border-divider-soft">
                        <div className="flex justify-between text-[13px] font-sans mb-1">
                          <span className="text-ink-muted-80">Attendance</span>
                          <span className="font-bold text-ink">{s.presentCount} / {s.totalStudents} ({s.attendancePercentage}%)</span>
                        </div>
                        <div className="h-2 w-full bg-divider-soft rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${s.attendancePercentage >= 75 ? 'bg-green-500' : 'bg-amber-500'}`}
                            style={{ width: `${Math.min(100, s.attendancePercentage)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleViewRoster(s)}
                      className="button-secondary w-full text-[13px] !py-2 mt-4 font-semibold"
                    >
                      View Student Roster →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* ── Modal: Full Session Roster ── */}
      {selectedRosterSession && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-canvas text-ink border border-divider-soft rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-divider-soft flex items-center justify-between">
              <div className="flex-1">
                <span className="font-sans text-[12px] font-bold uppercase tracking-wider text-primary">Class Roster</span>
                <h3 className="font-display text-[22px] font-bold">{selectedRosterSession.subject}</h3>
                <p className="font-sans text-[13px] text-ink-muted-80">
                  {selectedRosterSession.batch} {selectedRosterSession.section && `· Sec ${selectedRosterSession.section}`} ·{' '}
                  {new Date(selectedRosterSession.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
                <p className="font-sans text-[12px] text-ink-muted-80 mt-2 italic">
                  💡 Click the ✕ button to delete a record. Deleted records won't be counted as absences.
                </p>
              </div>
              <button
                onClick={() => { setSelectedRosterSession(null); setRosterData(null) }}
                className="w-8 h-8 rounded-full bg-surface-pearl border border-divider-soft flex items-center justify-center hover:bg-divider-soft transition-colors flex-shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-600 text-[13px] rounded-lg">
                  ⚠️ {error}
                </div>
              )}
              {msg && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 text-green-600 text-[13px] rounded-lg">
                  ✓ {msg}
                </div>
              )}

              {rosterLoading ? (
                <div className="py-12 text-center text-ink-muted-80">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Loading student roster…
                </div>
              ) : rosterData?.feed ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-ink-muted-80 border-b border-divider-soft">
                    <span>Student ({rosterData.feed.filter(r => r.initial).length} records)</span>
                    <span>Status / Actions</span>
                  </div>
                  {rosterData.feed.map(({ student, status, distanceInMeters, initial }) => (
                    <div
                      key={student._id}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border text-[14px] ${
                        status === 'present'
                          ? 'border-green-500/20 bg-green-500/5'
                          : status === 'flagged'
                          ? 'border-amber-500/30 bg-amber-500/10'
                          : 'border-divider-soft/50 opacity-60'
                      }`}
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-ink">{student.name}</p>
                        <p className="font-sans text-[12px] text-ink-muted-80 font-mono">
                          {student.rollNumber} {student.section && `· Sec ${student.section}`}
                        </p>
                      </div>

                      <div className="text-right flex items-center gap-3">
                        <div>
                          <span className={`text-[12px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                            status === 'present'
                              ? 'text-green-600 bg-green-500/10'
                              : status === 'flagged'
                              ? 'text-amber-600 bg-amber-500/15'
                              : 'text-red-500 bg-red-500/10'
                          }`}>
                            {status}
                          </span>
                          {distanceInMeters != null && (
                            <p className="text-[11px] text-ink-muted-48 font-mono mt-0.5">
                              {distanceInMeters}m away
                            </p>
                          )}
                        </div>

                        {initial && (
                          <button
                            onClick={() => handleDeleteRecord(initial._id, student.name)}
                            disabled={deletingRecordId === initial._id}
                            title="Delete this attendance record"
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-500/10 text-red-500 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:text-red-600"
                          >
                            {deletingRecordId === initial._id ? '⏳' : '✕'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-ink-muted-80">No records found for this session.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
