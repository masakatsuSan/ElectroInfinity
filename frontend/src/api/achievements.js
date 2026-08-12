import api from './axios'

export const getAchievements = () => api.get('/achievements')
export const createAchievement = (data) => api.post('/achievements', data)
export const updateAchievement = (id, data) => api.put(`/achievements/${id}`, data)
export const deleteAchievement = (id) => api.delete(`/achievements/${id}`)
