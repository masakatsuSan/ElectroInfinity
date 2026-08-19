// Permission & secure-context helpers for camera / geolocation access.

// Both getUserMedia (camera) and geolocation only work inside a "secure
// context": https:// or http://localhost. On plain http:// LAN links the
// browser silently blocks them without ever showing a permission prompt.
export function isSecureContext() {
  return typeof window !== 'undefined' && window.isSecureContext !== false
}

// Returns 'granted' | 'denied' | 'prompt' | 'unsupported'
export async function getPermissionState(name) {
  try {
    if (!navigator?.permissions?.query) return 'unsupported'
    const status = await navigator.permissions.query({ name })
    return status.state
  } catch {
    return 'unsupported'
  }
}

// Directly requests the camera stream so the native permission prompt is
// guaranteed to appear (call this from a tap/click handler). The stream is
// immediately released — the QR scanner opens its own stream afterwards.
export async function requestCameraPermission() {
  if (!navigator?.mediaDevices?.getUserMedia) {
    throw new Error('Camera API is not available in this browser.')
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: 'environment' },
  })
  stream.getTracks().forEach((track) => track.stop())
  return true
}

// Directly requests a one-shot position fix so the native geolocation
// permission prompt is guaranteed to appear.
export function requestLocationPermission() {
  return new Promise((resolve, reject) => {
    if (!navigator?.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      (err) => reject(new Error(err.message || 'Location permission denied.')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  })
}
