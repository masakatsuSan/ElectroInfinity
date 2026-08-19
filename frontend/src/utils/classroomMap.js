// Convert scan-time GPS into classroom-relative 3D positions (meters).
// The faculty anchor (session.center*) is the origin; x = east (+), z = north (+).
// Positions are NOT clamped — markers sit at each student's real GPS fix.

function hash(seed) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return h
}

// Newest GPS fix per student: initial scan + every checkpoint scan, so the map
// tracks real movement between re-scans instead of pinning everyone to seat 0.
function latestRecord(entry) {
  const candidates = []
  if (entry?.initial) candidates.push(entry.initial)
  if (entry?.checkpoints) {
    for (const key of Object.keys(entry.checkpoints)) {
      const rec = entry.checkpoints[key]
      if (rec) candidates.push(rec)
    }
  }
  if (candidates.length === 0) return null
  candidates.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0))
  return candidates[candidates.length - 1]
}

export function computeClassroomPositions(session, feed = []) {
  const cLat = Number(session?.centerLat)
  const cLng = Number(session?.centerLng)
  const hasAnchor = Number.isFinite(cLat) && Number.isFinite(cLng)

  return feed.map((entry) => {
    const rec = latestRecord(entry)
    const hasGps =
      rec && Number.isFinite(Number(rec.latitude)) && Number.isFinite(Number(rec.longitude))
    const idKey = String(entry?.student?._id || '')
    const seatKey = idKey || `${entry?.student?.rollNumber || ''}-${entry?.student?.name || ''}`

    let x
    let z
    if (hasAnchor && hasGps) {
      const mPerDegLat = 110540
      const mPerDegLng = 111320 * Math.cos((cLat * Math.PI) / 180)
      x = (Number(rec.longitude) - cLng) * mPerDegLng
      z = (Number(rec.latitude) - cLat) * mPerDegLat
    } else {
      // Deterministic placeholder seat for students without a fresh GPS fix
      const angle = ((hash(seatKey) % 6283) / 6283) * Math.PI * 2
      const radius = 30 + ((hash(seatKey + ':r') % 100) / 100) * 22
      x = Math.cos(angle) * radius
      z = Math.sin(angle) * radius
    }

    const dist = Math.hypot(x, z)

    const accuracy = Number(rec?.accuracy)

    return {
      id: entry?.student?._id,
      name: entry?.student?.name || 'Student',
      roll: entry?.student?.rollNumber || '',
      status: entry?.status || (hasGps ? 'present' : 'absent'),
      distance: rec?.distanceInMeters != null ? rec.distanceInMeters : Math.round(dist),
      hasGps,
      accuracy: Number.isFinite(accuracy) ? accuracy : null,
      x: Math.round(x * 10) / 10,
      z: Math.round(z * 10) / 10,
      ts: rec?.timestamp ?? null,
    }
  })
}