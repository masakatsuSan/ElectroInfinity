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

// Upload a new resource — sends as FormData (has a file attached)
export const uploadResource = (formData) =>
  api.post('/resources', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

// Update a resource — sends as FormData (optionally with a new file)
export const updateResource = (id, formData) =>
  api.put(`/resources/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

// Delete a resource
export const deleteResource = (id) =>
  api.delete(`/resources/${id}`)
