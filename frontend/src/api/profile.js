import api from './axios'

export const getPublicProfile = (id) =>
  api.get(`/profile/${id}`)

export const updateMyProfile = (data) =>
  api.patch('/profile/me', data)

export const uploadCoverPhoto = (formData) =>
  api.post('/profile/me/cover', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const uploadProfilePhoto = (formData) =>
  api.post('/profile/me/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const getProfileCompleteness = () =>
  api.get('/profile/me/completeness')

export const searchUsers = (query, filters = {}) => {
  const params = { q: query, ...filters }
  return api.get('/profile/search', { params })
}

export const getProfileQr = (userId) =>
  api.get(`/profile/${userId}/qr`)

export const getBadges = () =>
  api.get('/profile/badges')

export const createBadge = (data) =>
  api.post('/profile/badges', data)

export const awardBadge = (userId, badgeId) =>
  api.post(`/profile/${userId}/badges`, { badgeId })

export const getCollegeNetwork = (query = '') => {
  const params = query ? { q: query } : undefined
  return api.get('/network/college', { params })
}

export const getProfileViews = () =>
  api.get('/profile/me/views')

export const recordProfileView = (userId) =>
  api.post(`/profile/${userId}/view`)

export const setStatus = (text) =>
  api.post('/profile/me/status', { text })

export const clearStatus = () =>
  api.delete('/profile/me/status')

export const createHighlight = (data) =>
  api.post('/profile/me/highlight', data)

export const deleteHighlight = (id) =>
  api.delete(`/profile/me/highlight/${id}`)

export const setFeaturedProject = (projectId) =>
  api.patch('/profile/me/featured', { projectId })

export const getTrendingUsers = () =>
  api.get('/profile/trending')

export const getSuggestedUsers = () =>
  api.get('/profile/suggested')

export const getMyUploads = () =>
  api.get('/profile/me/uploads')

export const sendFriendRequest = (recipientId) =>
  api.post('/friends/request', { recipientId })

export const acceptFriendRequest = (senderId) =>
  api.post(`/friends/${senderId}/accept`)

export const rejectFriendRequest = (senderId) =>
  api.post(`/friends/${senderId}/reject`)

export const removeFriend = (userId) =>
  api.delete(`/friends/${userId}/remove`)

export const getFriendList = (userId) =>
  api.get(`/friends/${userId}/list`)

export const getFriendRequests = (status = 'pending') =>
  api.get(`/friends/requests?status=${status}`)

export const getLikedPosts = (userId) =>
  api.get(`/profile/${userId}/likes`)
