import api from './axios'

// Get all notices — optional ?category=exam&page=1
export const getNotices = (params) =>
  api.get('/notices', { params })

// Get single notice by ID
export const getNotice = (id) =>
  api.get(`/notices/${id}`)

// Faculty-only — list notices authored by the logged-in faculty
export const getFacultyNotices = () =>
  api.get('/notices/faculty/mine')

// Create a notice (admin / CR / faculty)
export const createNotice = (data) =>
  api.post('/notices', data)

// Pin or unpin a notice (admin only)
export const togglePin = (id) =>
  api.patch(`/notices/${id}/pin`)

// Delete a notice
export const deleteNotice = (id) =>
  api.delete(`/notices/${id}`)
