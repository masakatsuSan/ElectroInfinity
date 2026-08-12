import api from './axios'

export const getFaculty = () => api.get('/faculty')
export const createFaculty = (data) => api.post('/faculty', data)
export const updateFaculty = (id, data) => api.put(`/faculty/${id}`, data)
export const deleteFaculty = (id) => api.delete(`/faculty/${id}`)
