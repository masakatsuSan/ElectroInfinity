import api from './axios'

// Get all resources — optional ?type=notes&semester=5
export const getResources = (params) =>
  api.get('/resources', { params })

// Download a resource (increments count, redirects to file)
export const getDownloadUrl = (id) =>
  `${import.meta.env.VITE_API_URL || ''}/api/resources/${id}/download`

// Upload a new resource — sends as FormData (has a file attached)
export const uploadResource = (formData) =>
  api.post('/resources', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

// Delete a resource
export const deleteResource = (id) =>
  api.delete(`/resources/${id}`)
