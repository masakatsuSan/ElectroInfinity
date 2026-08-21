import api from './axios'

export const getProjects = (params) =>
  api.get('/projects', { params })

export const getProject = (id) =>
  api.get(`/projects/${id}`)

export const createProject = (data) =>
  api.post('/projects', data)

export const updateProject = (id, data) =>
  api.patch(`/projects/${id}`, data)

export const deleteProject = (id) =>
  api.delete(`/projects/${id}`)

export const likeProject = (id) =>
  api.post(`/projects/${id}/like`)
