import api from './axios'

// Get deadlines (optionally filtered by batch)
export const getDeadlines = (params) => api.get('/deadlines', { params })

// Create a new deadline (CR only)
export const createDeadline = (data) => api.post('/deadlines', data)

// Delete a deadline (CR/Admin only)
export const deleteDeadline = (id) => api.delete(`/deadlines/${id}`)

// Toggle submission status for student
export const submitDeadline = (id) => api.put(`/deadlines/${id}/submit`)
