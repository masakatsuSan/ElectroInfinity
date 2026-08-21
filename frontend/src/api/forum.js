import api from './axios'

export const getPosts = (params) =>
  api.get('/forum', { params })

export const getPost = (id) =>
  api.get(`/forum/${id}`)

export const createPost = (data) =>
  api.post('/forum', data)

export const upvotePost = (id) =>
  api.put(`/forum/${id}/upvote`)

export const downvotePost = (id) =>
  api.put(`/forum/${id}/downvote`)

export const getComments = (postId) =>
  api.get(`/forum/${postId}/comments`)

export const createComment = (postId, data) =>
  api.post(`/forum/${postId}/comments`, data)

export const upvoteComment = (commentId) =>
  api.put(`/forum/comments/${commentId}/upvote`)

export const getForumRooms = () =>
  api.get('/forum/rooms')

export const createForumRoom = (data) =>
  api.post('/forum/rooms', data)

export const updateForumRoom = (id, data) =>
  api.patch(`/forum/rooms/${id}`, data)

export const deleteForumRoom = (id) =>
  api.delete(`/forum/rooms/${id}`)
