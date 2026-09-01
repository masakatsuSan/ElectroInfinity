import api from './axios'

export const getNotifications = (params = {}) =>
  api.get('/notifications', { params })

export const getUnreadCount = () =>
  api.get('/notifications/unread-count')

export const markNotificationRead = (id) =>
  api.put(`/notifications/${id}/read`)

export const markAllNotificationsRead = () =>
  api.put('/notifications/mark-all-read')

export const deleteNotification = (id) =>
  api.delete(`/notifications/${id}`)
