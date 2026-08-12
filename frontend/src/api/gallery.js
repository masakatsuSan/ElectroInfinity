import api from './axios'

export const getGallery = () => api.get('/gallery')
export const createGalleryPhoto = (data) => api.post('/gallery', data)
export const updateGalleryPhoto = (id, data) => api.put(`/gallery/${id}`, data)
export const deleteGalleryPhoto = (id) => api.delete(`/gallery/${id}`)
