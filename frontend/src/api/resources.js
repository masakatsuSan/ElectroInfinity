import api from './axios'

// Get all resources — optional ?type=notes&semester=5
export const getResources = (params) =>
  api.get('/resources', { params })

// Fetch a resource preview as a blob URL via the axios instance (handles auth + base URL)
export const fetchPreviewBlobUrl = async (id) => {
  const response = await api.get(`/resources/${id}/preview`, {
    responseType: 'blob',
  })
  return URL.createObjectURL(response.data)
}

// Build the in-app preview URL for a resource (used by the PDF viewer)
export const getPreviewUrl = (id) =>
  `${import.meta.env.VITE_API_URL || '/api'}/resources/${id}/preview`

// Download a resource (increments count, streams as attachment)
export const downloadResource = (id) =>
  `${import.meta.env.VITE_API_URL || '/api'}/resources/${id}/download`

// Increment download count without redirecting (for Google Drive direct downloads)
export const incrementDownloadCount = (id) =>
  api.post(`/resources/${id}/download/increment`)

// Check if a URL is a Google Drive link
export const isGoogleDriveUrl = (url) => {
  if (!url) return false
  return /^https?:\/\/(?:drive\.google\.com|drive\.userdata\.googleusercontent\.com|drive\.googleusercontent\.com)/i.test(url)
}

// Extract Google Drive file ID from various URL formats
export const extractGoogleDriveFileId = (url) => {
  if (!url) return null
  const idMatch = url.match(/[?&]id=([^&]+)/)
  if (idMatch) return idMatch[1]
  const dMatch = url.match(/\/d\/([^/]+)/)
  if (dMatch) return dMatch[1]
  return null
}

// Get direct Google Drive download URL
export const getGoogleDriveDownloadUrl = (url) => {
  const fileId = extractGoogleDriveFileId(url)
  if (!fileId) return null
  return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`
}

// Upload a new resource — sends as FormData (has a file attached)
// NOTE: do NOT set Content-Type manually — the browser/axios must set
// multipart/form-data WITH the boundary, otherwise multer can't parse it
// and every upload fails.
export const uploadResource = (formData) =>
  api.post('/resources', formData)

// Update a resource — sends as FormData (optionally with a new file)
export const updateResource = (id, formData) =>
  api.put(`/resources/${id}`, formData)

// Delete a resource
export const deleteResource = (id) =>
  api.delete(`/resources/${id}`)
