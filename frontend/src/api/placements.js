import api from './axios'
import { PLACEMENTS } from './placementsEndpoints'

// Public reads (no auth required)
export const getPlacementStats = () => api.get(PLACEMENTS.STATS)
export const getRecruiters = () => api.get(PLACEMENTS.RECRUITERS)
export const getPlacedStudents = (params) => api.get(PLACEMENTS.PLACED_STUDENTS, { params })
export const getAlumni = () => api.get(PLACEMENTS.ALUMNI)
export const getOpenings = (params) => api.get(PLACEMENTS.OPENINGS, { params })

// Legacy keep-alive for the old public page shape (returns flat array, filtered by optional type)
export const getPlacements = (type) => api.get(`/placements${type ? `?type=${type}` : ''}`)

// Admin: Placement Stats
export const adminListStats = (params) => api.get(PLACEMENTS.ADMIN_STATS, { params })
export const adminCreateStat = (data) => api.post(PLACEMENTS.ADMIN_STATS, data)
export const adminUpdateStat = (id, data) => api.put(`${PLACEMENTS.ADMIN_STATS}/${id}`, data)
export const adminDeleteStat = (id) => api.delete(`${PLACEMENTS.ADMIN_STATS}/${id}`)
export const adminReorderStats = (items) => api.put(`${PLACEMENTS.ADMIN_STATS}/reorder`, { items })

// Admin: Recruiters
export const adminListRecruiters = (params) => api.get(PLACEMENTS.ADMIN_RECRUITERS, { params })
export const adminCreateRecruiter = (data) => api.post(PLACEMENTS.ADMIN_RECRUITERS, data)
export const adminUpdateRecruiter = (id, data) => api.put(`${PLACEMENTS.ADMIN_RECRUITERS}/${id}`, data)
export const adminDeleteRecruiter = (id) => api.delete(`${PLACEMENTS.ADMIN_RECRUITERS}/${id}`)
export const adminReorderRecruiters = (items) => api.put(`${PLACEMENTS.ADMIN_RECRUITERS}/reorder`, { items })

// Admin: Placed Students
export const adminListPlacedStudents = (params) => api.get(PLACEMENTS.ADMIN_PLACED_STUDENTS, { params })
export const adminCreatePlacedStudent = (data) => api.post(PLACEMENTS.ADMIN_PLACED_STUDENTS, data)
export const adminUpdatePlacedStudent = (id, data) => api.put(`${PLACEMENTS.ADMIN_PLACED_STUDENTS}/${id}`, data)
export const adminDeletePlacedStudent = (id) => api.delete(`${PLACEMENTS.ADMIN_PLACED_STUDENTS}/${id}`)

// Admin: Alumni Stories
export const adminListAlumniStories = (params) => api.get(PLACEMENTS.ADMIN_ALUMNI, { params })
export const adminCreateAlumniStory = (data) => api.post(PLACEMENTS.ADMIN_ALUMNI, data)
export const adminUpdateAlumniStory = (id, data) => api.put(`${PLACEMENTS.ADMIN_ALUMNI}/${id}`, data)
export const adminDeleteAlumniStory = (id) => api.delete(`${PLACEMENTS.ADMIN_ALUMNI}/${id}`)
export const adminReorderAlumniStories = (items) => api.put(`${PLACEMENTS.ADMIN_ALUMNI}/reorder`, { items })

// Admin: Career Openings
export const adminListOpenings = (params) => api.get(PLACEMENTS.ADMIN_OPENINGS, { params })
export const adminCreateOpening = (data) => api.post(PLACEMENTS.ADMIN_OPENINGS, data)
export const adminUpdateOpening = (id, data) => api.put(`${PLACEMENTS.ADMIN_OPENINGS}/${id}`, data)
export const adminDeleteOpening = (id) => api.delete(`${PLACEMENTS.ADMIN_OPENINGS}/${id}`)

// Generic toggle-publish
export const adminTogglePublish = (section, id) => api.put(`${PLACEMENTS.ADMIN}/${section}/${id}/publish`)
