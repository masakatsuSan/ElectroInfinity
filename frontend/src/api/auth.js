import api from './axios'

// Step 1 of activation — check roll number exists + not yet activated
export const checkRoll = (rollNumber) =>
  api.get(`/auth/check-roll/${rollNumber}`)

// Step 2 of activation — set password for first time
// { rollNumber, password }
export const activateAccount = (data) =>
  api.post('/auth/activate', data)

// Login — students: { rollNumber, password } | admin: { email, password }
export const login = (data) =>
  api.post('/auth/login', data)

// Forgot password Step 1 — send OTP to registered Gmail
// { rollNumber }
export const forgotPassword = (data) =>
  api.post('/auth/forgot-password', data)

// Forgot password Step 2 — verify OTP, get reset token
// { rollNumber, otp }
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
