import api from './axios'

export const getAnnouncements = (params) =>
  api.get('/announcements', { params })

export const getAnnouncement = (id) =>
  api.get(`/announcements/${id}`)

export const createAnnouncement = (data) =>
  api.post('/announcements', data)

export const updateAnnouncement = (id, data) =>
  api.patch(`/announcements/${id}`, data)

export const deleteAnnouncement = (id) =>
  api.delete(`/announcements/${id}`)

export const markAnnouncementRead = (id) =>
  api.put(`/announcements/${id}/read`)
