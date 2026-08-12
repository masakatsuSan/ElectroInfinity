import api from './axios'

// Admin: add a single student manually
export const addStudent   = (data)   => api.post('/students/add', data)

// Admin: bulk import students from parsed CSV array
export const bulkImport   = (data)   => api.post('/students/bulk-import', data)

// Faculty/admin: get student directory
export const getStudents  = (params) => api.get('/students', { params })

// Faculty/admin: get unique batch years for filter
export const getBatches   = ()       => api.get('/students/batches')

// CR: get roster for their batch
export const getBatchStudents = (batch) => api.get(`/students/batch/${batch}`)

// Admin: delete a student
export const deleteStudent = (id)    => api.delete(`/students/${id}`)

// Student: upload own profile photo
export const uploadPhoto  = (formData) =>
  api.patch('/students/me/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
