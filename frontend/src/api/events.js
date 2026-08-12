import api from './axios'

export const getEvents = ()       => api.get('/events')
export const getEvent  = (id)     => api.get(`/events/${id}`)

// Create event with optional banner image — sends as FormData
export const createEvent = (formData) =>
  api.post('/events', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const updateEvent = (id, data) => api.patch(`/events/${id}`, data)
export const deleteEvent = (id)       => api.delete(`/events/${id}`)
