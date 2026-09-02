import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BackButton from '../components/BackButton'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, X, Check, AlertTriangle } from 'lucide-react'

export default function ScanQR() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const scannerRef = useRef(null)
  const scannerInstance = useRef(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)
  const [cameraDevices, setCameraDevices] = useState([])
  const [currentCameraId, setCurrentCameraId] = useState(null)
  const [scannerEpoch, setScannerEpoch] = useState(0)

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [])

  const stopScanner = useCallback(() => {
    if (scannerInstance.current) {
      try {
        scannerInstance.current.stop().catch(() => {})
      } catch {}
      scannerInstance.current = null
    }
    setScanning(false)
  }, [])

  const startScanner = useCallback(async (cameraId) => {
    setError('')
    setSuccess(null)
    setScanning(true)

    try {
      if (!scannerInstance.current) {
        scannerInstance.current = new Html5Qrcode(scannerRef.current?.id)
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      }

      await scannerInstance.current.start(
        cameraId || { facingMode: 'environment' },
        config,
        (decodedText) => {
          handleScanSuccess(decodedText)
        },
        () => {}
      )
    } catch (err) {
      console.error(err)
      setError('Unable to access camera. Please grant camera permission and try again.')
      setScanning(false)
    }
  }, [])

  const handleScanSuccess = (decodedText) => {
    setSuccess(decodedText)
    stopScanner()

    // Check if it's a profile URL
    try {
      const url = new URL(decodedText)
      const pathParts = url.pathname.split('/').filter(Boolean)
      if (pathParts[0] === 'profile' && pathParts[1]) {
        setTimeout(() => {
          navigate(`/profile/${pathParts[1]}`)
        }, 1500)
      }
    } catch {
      // Not a valid URL - just show the text
    }
  }

  const handleStartScan = async () => {
    try {
      const devices = await Html5Qrcode.getCameras()
      if (devices && devices.length) {
        setCameraDevices(devices)
        const defaultCamera = devices.find((d) => d.kind === 'environment')?.id || devices[0]?.id
        setCurrentCameraId(defaultCamera)
        startScanner(defaultCamera)
      }
    } catch (err) {
      setError('No camera found. Please ensure your device has a camera.')
    }
  }

  const switchCamera = (cameraId) => {
    stopScanner()
    setCurrentCameraId(cameraId)
    startScanner(cameraId)
  }

  return (
    <div className="min-h-screen bg-canvas pt-28 pb-20">
      <div className="max-w-[1280px] mx-auto px-4 md:px-12">
        <div className="max-w-3xl mb-10">
          <span className="font-mono text-[12px] uppercase tracking-wider text-coral font-semibold block mb-2">
            Discover & Connect
          </span>
          <h1 className="font-display text-[40px] md:text-[56px] font-normal tracking-tight text-ink mb-4">
            Scan QR Code
          </h1>
          <p className="font-sans text-[17px] text-body-muted leading-relaxed">
            Point your camera at a friend's profile QR code to instantly open their profile and connect.
          </p>
        </div>

        <div className="max-w-lg mx-auto">
          <div className="border border-divider-soft bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Scanner Area */}
            <div className="relative bg-black aspect-[4/3] flex items-center justify-center">
              {!scanning && !success && (
                <div className="text-center p-8">
                  <Camera size={48} className="text-white/40 mx-auto mb-4" />
                  <p className="text-white/60 text-[14px] font-sans mb-6">
                    Tap the button below to start scanning QR codes from your camera.
                  </p>
                  <button
                    onClick={handleStartScan}
                    className="inline-flex items-center gap-2 bg-ink text-canvas px-6 py-3 rounded-full text-[14px] font-semibold hover:bg-ink/90 transition-colors shadow-sm"
                  >
                    <Camera size={18} />
                    Start Scanning
                  </button>
                </div>
              )}

              {scanning && (
                <div className="w-full h-full relative">
                  <div id="qr-scanner" ref={scannerRef} className="w-full h-full" />
                  <button
                    onClick={stopScanner}
                    className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full p-2.5 backdrop-blur-sm transition-colors z-10"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}

              {success && (
                <div className="text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                    <Check size={32} className="text-green-400" />
                  </div>
                  <p className="text-white font-display text-[18px] font-bold mb-2">QR Code Scanned!</p>
                  <p className="text-white/60 text-[13px] font-mono break-all px-4">
                    {success}
                  </p>
                  <p className="text-white/40 text-[12px] mt-4">Navigating to profile…</p>
                </div>
              )}
            </div>

            {/* Camera Selector */}
            {cameraDevices.length > 1 && scanning && (
              <div className="p-4 border-t border-divider-soft bg-white">
                <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted-48 mb-2">
                  Switch Camera
                </label>
                <select
                  value={currentCameraId || ''}
                  onChange={(e) => switchCamera(e.target.value)}
                  className="w-full bg-canvas border border-divider-soft rounded-xl px-4 py-2.5 text-[14px] font-sans text-ink focus:outline-none focus:border-primary/40 transition-colors"
                >
                  {cameraDevices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.label || `Camera ${device.id.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="p-6 border-t border-divider-soft">
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                  <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-sans text-[14px] font-semibold text-red-800 mb-1">Camera Error</p>
                    <p className="font-sans text-[13px] text-red-600">{error}</p>
                  </div>
                </div>
                <button
                  onClick={handleStartScan}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-ink text-canvas px-6 py-3 rounded-full text-[14px] font-semibold hover:bg-ink/90 transition-colors shadow-sm"
                >
                  <Camera size={18} />
                  Try Again
                </button>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 p-6 bg-white border border-divider-soft rounded-2xl shadow-sm">
            <h3 className="font-display text-[16px] font-bold text-ink mb-3">How to use</h3>
            <ol className="space-y-2 text-[14px] text-ink-muted-80 font-sans">
              <li className="flex gap-2">
                <span className="font-mono font-bold text-primary">1.</span>
                Ask a friend to share their profile QR code.
              </li>
              <li className="flex gap-2">
                <span className="font-mono font-bold text-primary">2.</span>
                Tap <strong>Start Scanning</strong> and allow camera access.
              </li>
              <li className="flex gap-2">
                <span className="font-mono font-bold text-primary">3.</span>
                Point your camera at the QR code.
              </li>
              <li className="flex gap-2">
                <span className="font-mono font-bold text-primary">4.</span>
                Their profile will open automatically. Tap Follow to connect!
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
