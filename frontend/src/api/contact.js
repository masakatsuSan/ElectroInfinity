import api from './axios'

// ── Public contact form ────────────────────────────────────────────
export const submitContact = (data)        => api.post('/contact', data)

// ── Admin inbox management ────────────────────────────────────────
// /contact?status=new|read|archived
export const getContacts     = (params)    => api.get('/contact', { params })
export const getContact      = (id)        => api.get(`/contact/${id}`)
export const updateContact   = (id, data)  => api.patch(`/contact/${id}`, data)
export const deleteContact   = (id)        => api.delete(`/contact/${id}`)