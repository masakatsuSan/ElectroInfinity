import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import BackButton from '../../components/BackButton'
import { MapPin, Radio, Check, AlertTriangle, Video, RefreshCw, Power } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import { getActiveBatchSession, scanQr, getMyStats } from '../../api/attendance'
import { getBestLocation, getAnchoredLocation, getStationary } from '../../utils/location'
import { requestCameraPermission } from '../../utils/permissions'
import PermissionBanner from '../../components/PermissionBanner'

function fmtCoord(value, digits = 6) {
  const n = Number(value)
  return Number.isFinite(n) ? n.toFixed(digits) : '—'
}

function getStudentGps(session, timeoutMs = 6000, maxAccuracyMeters = 200) {
  // Fast, geofence-aware poll: short budget, prefer a fix closest to the
  // faculty anchor so flaky single-shot GPS doesn't cause false rejections.
  return getAnchoredLocation({
    maxAccuracyMeters,
    timeoutMs,
    targetLat: session?.centerLat ?? null,
    targetLng: session?.centerLng ?? null,
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
          const [cameraDevices, setCameraDevices] = useState([])
  const [currentCameraId, setCurrentCameraId] = useState(null)
  const [scannerEpoch, setScannerEpoch] = useState(0)
  // Tracks whether the live video feed is actually running (so the UI can show
  // "Starting…" / "Camera Active" instead of looking frozen).
  const [cameraActive, setCameraActive] = useState(false)

  const normalize = (value) => String(value ?? '').trim().toLowerCase()

  const isSessionForStudent = (session, currentUser) => {
    if (!session) return false
    return normalize(session.batch) === normalize(currentUser?.batch)
  }

  const loadData = useCallback(async () => {
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
  }, [user])

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
      setMsg(`GPS refreshed: ${fmtCoord(gps.latitude)}°, ${fmtCoord(gps.longitude)}° (±${gps.accuracy}m)`)
    } catch (err) {
      setError(err.message || 'Failed to refresh GPS location')
    }
  }

  // Inject animations on mount (MUST be before early returns for hook ordering)
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

  useEffect(() => {
    const currentRole = String(user?.role ?? '').trim().toLowerCase()

    if (!user || (currentRole !== 'student' && currentRole !== 'cr')) {
      navigate('/login')
      return
    }
    loadData()
  }, [user, navigate, loadData])

  // ── Scanner control helpers (all camera controls live OUTSIDE the video viewport) ──
  const scanRetryCountRef = useRef(0)

  const stopScanner = useCallback(async () => {
    const inst = scannerInstance.current
    scannerInstance.current = null
    if (inst) {
      try {
        await inst.stop()
      } catch {}
      try {
        inst.clear()
      } catch {}
    }
    setScanning(false)
  }, [])

  const restartCamera = useCallback(() => {
    setError('')
    setMsg('')
    setScannerEpoch((epoch) => epoch + 1)
  }, [])

  // Keep the latest scan handler reachable from the long-lived scanner instance
  const runScanRef = useRef(async () => {})
  runScanRef.current = async (decodedText) => {
    // Prevent rapid repeated scans (debounce)
    const now = Date.now()
    if (now - scanCooldownRef.current < 2000) {
      return
    }

    setError('')
    setMsg('')
    setScanSuccess(null)
    scanRetryCountRef.current = 0
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

      // Step: get the best GPS fix we can, then verify with the backend.
      // If the first fix is rejected for poor indoor accuracy, try once more
      // with a longer sampling window (GPS often firms up in a few seconds).
      let retried = false

      const recordDebug = (gps) => {
        setGpsDebug({
          latitude: gps.latitude,
          longitude: gps.longitude,
          accuracy: gps.accuracy,
          timestamp: new Date().toLocaleTimeString(),
        })
      }

      const complete = async (res, cp) => {
        const successMsg = res.data.message || 'Attendance marked successfully!'
        setMsg(successMsg)
        setSuccessMessage(successMsg)
        setScanSuccess({
          distance: res.data.distanceInMeters,
          checkpoint: cp,
        })
        // Show success overlay with animation
        setShowSuccessOverlay(true)
        // Auto-dismiss and reset after 2.5 seconds
        setTimeout(() => {
          setShowSuccessOverlay(false)
          stopScanner()
          loadData()
        }, 2500)
        scanCooldownRef.current = Date.now()
      }

      const doScan = async (timeoutMs, maxAccuracy) => {
        setMsg('Verifying location…')
        const [gps, stationary] = await Promise.all([
          getStudentGps(activeSession, timeoutMs, maxAccuracy),
          getStationary(),
        ])
        recordDebug(gps)
        setMsg(`Location fix ±${gps.accuracy}m — verifying…`)
        return scanQr({
          sessionId,
          token,
          checkpointNumber,
          latitude: gps.latitude,
          longitude: gps.longitude,
          accuracy: gps.accuracy,
          stationary,
        })
      }

      try {
        const res = await doScan(4500, 200)
        await complete(res, checkpointNumber)
      } catch (scanErr) {
        const scanText = scanErr.response?.data?.error || scanErr.message || ''
        if (
          !retried &&
          /accuracy|confident|too poor|far|geofence|inside|stable|imprecise/i.test(scanText)
        ) {
          retried = true
          const res2 = await doScan(6500, 250)
          await complete(res2, checkpointNumber)
        } else {
          throw scanErr
        }
      }
    } catch (err) {
      scanCooldownRef.current = now
      let errText = err.response?.data?.error || err.message || 'Attendance scan failed'
      if (/far|GPS|geofence|accuracy|confident|signal/i.test(errText)) {
        errText += ' If you are physically in class, ask faculty to tap Mark Present on you.'
      }
      const debugData = err.response?.data?.debug
      setError(errText)
      setErrorDebug(debugData)

      // For geofence/GPS errors, keep scanning but pause after 2 failed attempts
      if (errText.includes('far') || errText.includes('GPS') || errText.includes('geofence')) {
        scanRetryCountRef.current += 1
        if (scanRetryCountRef.current < 2) {
          // Allow 1-2 retries, then require manual intervention
          return
        }
        scannerInstance.current?.pause?.()
      }
    }
  }

  useEffect(() => {
    if (!scanning) {
      if (scannerInstance.current) {
        scannerInstance.current.stop().catch(() => {})
        try {
          scannerInstance.current.clear()
        } catch {}
        scannerInstance.current = null
      }
      return
    }

    let cancelled = false
    const scanner = new Html5Qrcode('qr-reader')
    scannerInstance.current = scanner

    const scanConfig = {
      fps: 10,
      qrbox: { width: 260, height: 260 },
      aspectRatio: 1.0,
    }

    const begin = async () => {
      try {
        if (!currentCameraId) {
          // No camera chosen yet → start the rear camera directly. Calling
          // getUserMedia here (right after the button tap) is what makes the
          // native camera permission prompt appear on Android & iOS.
          await scanner.start(
            { facingMode: 'environment' },
            scanConfig,
            (decodedText) => runScanRef.current(decodedText),
            () => {}
          )

          // Permission is granted now → camera labels are visible, so the
          // student can switch sources live.
          try {
            const devices = await Html5Qrcode.getCameras()
            if (!cancelled) setCameraDevices(devices)
          } catch {
            // Non-fatal — the switcher simply stays hidden.
          }
          return
        }

        await scanner.start(
          currentCameraId,
          scanConfig,
          (decodedText) => runScanRef.current(decodedText),
          () => {}
        )
      } catch (err) {
        if (cancelled) return
        const name = err?.name || ''
        const raw = err?.message || ''
        let message
        if (name === 'NotAllowedError' || name === 'SecurityError' || /permission|denied/i.test(raw)) {
          message =
            'Camera permission was blocked. Tap the camera/lock icon in the address bar → Site settings → Allow camera, then press Restart.'
        } else if (name === 'NotFoundError' || /no camera|not.?found/i.test(raw)) {
          message = 'No camera was found on this device. Connect a camera and press Restart.'
        } else if (name === 'NotReadableError' || /in use|busy/i.test(raw)) {
          message = 'The camera is being used by another app. Close it and press Restart.'
        } else {
          message = raw || 'Failed to start camera. Please check camera permissions and retry.'
        }
        setError(message)
      }
    }

    begin()

    return () => {
      cancelled = true
      scanner.stop().then(() => {
        try {
          scanner.clear()
        } catch {}
      }).catch(() => {})
    }
  }, [scanning, currentCameraId, scannerEpoch])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas text-ink pt-[48px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 rounded-full border-primary border-t-transparent animate-spin"></div>
          <p className="font-sans text-[15px] text-ink-muted-80">Loading attendance scanner…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas text-ink pt-[48px] pb-16">
      {/* Success Overlay with Checkmark Animation */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="max-w-sm p-8 mx-4 space-y-4 text-center bg-white shadow-2xl dark:bg-ink rounded-3xl animate-scale-up">
            {/* Animated Checkmark Circle */}
            <div className="flex justify-center mb-4">
              <div className="flex items-center justify-center w-24 h-24 rounded-full bg-green-500/15">
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
              <h2 className="font-display text-[32px] font-bold text-green-600 dark:text-green-400">Present <Check size={16} /></h2>
              <p className="font-sans text-[15px] text-ink-muted-80 mt-2">{successMessage}</p>
              {scanSuccess?.distance != null && (
                <p className="font-sans text-[13px] text-ink-muted-80 mt-3 pt-3 border-t border-divider-soft">
                  <MapPin size={14} /> Verified at {scanSuccess.distance}m
                </p>
              )}
            </div>

            {/* Bounce Indicator */}
            <div className="flex justify-center gap-1.5 pt-4">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-lg px-6 py-8 mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <span className="font-sans text-[12px] font-bold uppercase tracking-wider text-primary">Classroom QR</span>
              <h1 className="font-display text-[26px] font-bold text-ink">Mark Attendance</h1>
              <p className="font-sans text-[13px] text-ink-muted-80">
                 Batch: <span className="font-semibold text-ink">{user?.batch}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('ei_token')
              localStorage.removeItem('ei_user')
              window.location.href = '/login'
            }}
            className="button-secondary text-[14px]"
          >
            <Power size={16} /> Sign Out
          </button>
        </div>

        {/* Camera / location permission guidance */}
        <PermissionBanner permissions={['camera', 'location']} />

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
                  {stats.percentage >= 75 ? <><Check size={14} /> Eligible</> : <><AlertTriangle size={14} /> Below 75%</>}
                </span>
                <p className="font-sans text-[12px] text-ink-muted-80 mt-1">
                  {stats.attended} of {stats.totalSessions} sessions
                </p>
              </div>
            </div>

            {stats.lowAttendance && (
              <p className="font-sans text-[12px] text-amber-600 dark:text-amber-400 mt-3 pt-3 border-t border-amber-500/20 font-medium">
                <AlertTriangle size={14} /> Attendance is below mandatory 75%. Please ensure you scan in upcoming lectures.
              </p>
            )}
          </div>
        )}

        {/* Active session card */}
        {activeSession ? (
          <div className="p-6 space-y-3 border shadow-sm border-green-500/30 bg-green-500/5 rounded-2xl">
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
              </p>
            </div>

            <p className="font-sans text-[13px] text-green-700 dark:text-green-400 font-medium pt-1">
              <Check size={14} /> Geofence is active. Ensure you are in the classroom and scan the QR on screen.
            </p>
          </div>
        ) : (
          <div className="p-6 text-center border shadow-sm border-divider-soft bg-surface-pearl rounded-2xl">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-divider-soft text-ink-muted-80">
              <RefreshCw size={24} />
            </div>
            <h3 className="font-display text-[18px] font-semibold text-ink">No Active Lecture</h3>
            <p className="font-sans text-[14px] text-ink-muted-80 mt-1 max-w-xs mx-auto">
              There is currently no active attendance session for batch {user?.batch}. The scanner will activate when the faculty starts a session.
            </p>
            <button
              onClick={loadData}
              className="button-secondary text-[13px] !py-2 !px-4 mt-4"
            >
              <><RefreshCw size={14} /> Check Again</>
            </button>
          </div>
        )}

        {/* Notifications */}
        {msg && (
          <div className="p-5 text-green-800 border rounded-2xl bg-green-500/15 border-green-500/30 dark:text-green-300">
            <div className="flex items-center gap-2 font-bold text-[16px]">
              <span><Check size={14} /></span> {msg}
            </div>
            {scanSuccess && scanSuccess.distance != null && (
              <p className="font-sans text-[13px] mt-1 opacity-90">
                Verified: You were <strong>{scanSuccess.distance} meters</strong> from the faculty device.
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="p-5 text-red-700 border rounded-2xl bg-red-500/15 border-red-500/30 dark:text-red-400">
              <div className="flex items-center gap-2 font-bold text-[15px]">
                <AlertTriangle size={14} /> Scan Failed
              </div>
            <p className="font-sans text-[14px] mt-1">{error}</p>

            {/* GPS Debug Info */}
            {errorDebug && (
              <div className="pt-4 mt-4 space-y-2 border-t border-red-500/20">
                <p className="font-sans text-[13px] font-semibold"><MapPin size={14} /> GPS Debug Info:</p>
                <div className="bg-red-500/5 rounded-lg p-3 font-mono text-[11px] space-y-1 text-red-900 dark:text-red-200">
                  {errorDebug.studentLat && (
                    <>
                      <div> Your GPS: {errorDebug.studentLat}°N, {errorDebug.studentLng}°E</div>
                      <div> Your GPS accuracy: {errorDebug.studentAccuracy ?? 'N/A'}m</div>
                      <div> Faculty GPS: {errorDebug.facultyLat}°N, {errorDebug.facultyLng}°E</div>
                      <div> Faculty GPS accuracy: {errorDebug.facultyAccuracy ?? 'N/A'}m</div>
                      <div> Distance: {errorDebug.calculatedDistance}m (limit: {errorDebug.effectiveRadius ?? 50}m)</div>
                      <div>Confidence: {errorDebug.score ?? 'N/A'}/100 {errorDebug.score != null && errorDebug.score >= errorDebug.passThreshold ? '(PASS)' : '(LOW)'}</div>
                      {errorDebug.deviceStationary != null && (
                        <div>Device stationary: {errorDebug.deviceStationary ? 'Yes' : 'No'}</div>
                      )}
                      {errorDebug.swappedDistance && (
                        <div className="pt-1 mt-1 border-t border-red-500/20">
                           <RefreshCw size={14} /> If coords swapped: {errorDebug.swappedDistance}m {errorDebug.swappedDistance <= 100 ? <><Check size={14} /> WOULD WORK</> : ''}
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
              <div className="pt-3 mt-3 space-y-2 border-t border-red-500/20">
                <p className="font-sans text-[13px] font-semibold">Try these:</p>
                <ul className="font-sans text-[12px] space-y-1 ml-4">
                  <li><Check size={14} /> Move closer to the faculty device</li>
                  <li><Check size={14} /> Ensure location permissions are enabled</li>
                  <li><Check size={14} /> Verify your device GPS is accurate</li>
                  <li><Check size={14} /> Ask faculty to re-calibrate their GPS location</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Scanner Controller */}
        {!scanning ? (
          <div className="space-y-3">
            <button
              onClick={() => { setScanning(true); setError(''); setMsg(''); setScanSuccess(null); setShowSuccessOverlay(false) }}
              disabled={!activeSession || showSuccessOverlay}
              className="button-primary w-full py-4 text-[16px] font-bold shadow-lg disabled:opacity-50 transition-all duration-300"
            >
              {showSuccessOverlay ? <><Check size={14} /> Attendance Confirmed</> : activeSession ? ' Open Camera & Scan QR Code' : 'Waiting for Class Session to Start'}
            </button>
            {activeSession && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await requestCameraPermission()
                    setError('')
                    setMsg(' Camera access granted — tap "Open Camera" to scan.')
                  } catch (err) {
                    setError(err?.message || 'Camera permission was not granted.')
                  }
                }}
                className="w-full text-[12px] font-semibold text-primary border border-primary/30 hover:bg-primary/5 rounded-xl px-3 py-2 transition-colors"
              >
                 Request Camera Access
              </button>
            )}
            <p className="font-sans text-[12px] text-ink-muted-80 text-center">
              You'll be asked to allow camera &amp; location when you open the scanner.
            </p>
          </div>
        ) : (
          <div className="p-5 space-y-4 border shadow-sm border-divider-soft bg-surface-pearl rounded-2xl">
            {/* Scanner header — Stop / Restart controls live OUTSIDE the camera viewport */}
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 font-sans text-[14px] font-semibold text-ink">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex w-full h-full bg-red-400 rounded-full opacity-75 animate-ping"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                Camera Active
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={restartCamera}
                  className="text-[12px] font-semibold text-ink bg-divider-soft hover:bg-soft-stone rounded-lg px-3 py-2 transition-colors"
                >
                  <><RefreshCw size={14} /> Restart</>
                </button>
                <button
                  onClick={stopScanner}
                  className="text-[12px] font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg px-3 py-2 transition-colors"
                >
                  ■ Stop
                </button>
              </div>
            </div>

            {/* Camera viewport — the library renders ONLY the live video feed here */}
            <div className="relative w-full overflow-hidden bg-black shadow-inner qr-video-viewport rounded-xl aspect-square">
              <div id="qr-reader" ref={scannerRef} style={{ width: '100%', height: '100%' }} />
            </div>

            {/* Active camera selector — OUTSIDE the scanner */}
            {cameraDevices.length > 0 && (
              <div className="flex items-center gap-2 bg-canvas rounded-xl border border-divider-soft px-3 py-2.5">
                <span className="font-sans text-[12px] font-semibold text-ink whitespace-nowrap"><Video size={14} /> Camera</span>
                <select
                  value={currentCameraId || ''}
                  onChange={(e) => setCurrentCameraId(e.target.value)}
                  className="flex-1 input !py-2 !text-[13px] font-medium cursor-pointer"
                >
                  {cameraDevices.map((c, i) => (
                    <option key={c.id} value={c.id}>
                      {c.label || 'Camera ' + (i + 1)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <p className="font-sans text-[12px] text-ink-muted-80 text-center leading-relaxed">
               Point your camera at the revolving QR code displayed on the classroom screen. Live GPS coordinates will be verified automatically.
            </p>
<p className="font-sans text-[11px] text-amber-600 dark:text-amber-400 text-center leading-relaxed">
              If your accuracy stays high (±100m+), enable high-accuracy / Wi-Fi location, hold your phone still, then re-scan.
            </p>

            <div className="p-3 border rounded-lg bg-blue-500/10 border-blue-500/30">
              <p className="font-sans text-[12px] text-blue-700 dark:text-blue-300">
                 <strong>Tip:</strong> Ensure adequate lighting and hold the camera steady for accurate scanning.
              </p>
            </div>
          </div>
        )}

        {/* GPS Refresh & Debug Info */}
        {activeSession && (
          <div className="p-4 space-y-3 border border-divider-soft bg-surface-pearl rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[13px] font-semibold text-ink">Your Live Location</span>
              <button
                onClick={refreshStudentGps}
                className="text-[12px] font-medium text-primary hover:underline"
              >
                 Refresh GPS
              </button>
            </div>
            
            {gpsDebug && (
              <div className="p-3 space-y-1 rounded-lg bg-canvas">
                <p className="font-mono text-[11px] text-ink-muted-80">
                  Lat: {fmtCoord(gpsDebug.latitude)}°
                </p>
                <p className="font-mono text-[11px] text-ink-muted-80">
                  Lng: {fmtCoord(gpsDebug.longitude)}°
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
                  Faculty Lat: {fmtCoord(activeSession.centerLat)}°
                </p>
                <p className="font-mono text-ink-muted-80">
                  Faculty Lng: {fmtCoord(activeSession.centerLng)}°
                </p>
                <p className="font-mono text-ink-muted-80">
                  Faculty GPS accuracy: ±{activeSession.centerAccuracy ?? 'N/A'}m
                </p>
              </div>
            )}
          </div>
        )}

        {/* Info instructions */}
        <div className="p-5 space-y-3 border shadow-sm border-divider-soft bg-surface-pearl rounded-2xl">
          <h4 className="font-display text-[16px] font-bold text-ink">How Smart Attendance Works</h4>
          <ul className="font-sans text-[13px] text-ink-muted-80 space-y-2">
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">1.</span>
              <span><strong>50m GPS Geofence:</strong> Attendance is anchored to the faculty's live device location and uses a confidence score (distance + GPS accuracy + device-stationary) so genuine classroom scans pass reliably.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">2.</span>
              <span><strong>15s Rotating QR:</strong> Screen QR dynamically regenerates every 15 seconds so screenshots cannot be shared in WhatsApp groups.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">3.</span>
              <span><strong>Surprise Checkpoints:</strong> A random checkpoint QR may appear mid-class. Re-scan within 20 seconds to stay marked present.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
