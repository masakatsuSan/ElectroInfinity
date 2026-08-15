import test from 'node:test'
import assert from 'node:assert/strict'

import { getBestLocation, LOCATION_SETTINGS } from './location.js'

function setGeolocationMock(mock) {
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { geolocation: mock },
  })
}

test('keeps the most accurate reading and rejects weak GPS signals', async () => {
  const reads = [
    { coords: { latitude: 12.1, longitude: 77.1, accuracy: 80 } },
    { coords: { latitude: 12.1002, longitude: 77.1002, accuracy: 24 } },
  ]

  setGeolocationMock({
    getCurrentPosition(success, error) {
      const next = reads.shift()
      if (next) {
        success(next)
      } else {
        error(new Error('timeout'))
      }
    },
  })

  const loc = await getBestLocation({ maxAccuracyMeters: 50, timeoutMs: 100, attempts: 3 })
  assert.equal(loc.accuracy, 24)
})

test('rejects readings worse than the allowed accuracy threshold', async () => {
  setGeolocationMock({
    getCurrentPosition(success) {
      success({ coords: { latitude: 12.1, longitude: 77.1, accuracy: 75 } })
    },
  })

  await assert.rejects(
    () => getBestLocation({ maxAccuracyMeters: 50, timeoutMs: 100, attempts: 2 }),
    /GPS accuracy/i
  )
})

test('accepts classroom GPS readings up to 120m accuracy', async () => {
  setGeolocationMock({
    getCurrentPosition(success) {
      success({ coords: { latitude: 12.1, longitude: 77.1, accuracy: 119 } })
    },
  })

  const loc = await getBestLocation({
    maxAccuracyMeters: 120,
    timeoutMs: 100,
    attempts: 2,
  })

  assert.equal(loc.accuracy, 119)
})

// A small sanity check for the default options.
test('default location settings prefer high accuracy and no cache reuse', () => {
  assert.equal(LOCATION_SETTINGS.enableHighAccuracy, true)
  assert.equal(LOCATION_SETTINGS.maximumAge, 0)
  assert.equal(LOCATION_SETTINGS.timeout, 12000)
})
