import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useAuth } from '../../context/AuthContext'
import { getActiveBatchSession, scanQr, getMyStats } from '../../api/attendance'

function getStudentGps() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: Math.round(pos.coords.accuracy),
      }),
      (err) => reject(new Error(err.message || 'GPS access denied. Please allow location permissions to verify you are inside the classroom.')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  })
}

export default function StudentAttendance() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const scannerRef = useRef(null)
  const scannerInstance = useRef(null)

  const [activeSession, setActiveSession] = useState(null)
  const [stats, setStats] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scanSuccess, setScanSuccess] = useState(null)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [sessRes, statsRes] = await Promise.all([
        getActiveBatchSession(),
        getMyStats(),
      ])
      setActiveSession(sessRes.data?.data || null)
      setStats(statsRes.data?.data || null)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user || (user.role !== 'student' && user.role !== 'cr')) {
      navigate('/login')
      return
    }
    loadData()
  }, [user, navigate])

  useEffect(() => {
    if (!scanning) {
      if (scannerInstance.current) {
        scannerInstance.current.clear().catch(() => {})
        scannerInstance.current = null
      }
      return
    }

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 260, height: 260 },
        aspectRatio: 1.0,
      },
      false
    )

    scannerInstance.current = scanner

    scanner.render(
      async (decodedText) => {
        setError('')
        setMsg('')
        setScanSuccess(null)
        try {
          let payload
          try {
            payload = JSON.parse(decodedText)
          } catch {
            throw new Error('Invalid QR code scanned. Please scan the official class QR code on screen.')
          }

          const { sessionId, token, checkpointNumber = 0 } = payload
          if (!sessionId || !token) {
            throw new Error('QR payload is missing session token. Please scan the latest code on the faculty screen.')
          }

          // Step: Get live high-accuracy GPS coordinates
          const gps = await getStudentGps()

          const res = await scanQr({
            sessionId,
            token,
            checkpointNumber,
            latitude: gps.latitude,
            longitude: gps.longitude,
          })

          const successMsg = res.data.message || 'Attendance marked successfully!'
          setMsg(successMsg)
          setScanSuccess({
            distance: res.data.distanceInMeters,
            checkpoint: checkpointNumber,
          })

          scanner.clear().catch(() => {})
          setScanning(false)
          loadData()
        } catch (err) {
          const errText = err.response?.data?.error || err.message || 'Attendance scan failed'
          setError(errText)
        }
      },
      () => {
        // scan progress callback
      }
    )

    return () => {
      scanner.clear().catch(() => {})
    }
  }, [scanning])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas text-ink pt-[48px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-sans text-[15px] text-ink-muted-80">Loading attendance scanner…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas text-ink pt-[48px] pb-16">
      <div className="max-w-lg mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <span className="font-sans text-[12px] font-bold uppercase tracking-wider text-primary">Classroom QR</span>
            <h1 className="font-display text-[26px] font-bold text-ink">Mark Attendance</h1>
            <p className="font-sans text-[13px] text-ink-muted-80">
              Batch: <span className="font-semibold text-ink">{user?.batch}</span>
              {user?.section && <span> · Section {user.section}</span>}
            </p>
          </div>
          <Link to="/students" className="button-secondary text-[14px]">
            ← Student Portal
          </Link>
        </div>

        {/* Stats card */}
        {stats && (
          <div className={`border border-divider-soft bg-surface-pearl rounded-2xl shadow-sm p-5 ${
            stats.lowAttendance ? 'border-amber-500/40 bg-amber-500/5' : ''
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-sans text-[13px] text-ink-muted-80 font-medium">Your Overall Attendance</p>
                <p className="font-display text-[36px] font-bold text-ink mt-0.5">{stats.percentage}%</p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider ${
                  stats.percentage >= 75 ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/15 text-amber-600'
                }`}>
                  {stats.percentage >= 75 ? 'Eligible ✓' : 'Below 75% ⚠'}
                </span>
                <p className="font-sans text-[12px] text-ink-muted-80 mt-1">
                  {stats.attended} of {stats.totalSessions} sessions
                </p>
              </div>
            </div>

            {stats.lowAttendance && (
              <p className="font-sans text-[12px] text-amber-600 dark:text-amber-400 mt-3 pt-3 border-t border-amber-500/20 font-medium">
                ⚠ Attendance is below mandatory 75%. Please ensure you scan in upcoming lectures.
              </p>
            )}
          </div>
        )}

        {/* Active session card */}
        {activeSession ? (
          <div className="border border-green-500/30 bg-green-500/5 rounded-2xl shadow-sm p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-green-500 text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span> Live Lecture
              </span>
              <span className="font-mono text-[12px] text-ink-muted-80 font-medium">{activeSession.batch}</span>
            </div>

            <div>
              <h2 className="font-display text-[22px] font-bold text-ink">{activeSession.subject || activeSession.course}</h2>
              <p className="font-sans text-[14px] text-ink-muted-80 mt-0.5">
                Faculty: <span className="font-semibold text-ink">{activeSession.faculty?.name || 'Professor'}</span>
                {activeSession.section && <span> · Section {activeSession.section}</span>}
              </p>
            </div>

            <p className="font-sans text-[13px] text-green-700 dark:text-green-400 font-medium pt-1">
              ✓ Geofence is active. Ensure you are in the classroom and scan the QR on screen.
            </p>
          </div>
        ) : (
          <div className="border border-divider-soft bg-surface-pearl rounded-2xl shadow-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-divider-soft flex items-center justify-center mx-auto mb-3 text-ink-muted-80">
              ◷
            </div>
            <h3 className="font-display text-[18px] font-semibold text-ink">No Active Lecture</h3>
            <p className="font-sans text-[14px] text-ink-muted-80 mt-1 max-w-xs mx-auto">
              There is currently no active attendance session for batch {user?.batch}. The scanner will activate when the faculty starts a session.
            </p>
            <button
              onClick={loadData}
              className="button-secondary text-[13px] !py-2 !px-4 mt-4"
            >
              ↻ Check Again
            </button>
          </div>
        )}

        {/* Notifications */}
        {msg && (
          <div className="rounded-2xl bg-green-500/15 border border-green-500/30 p-5 text-green-800 dark:text-green-300">
            <div className="flex items-center gap-2 font-bold text-[16px]">
              <span>✓</span> {msg}
            </div>
            {scanSuccess && scanSuccess.distance != null && (
              <p className="font-sans text-[13px] mt-1 opacity-90">
                Verified: You were <strong>{scanSuccess.distance} meters</strong> from the faculty device.
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-red-500/15 border border-red-500/30 p-5 text-red-700 dark:text-red-400">
            <div className="flex items-center gap-2 font-bold text-[15px]">
              <span>⚠</span> Scan Failed
            </div>
            <p className="font-sans text-[14px] mt-1">{error}</p>
          </div>
        )}

        {/* Scanner Controller */}
        {!scanning ? (
          <button
            onClick={() => { setScanning(true); setError(''); setMsg(''); setScanSuccess(null) }}
            disabled={!activeSession}
            className="button-primary w-full py-4 text-[16px] font-bold shadow-lg disabled:opacity-50"
          >
            {activeSession ? '📷 Open Camera & Scan QR Code' : 'Waiting for Class Session to Start'}
          </button>
        ) : (
          <div className="space-y-4 border border-divider-soft bg-surface-pearl rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[14px] font-semibold text-ink">Camera Active</span>
              <button
                onClick={() => setScanning(false)}
                className="text-[13px] font-medium text-red-500 hover:underline"
              >
                Cancel Scanning
              </button>
            </div>

            <div id="qr-reader" ref={scannerRef} className="rounded-xl overflow-hidden shadow-inner bg-black" />

            <p className="font-sans text-[12px] text-ink-muted-80 text-center leading-relaxed">
              Point your camera at the revolving QR code displayed on the classroom screen. Live GPS coordinates will be verified automatically.
            </p>
          </div>
        )}

        {/* Info instructions */}
        <div className="border border-divider-soft bg-surface-pearl rounded-2xl shadow-sm p-5 space-y-3">
          <h4 className="font-display text-[16px] font-bold text-ink">How Smart Attendance Works</h4>
          <ul className="font-sans text-[13px] text-ink-muted-80 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">1.</span>
              <span><strong>100m GPS Geofence:</strong> Attendance is anchored to the faculty's live device location. Proxies from home or outside the classroom are blocked.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">2.</span>
              <span><strong>15s Rotating QR:</strong> Screen QR dynamically regenerates every 15 seconds so screenshots cannot be shared in WhatsApp groups.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">3.</span>
              <span><strong>Surprise Checkpoints:</strong> A random checkpoint QR may appear mid-class. Re-scan within 20 seconds to stay marked present.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
