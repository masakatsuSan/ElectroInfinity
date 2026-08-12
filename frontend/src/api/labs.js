import api from './axios'

export const getLabs = () => api.get('/labs')
export const createLab = (data) => api.post('/labs', data)
export const updateLab = (id, data) => api.put(`/labs/${id}`, data)
export const deleteLab = (id) => api.delete(`/labs/${id}`)
