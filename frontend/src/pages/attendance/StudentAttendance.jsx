import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useAuth } from '../../context/AuthContext'
import { getActiveBatchSession, scanQr, getMyStats } from '../../api/attendance'
import { getBestLocation } from '../../utils/location'

function getStudentGps() {
  return getBestLocation({
    maxAccuracyMeters: 120,
    timeoutMs: 15000,
    attempts: 4,
  })
}

export default function StudentAttendance() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const scannerRef = useRef(null)
  const scannerInstance = useRef(null)
  const scanCooldownRef = useRef(0)

  const [activeSession, setActiveSession] = useState(null)
  const [stats, setStats] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scanSuccess, setScanSuccess] = useState(null)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [errorDebug, setErrorDebug] = useState(null)
  const [loading, setLoading] = useState(true)
  const [scanRetryCount, setScanRetryCount] = useState(0)
  const [gpsDebug, setGpsDebug] = useState(null)
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const normalize = (value) => String(value ?? '').trim().toLowerCase()

  const isSessionForStudent = (session, currentUser) => {
    if (!session) return false
    if (normalize(session.batch) !== normalize(currentUser?.batch)) return false

    const sessionSection = normalize(session.section)
    const userSection = normalize(currentUser?.section)

    if (!userSection) {
      return !sessionSection
    }

    return !sessionSection || sessionSection === userSection
  }

  const loadData = async () => {
    try {
      const [sessRes, statsRes] = await Promise.all([
        getActiveBatchSession(),
        getMyStats(),
      ])

      const session = sessRes.data?.data
      setActiveSession(isSessionForStudent(session, user) ? session : null)
      setStats(statsRes.data?.data || null)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const refreshStudentGps = async () => {
    try {
      setError('')
      const gps = await getStudentGps()
      setGpsDebug({
        latitude: gps.latitude,
        longitude: gps.longitude,
        accuracy: gps.accuracy,
        timestamp: new Date().toLocaleTimeString(),
      })
      setMsg(`GPS refreshed: ${gps.latitude.toFixed(6)}°, ${gps.longitude.toFixed(6)}° (±${gps.accuracy}m)`)
    } catch (err) {
      setError(err.message || 'Failed to refresh GPS location')
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
        // Prevent rapid repeated scans (debounce)
        const now = Date.now()
        if (now - scanCooldownRef.current < 2000) {
          return
        }

        setError('')
        setMsg('')
        setScanSuccess(null)
        setScanRetryCount(0)
        
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
          setGpsDebug({
            latitude: gps.latitude,
            longitude: gps.longitude,
            accuracy: gps.accuracy,
            timestamp: new Date().toLocaleTimeString(),
          })

          const res = await scanQr({
            sessionId,
            token,
            checkpointNumber,
            latitude: gps.latitude,
            longitude: gps.longitude,
            accuracy: gps.accuracy,
          })

          const successMsg = res.data.message || 'Attendance marked successfully!'
          setMsg(successMsg)
          setSuccessMessage(successMsg)
          setScanSuccess({
            distance: res.data.distanceInMeters,
            checkpoint: checkpointNumber,
          })

          // Show success overlay with animation
          setShowSuccessOverlay(true)
          
          // Auto-dismiss and reset after 2.5 seconds
          setTimeout(() => {
            setShowSuccessOverlay(false)
            scanner.clear().catch(() => {})
            setScanning(false)
            loadData()
          }, 2500)
          
          scanCooldownRef.current = now
        } catch (err) {
          scanCooldownRef.current = now
          const errText = err.response?.data?.error || err.message || 'Attendance scan failed'
          const debugData = err.response?.data?.debug
          setError(errText)
          setErrorDebug(debugData)
          
          // For geofence/GPS errors, keep scanner but disable temporarily
          if (errText.includes('far') || errText.includes('GPS') || errText.includes('geofence')) {
            setScanRetryCount(prev => prev + 1)
            if (scanRetryCount < 2) {
              // Allow 1-2 retries, then require manual intervention
              return
            }
            // After 2 failed attempts, ask user to check location
            scanner.pause()
          }
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

  // Inject animations on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.gpsAnimationsInjected) {
      const style = document.createElement('style')
      style.textContent = `
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-up {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes checkmark-draw {
          0% {
            stroke-dasharray: 50;
            stroke-dashoffset: 50;
          }
          100% {
            stroke-dasharray: 50;
            stroke-dashoffset: 0;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-scale-up {
          animation: scale-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .animate-checkmark {
          animation: checkmark-draw 0.6s ease-out 0.2s forwards;
          stroke-dasharray: 50;
          stroke-dashoffset: 50;
        }
      `
      document.head.appendChild(style)
      window.gpsAnimationsInjected = true
    }
  }, [])

  return (
    <div className="min-h-screen bg-canvas text-ink pt-[48px] pb-16">
      {/* Success Overlay with Checkmark Animation */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white dark:bg-ink rounded-3xl shadow-2xl p-8 text-center space-y-4 animate-scale-up max-w-sm mx-4">
            {/* Animated Checkmark Circle */}
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 rounded-full bg-green-500/15 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-green-500 animate-checkmark"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Success Text */}
            <div>
              <h2 className="font-display text-[32px] font-bold text-green-600 dark:text-green-400">Present ✓</h2>
              <p className="font-sans text-[15px] text-ink-muted-80 mt-2">{successMessage}</p>
              {scanSuccess?.distance != null && (
                <p className="font-sans text-[13px] text-ink-muted-80 mt-3 pt-3 border-t border-divider-soft">
                  📍 Verified at {scanSuccess.distance}m
                </p>
              )}
            </div>

            {/* Bounce Indicator */}
            <div className="flex justify-center gap-1.5 pt-4">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      )}

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

            {/* GPS Debug Info */}
            {errorDebug && (
              <div className="mt-4 pt-4 border-t border-red-500/20 space-y-2">
                <p className="font-sans text-[13px] font-semibold">📍 GPS Debug Info:</p>
                <div className="bg-red-500/5 rounded-lg p-3 font-mono text-[11px] space-y-1 text-red-900 dark:text-red-200">
                  {errorDebug.studentLat && (
                    <>
                      <div>📱 Your GPS: {errorDebug.studentLat}°N, {errorDebug.studentLng}°E</div>
                      <div>� Your GPS accuracy: {errorDebug.studentAccuracy ?? 'N/A'}m</div>
                      <div>👨‍🏫 Faculty GPS: {errorDebug.facultyLat}°N, {errorDebug.facultyLng}°E</div>
                      <div>📡 Faculty GPS accuracy: {errorDebug.facultyAccuracy ?? 'N/A'}m</div>
                      <div>📏 Distance: {errorDebug.calculatedDistance}m (limit: 100m)</div>
                      {errorDebug.swappedDistance && (
                        <div className="mt-1 pt-1 border-t border-red-500/20">
                          🔄 If coords swapped: {errorDebug.swappedDistance}m {errorDebug.swappedDistance <= 100 ? '✓ WOULD WORK' : ''}
                        </div>
                      )}
                    </>
                  )}
                </div>
                {errorDebug.troubleshooting && (
                  <div className="mt-2 space-y-1 text-[12px]">
                    {errorDebug.troubleshooting.split('\n').map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {error.includes('far') && (
              <div className="mt-3 pt-3 border-t border-red-500/20 space-y-2">
                <p className="font-sans text-[13px] font-semibold">Try these:</p>
                <ul className="font-sans text-[12px] space-y-1 ml-4">
                  <li>✓ Move closer to the faculty device</li>
                  <li>✓ Ensure location permissions are enabled</li>
                  <li>✓ Verify your device GPS is accurate</li>
                  <li>✓ Ask faculty to re-calibrate their GPS location</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Scanner Controller */}
        {!scanning ? (
          <button
            onClick={() => { setScanning(true); setError(''); setMsg(''); setScanSuccess(null); setShowSuccessOverlay(false) }}
            disabled={!activeSession || showSuccessOverlay}
            className="button-primary w-full py-4 text-[16px] font-bold shadow-lg disabled:opacity-50 transition-all duration-300"
          >
            {showSuccessOverlay ? '✓ Attendance Confirmed' : activeSession ? '📷 Open Camera & Scan QR Code' : 'Waiting for Class Session to Start'}
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

            <div id="qr-reader" ref={scannerRef} className="qr-scanner-shell rounded-xl overflow-hidden shadow-inner bg-black" />

            <p className="font-sans text-[12px] text-ink-muted-80 text-center leading-relaxed">
              Point your camera at the revolving QR code displayed on the classroom screen. Live GPS coordinates will be verified automatically.
            </p>
          </div>
        )}

        {/* GPS Refresh & Debug Info */}
        {activeSession && (
          <div className="border border-divider-soft bg-surface-pearl rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[13px] font-semibold text-ink">Your Live Location</span>
              <button
                onClick={refreshStudentGps}
                className="text-[12px] font-medium text-primary hover:underline"
              >
                🔄 Refresh GPS
              </button>
            </div>
            
            {gpsDebug && (
              <div className="bg-canvas rounded-lg p-3 space-y-1">
                <p className="font-mono text-[11px] text-ink-muted-80">
                  Lat: {gpsDebug.latitude.toFixed(6)}°
                </p>
                <p className="font-mono text-[11px] text-ink-muted-80">
                  Lng: {gpsDebug.longitude.toFixed(6)}°
                </p>
                <p className="font-mono text-[11px] text-ink-muted-80">
                  Accuracy: ±{gpsDebug.accuracy}m
                </p>
                <p className="font-mono text-[11px] text-ink-muted-80 opacity-60">
                  Updated: {gpsDebug.timestamp}
                </p>
              </div>
            )}
            
            {activeSession && (
              <div className="bg-canvas rounded-lg p-3 space-y-1 text-[11px]">
                <p className="font-mono text-ink-muted-80">
                  Faculty Lat: {(activeSession.centerLat ?? 'N/A').toFixed ? (activeSession.centerLat).toFixed(6) : 'N/A'}°
                </p>
                <p className="font-mono text-ink-muted-80">
                  Faculty Lng: {(activeSession.centerLng ?? 'N/A').toFixed ? (activeSession.centerLng).toFixed(6) : 'N/A'}°
                </p>
                <p className="font-mono text-ink-muted-80">
                  Faculty GPS accuracy: ±{activeSession.centerAccuracy ?? 'N/A'}m
                </p>
              </div>
            )}
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
