import api from './axios'

// Admin: add a single student manually
export const addStudent   = (data)   => api.post('/students/add', data)

// Admin: bulk import students from parsed CSV array
export const bulkImport   = (data)   => api.post('/students/bulk-import', data)

// Admin: get student directory
export const getStudents  = (params) => api.get('/students', { params })

// Admin: get unique batch years for filter
export const getBatches   = ()       => api.get('/students/batches')

// CR: get roster for their batch
export const getBatchStudents = (batch) => api.get(`/students/batch/${batch}`)

// Any authenticated user: get ALL students across all batches
export const getAllStudents = (params = {}) => api.get('/students/all', { params })

// Admin: delete a student
export const deleteStudent = (id)    => api.delete(`/students/${id}`)

// Admin: promote or demote a student to/from CR role
export const updateStudentRole = (id, role) => api.patch(`/students/${id}/role`, { role })

// Student: upload own profile photo
export const uploadPhoto  = (formData) =>
  api.patch('/students/me/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
