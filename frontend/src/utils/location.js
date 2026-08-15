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
