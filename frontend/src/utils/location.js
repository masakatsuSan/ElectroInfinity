export const LOCATION_SETTINGS = {
  enableHighAccuracy: true,
  timeout: 12000,
  maximumAge: 0,
}

// Classroom-safe GPS accuracy threshold (indoor environment)
const DEFAULT_MAX_ACCURACY_METERS = 120

function isValidCoordinate(latitude, longitude) {
  return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
}

export async function getBestLocation({
  maxAccuracyMeters = DEFAULT_MAX_ACCURACY_METERS,
  timeoutMs = LOCATION_SETTINGS.timeout,
  attempts = 3,
} = {}) {
  if (!navigator?.geolocation) {
    throw new Error('Geolocation is not supported by your browser.')
  }

  const options = {
    ...LOCATION_SETTINGS,
    timeout: timeoutMs,
  }

  let bestReading = null

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options)
      })

      const { latitude, longitude, accuracy } = position.coords
      if (!isValidCoordinate(latitude, longitude)) {
        if (attempt < attempts) continue
        throw new Error('Invalid GPS coordinates received. Please try again.')
      }

      const roundedAccuracy = Number.isFinite(accuracy) ? Math.round(accuracy) : 0
      const reading = {
        latitude,
        longitude,
        accuracy: roundedAccuracy,
      }

      if (!bestReading || reading.accuracy < bestReading.accuracy) {
        bestReading = reading
      }

      if (bestReading.accuracy <= maxAccuracyMeters) {
        return bestReading
      }
    } catch (error) {
      if (attempt < attempts) {
        continue
      }
      throw new Error(error.message || 'Unable to get a stable GPS reading.')
    }
  }

  if (bestReading) {
    throw new Error(
      `GPS accuracy is too poor (${bestReading.accuracy}m). Try moving closer to a window or recalibrating. Ideal: ≤120m accuracy.`,
    )
  }

  throw new Error('Unable to get a stable GPS reading. Please try again.')
}

export function distanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity
  const R = 6371000 // Earth's radius in meters
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

// Fast, geofence-aware poll for the student scan. Instead of one flaky
// single-shot reading, sample the GPS stream for a short budget and return
// the most credible fix: prefer a reading close to the faculty anchor, then
// the lowest reported error. This stops a 10m-away student from being
// rejected because one bad sample drifted far away.
export function getAnchoredLocation({
  maxAccuracyMeters = DEFAULT_MAX_ACCURACY_METERS,
  timeoutMs = 6000,
  noSignalTimeoutMs = 3000,
  targetLat = null,
  targetLng = null,
} = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator?.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'))
      return
    }

    const preferTarget = Number.isFinite(targetLat) && Number.isFinite(targetLng)
    const readings = []
    let watchId = null
    let timer = null
    let noSignalTimer = null
    let settled = false

    const cleanup = () => {
      settled = true
      if (watchId != null) navigator.geolocation.clearWatch(watchId)
      if (timer) clearTimeout(timer)
      if (noSignalTimer) clearTimeout(noSignalTimer)
    }

    const finish = (reading) => {
      if (settled) return
      cleanup()
      resolve(reading)
    }

    const fail = (message) => {
      if (settled) return
      cleanup()
      reject(new Error(message))
    }

    const onPosition = (pos) => {
      const { latitude, longitude, accuracy } = pos.coords
      if (!isValidCoordinate(latitude, longitude)) return

      const meterAccuracy = Number.isFinite(accuracy) ? Math.round(accuracy) : 999
      const reading = {
        latitude,
        longitude,
        accuracy: meterAccuracy,
        targetDistance: preferTarget
          ? distanceMeters(latitude, longitude, targetLat, targetLng)
          : Infinity,
      }
      readings.push(reading)

      // Early exit: an accurate fix already close to the anchor is good enough.
      if (meterAccuracy < 30 && (!preferTarget || reading.targetDistance <= maxAccuracyMeters)) {
        finish(selectBest(readings))
        return
      }
      // Co-location: the phone is already basically on top of the faculty
      // device — stop waiting for the accuracy meter to settle.
      if (preferTarget && reading.targetDistance <= 15 && readings.length >= 2) {
        finish(selectBest(readings))
      }
    }

    const onError = (err) => {
      // Permission denied → fail fast with a clear message instead of waiting.
      if (err && (err.code === 1 || err.code === 'PERMISSION_DENIED')) {
        fail('Location permission was denied. Allow location in your browser settings and re-scan.')
        return
      }
      // Other transient errors: keep sampling until the budget ends.
    }

    try {
      watchId = navigator.geolocation.watchPosition(onPosition, onError, {
        ...LOCATION_SETTINGS,
        enableHighAccuracy: true,
        maximumAge: 0,
      })
    } catch (err) {
      fail(err?.message || 'Location services are unavailable. Check that Location is enabled and re-scan.')
      return
    }

    // If the device produces no fix at all, don't make the student wait the
    // whole budget — fail fast so they can turn on Location / move to a window.
    noSignalTimer = setTimeout(() => {
      if (settled || readings.length > 0) return
      cleanup()
      reject(new Error('No GPS signal. Please turn on Location, move near a window, and re-scan.'))
    }, noSignalTimeoutMs)

    timer = setTimeout(() => {
      if (settled) return
      cleanup()
      if (readings.length === 0) {
        reject(new Error('No GPS signal. Please turn on Location, move near a window, and re-scan.'))
        return
      }
      resolve(selectBest(readings))
    }, timeoutMs)
  })
}

// Strongly prefer a reading inside the geofence (near the anchor), then the
// most accurate fix. Inside the geofence, closeness to the anchor outweighs a
// slightly better accuracy number, so "standing next to faculty" wins over a
// random high-confidence fix far away.
function selectBest(readings, maxAccuracyMeters = DEFAULT_MAX_ACCURACY_METERS) {
  const ranked = readings.map((r) => {
    const inside = r.targetDistance != null && r.targetDistance <= maxAccuracyMeters
    return { r, rank: inside ? r.targetDistance * 0.35 + r.accuracy : 100000 + r.accuracy }
  })
  ranked.sort((a, b) => a.rank - b.rank)
  return ranked[0].r
}

// Device-motion (stationary) signal.
// true  -> device is essentially still (low motion variance)
// false -> sustained movement detected
// null  -> accelerometer unavailable / permission not granted (unknown)
const STATIONARY_VARIANCE_THRESHOLD = 1.0
const STATIONARY_WINDOW_MS = 900

export function getStationary() {
  return new Promise((resolve) => {
    const Motion = typeof window !== 'undefined' ? window.DeviceMotionEvent : null
    // iOS needs an explicit user-granted prompt that would slow the scan.
    // Skip it and treat the signal as unknown rather than blocking the student.
    if (!Motion || typeof Motion.requestPermission === 'function') {
      resolve(null)
      return
    }

    const samples = []
    const deadline = performance.now() + STATIONARY_WINDOW_MS

    const handler = (e) => {
      const a = e.accelerationIncludingGravity
      if (!a || performance.now() > deadline) return
      samples.push({ x: a.x || 0, y: a.y || 0, z: a.z || 0 })
    }

    window.addEventListener('devicemotion', handler)
    setTimeout(() => {
      window.removeEventListener('devicemotion', handler)
      resolve(computeStationary(samples))
    }, STATIONARY_WINDOW_MS)
  })
}

function computeStationary(samples) {
  if (samples.length < 6) return null
  const magnitudes = samples.map((s) => Math.sqrt(s.x * s.x + s.y * s.y + s.z * s.z))
  const mean = magnitudes.reduce((a, v) => a + v, 0) / magnitudes.length || 1
  const variance =
    magnitudes.reduce((a, v) => a + (v - mean) * (v - mean), 0) / magnitudes.length
  return variance < STATIONARY_VARIANCE_THRESHOLD
}
