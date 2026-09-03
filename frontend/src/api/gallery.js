import api from './axios'

export const getGallery = (params = {}) =>
  api.get('/gallery', { params })

export const getGalleryTeasers = () =>
  api.get('/gallery', { params: { teasers: 'true' } })

export const createGalleryPhoto = (data) =>
  api.post('/gallery', data)

export const updateGalleryPhoto = (id, data) =>
  api.put(`/gallery/${id}`, data)

export const patchGalleryPhoto = (id, data) =>
  api.patch(`/gallery/${id}`, data)

export const deleteGalleryPhoto = (id) =>
  api.delete(`/gallery/${id}`)
