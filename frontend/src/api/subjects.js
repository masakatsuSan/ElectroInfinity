import api from './axios'

// ── Subject / Course catalogue ─────────────────────────────────────
// Staff see all (incl. pending); everyone else sees approved-only.
// Pass ?batch=2024-2028 &semester=3 &status=pending
export const getSubjects     = (params) => api.get('/subjects', { params })
export const getSubject      = (id)     => api.get(`/subjects/${id}`)
export const createSubject   = (data)    => api.post('/subjects', data)
export const updateSubject   = (id, data) => api.patch(`/subjects/${id}`, data)
export const approveSubject  = (id)      => api.patch(`/subjects/${id}/approve`)
export const deleteSubject   = (id)      => api.delete(`/subjects/${id}`)