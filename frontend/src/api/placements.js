import api from './axios'

export const getPlacements = (type) => api.get(`/placements${type ? `?type=${type}` : ''}`)
export const createPlacement = (data) => api.post('/placements', data)
export const updatePlacement = (id, data) => api.put(`/placements/${id}`, data)
export const deletePlacement = (id) => api.delete(`/placements/${id}`)
