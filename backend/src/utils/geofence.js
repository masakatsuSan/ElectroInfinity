// Haversine distance in meters between two GPS coordinates
function distanceMeters(lat1, lon1, lat2, lon2) {
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

function isWithinGeofence(lat, lng, targetLat, targetLng, maxRadiusMeters = 100) {
  if (lat == null || lng == null || targetLat == null || targetLng == null) return false
  return distanceMeters(lat, lng, targetLat, targetLng) <= maxRadiusMeters
}

module.exports = { distanceMeters, isWithinGeofence }
