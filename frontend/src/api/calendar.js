import api from './axios'

export const getCalendarEntries = (params) =>
  api.get('/calendar', { params })

export const getCalendarEntry = (id) =>
  api.get(`/calendar/${id}`)

export const createCalendarEntry = (data) =>
  api.post('/calendar', data)

export const updateCalendarEntry = (id, data) =>
  api.patch(`/calendar/${id}`, data)

export const deleteCalendarEntry = (id) =>
  api.delete(`/calendar/${id}`)
