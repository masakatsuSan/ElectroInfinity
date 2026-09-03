import api from './axios'

// Step 1 of activation — check roll number exists + not yet activated
export const checkRoll = (rollNumber) =>
  api.get(`/auth/check-roll/${rollNumber}`)

// Step 2 of activation — set password for first time
// { rollNumber, password }
export const activateAccount = (data) =>
  api.post('/auth/activate', data)

// Faculty activation — verify OTP and get activation token
// { email, otp }
export const facultyVerifyOtp = (data) =>
  api.post('/auth/faculty/verify-otp', data)

// Faculty activation — set password for first time using email + activation token
// { email, password, activationToken }
export const activateFaculty = (data) =>
  api.post('/auth/faculty/activate', data)

// Step 1 of faculty activation — check email exists + not yet activated
export const checkFacultyEmail = (email) =>
  api.get(`/auth/check-faculty/${encodeURIComponent(email)}`)

// Login — students: { rollNumber, password } | admin/faculty: { email, password }
export const login = (data) =>
  api.post('/auth/login', data)

// Forgot password Step 1 — send OTP to registered email
// Student: { rollNumber } | Faculty: { email }
export const forgotPassword = (data) =>
  api.post('/auth/forgot-password', data)

// Forgot password Step 2 — verify OTP, get reset token
// Student: { rollNumber, otp } | Faculty: { email, otp }
export const verifyOtp = (data) =>
  api.post('/auth/verify-otp', data)

// Forgot password Step 3 — set new password with reset token
// { resetToken, newPassword }
export const resetPassword = (data) =>
  api.post('/auth/reset-password', data)

// Logged-in user changes own password
// { currentPassword, newPassword }
export const changePassword = (data) =>
  api.post('/auth/change-password', data)

export const getMe    = ()     => api.get('/auth/me')
export const updateMe = (data) => api.patch('/auth/me', data)
