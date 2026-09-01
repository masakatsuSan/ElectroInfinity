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

export const toggleFollow = (userId) =>
  api.post(`/profile/${userId}/follow`)

export const getFollowers = (userId) =>
  api.get(`/profile/${userId}/followers`)

export const getFollowing = (userId) =>
  api.get(`/profile/${userId}/following`)

export const searchUsers = (query) =>
  api.get('/profile/search', { params: { q: query } })

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
