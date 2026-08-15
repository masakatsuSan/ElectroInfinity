import api from './axios'

// ── Rooms (Legacy/Optional) ──
export const getRooms = () => api.get('/attendance/rooms')
export const createRoom = (data) => api.post('/attendance/rooms', data)
export const deleteRoom = (id) => api.delete(`/attendance/rooms/${id}`)

// ── Faculty Management (Admin) ──
export const getAdminFaculty = () => api.get('/attendance/admin/faculty')
export const createAdminFaculty = (data) => api.post('/attendance/admin/faculty', data)
export const updateAdminFaculty = (id, data) => api.put(`/attendance/admin/faculty/${id}`, data)
export const toggleFacultyActive = (id) => api.patch(`/attendance/admin/faculty/${id}/toggle-active`)
export const deleteAdminFaculty = (id) => api.delete(`/attendance/admin/faculty/${id}`)

// Backward compatibility alias
export const getFacultyAccounts = getAdminFaculty
export const createFacultyAccount = createAdminFaculty

// ── Subjects ──
export const getSubjects = (params) => api.get('/subjects', { params })
export const createSubject = (data) => api.post('/subjects', data)
export const deleteSubject = (id) => api.delete(`/subjects/${id}`)

// ── Sessions & Live Attendance (Faculty) ──
export const getSessions = () => api.get('/attendance/sessions')
export const getActiveSession = () => api.get('/attendance/sessions/active')
export const getActiveBatchSession = () => api.get('/attendance/sessions/active/batch')
export const startSession = (data) => api.post('/attendance/sessions/start', data)
export const endSession = (id) => api.post(`/attendance/sessions/${id}/end`)
export const triggerCheckpoint = (id) => api.post(`/attendance/sessions/${id}/trigger-checkpoint`)
export const getSessionFeed = (id) => api.get(`/attendance/sessions/${id}/feed`)
export const getMyClasses = () => api.get('/attendance/faculty/my-classes')
export const getSessionRoster = (id) => api.get(`/attendance/sessions/${id}/roster`)

// ── Attendance Record Management ──
export const deleteAttendanceRecord = (recordId) => api.delete(`/attendance/records/${recordId}`)

// ── Scanning & Attendance History (Student) ──
export const scanQr = (data) => api.post('/attendance/scan', data)
export const getMyStats = () => api.get('/attendance/stats/me')
export const getStudentHistory = () => api.get('/attendance/student/history')
export const getBatchStats = (batch) => api.get(`/attendance/stats/batch/${batch}`)
