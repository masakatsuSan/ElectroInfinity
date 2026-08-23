export const LOCATION_SETTINGS = {
  enableHighAccuracy: true,
  timeout: 12000,
  maximumAge: 0,
}

// Classroom-safe GPS accuracy threshold (indoor environment)
const DEFAULT_MAX_ACCURACY_METERS = 120

// Distance from the faculty anchor within which a reading counts as "inside
// the classroom" for ranking/early-exit purposes. Matches the backend's real
// effective radius (50m base + accuracy slack, capped ~190m) far better than
// the old 200m+ values, so we don't hand the backend a fix it must reject.
const ANCHOR_INSIDE_METERS = 120

// GPS accuracy early-exit: indoor phones rarely report <30m, which made every
// scan burn its entire sampling budget. 50m inside the anchor radius is ample.
const EARLY_EXIT_ACCURACY_METERS = 50

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

      // Missing accuracy is stored as null (never a fake 999) so the UI shows
      // "—" and the backend treats it as unknown instead of inflating slack.
      const meterAccuracy = Number.isFinite(accuracy) ? Math.round(accuracy) : null
      const reading = {
        latitude,
        longitude,
        accuracy: meterAccuracy,
        targetDistance: preferTarget
          ? distanceMeters(latitude, longitude, targetLat, targetLng)
          : Infinity,
        ts: Date.now(),
      }
      readings.push(reading)

      // Early exit: an accurate fix already close to the anchor is good enough.
      // (50m accuracy / 120m from anchor — reachable indoors, was 30m/200m.)
      if (
        meterAccuracy != null &&
        meterAccuracy < EARLY_EXIT_ACCURACY_METERS &&
        (!preferTarget || reading.targetDistance <= ANCHOR_INSIDE_METERS)
      ) {
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
function rankReading(r, maxAccuracyMeters) {
  // Missing accuracy must not poison the sort (NaN) — treat it as worst-case.
  const acc = Number.isFinite(r.accuracy) ? r.accuracy : 999
  const inside = r.targetDistance != null && r.targetDistance <= maxAccuracyMeters
  return inside ? r.targetDistance * 0.35 + acc : 100000 + acc
}

function selectBest(readings, maxAccuracyMeters = DEFAULT_MAX_ACCURACY_METERS) {
  if (!readings || readings.length === 0) return null
  const ranked = readings.map((r) => ({ r, rank: rankReading(r, maxAccuracyMeters) }))
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

// ── Continuous stationary monitor ────────────────────────────────────────────
// Starts at scanner open and keeps a rolling window of accelerometer samples,
// so "is the device still?" can be answered instantly at scan time instead of
// adding a fixed 900ms wait after the QR decode.
export function createStationaryMonitor({ windowMs = STATIONARY_WINDOW_MS } = {}) {
  const samples = []
  let handler = null
  const Motion = typeof window !== 'undefined' ? window.DeviceMotionEvent : null
  // iOS requires an explicit permission prompt — skip it and report unknown
  // rather than interrupting the student mid-scan (same policy as getStationary).
  const supported = Boolean(Motion) && typeof Motion.requestPermission !== 'function'

  return {
    start() {
      if (!supported || handler) return
      handler = (e) => {
        const a = e.accelerationIncludingGravity
        if (!a) return
        const now = performance.now()
        samples.push({ t: now, x: a.x || 0, y: a.y || 0, z: a.z || 0 })
        while (samples.length && now - samples[0].t > windowMs) samples.shift()
      }
      window.addEventListener('devicemotion', handler)
    },
    // true/false when motion data exists, null when unavailable (unknown).
    snapshot() {
      if (!supported) return null
      return computeStationary(samples)
    },
    stop() {
      if (handler) {
        window.removeEventListener('devicemotion', handler)
        handler = null
      }
      samples.length = 0
    },
  }
}

// ── Warm GPS engine for the student scanner ──────────────────────────────────
// Starts a watchPosition session the moment the camera opens and keeps the
// best fresh fix in memory. By the time a QR code is decoded there is usually
// a usable fix ready, so verification POSTs immediately instead of waiting
// 4-11 seconds for a cold GPS lock.
export function createWarmLocation({
  targetLat = null,
  targetLng = null,
  maxAccuracyMeters = DEFAULT_MAX_ACCURACY_METERS,
  freshnessMs = 8000,
} = {}) {
  const preferTarget = Number.isFinite(targetLat) && Number.isFinite(targetLng)
  const readings = []
  let watchId = null
  let stopped = false
  let permissionDenied = false

  const handlePosition = (pos) => {
    if (stopped) return
    const { latitude, longitude, accuracy } = pos.coords
    if (!isValidCoordinate(latitude, longitude)) return
    readings.push({
      latitude,
      longitude,
      accuracy: Number.isFinite(accuracy) ? Math.round(accuracy) : null,
      targetDistance: preferTarget
        ? distanceMeters(latitude, longitude, targetLat, targetLng)
        : Infinity,
      ts: Date.now(),
    })
    // Keep memory bounded — a scanner session never needs more than this.
    if (readings.length > 30) readings.shift()
  }

  const handleError = (err) => {
    if (err && (err.code === 1 || err.code === 'PERMISSION_DENIED')) {
      permissionDenied = true
    }
    // Transient errors: keep the watch running, samples will come.
  }

  const bestWithin = (sinceMs = 0) => {
    const now = Date.now()
    const fresh = readings.filter((r) => now - r.ts <= freshnessMs && r.ts >= sinceMs)
    return fresh.length ? selectBest(fresh, maxAccuracyMeters) : null
  }

  const waitFor = ({ sinceMs, timeoutMs, denyMessage, timeoutMessage }) =>
    new Promise((resolve, reject) => {
      const started = Date.now()
      const iv = setInterval(() => {
        if (permissionDenied) {
          clearInterval(iv)
          reject(new Error(denyMessage))
          return
        }
        const got = bestWithin(sinceMs)
        if (got) {
          clearInterval(iv)
          resolve(got)
          return
        }
        if (Date.now() - started >= timeoutMs) {
          clearInterval(iv)
          reject(new Error(timeoutMessage))
        }
      }, 100)
    })

  const api = {
    // Begin watching. Safe to call once per scanner session.
    start() {
      if (stopped || watchId != null) return
      if (!navigator?.geolocation) return
      try {
        watchId = navigator.geolocation.watchPosition(handlePosition, handleError, {
          ...LOCATION_SETTINGS,
          enableHighAccuracy: true,
          maximumAge: 0,
        })
      } catch {
        watchId = null
      }
    },

    // Best fresh fix right now (or null).
    snapshot() {
      return bestWithin(0)
    },

    // Resolve instantly with the warm fix; briefly wait for one only if none.
    async getFix({ timeoutMs = 2500 } = {}) {
      const warm = bestWithin(0)
      if (warm) return warm
      if (!navigator?.geolocation) {
        throw new Error('Geolocation is not supported by your browser.')
      }
      return waitFor({
        sinceMs: 0,
        timeoutMs,
        denyMessage: 'Location permission was denied. Allow location in your browser settings and re-scan.',
        timeoutMessage: 'No GPS signal. Please turn on Location, move near a window, and re-scan.',
      })
    },

    // Only accept readings newer than this call — used on retries, where the
    // previous (already-rejected) fix must not be reused.
    async getFreshFix({ timeoutMs = 3500 } = {}) {
      if (!navigator?.geolocation) {
        throw new Error('Geolocation is not supported by your browser.')
      }
      return waitFor({
        sinceMs: Date.now(),
        timeoutMs,
        denyMessage: 'Location permission was denied. Allow location in your browser settings and re-scan.',
        timeoutMessage: 'GPS is taking too long. Move near a window and re-scan.',
      })
    },

    stop() {
      stopped = true
      if (watchId != null) {
        try { navigator.geolocation.clearWatch(watchId) } catch {}
        watchId = null
      }
    },
  }

  return api
}
