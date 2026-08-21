import api from './axios'

export const getRooms = (params) =>
  api.get('/rooms', { params })

export const getRoom = (id) =>
  api.get(`/rooms/${id}`)

export const createRoom = (data) =>
  api.post('/rooms', data)

export const updateRoom = (id, data) =>
  api.patch(`/rooms/${id}`, data)

export const deleteRoom = (id) =>
  api.delete(`/rooms/${id}`)
