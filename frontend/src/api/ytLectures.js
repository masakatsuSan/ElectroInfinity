import api from './axios'

export const getYTLectures = (params) =>
  api.get('/yt-lectures', { params })

export const createYTLecture = (data) =>
  api.post('/yt-lectures', data)

export const updateYTLecture = (id, data) =>
  api.put(`/yt-lectures/${id}`, data)

export const deleteYTLecture = (id) =>
  api.delete(`/yt-lectures/${id}`)
