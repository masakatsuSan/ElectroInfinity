import api from './axios'

export const getPublishedPosts = (params = {}) =>
  api.get('/posts', { params })

export const getPublishedPost = (slug) =>
  api.get(`/posts/p/${slug}`)

export const getPost = (idOrSlug) =>
  api.get(`/posts/${idOrSlug}`)

export const adminGetAllPosts = (params = {}) =>
  api.get('/posts/admin/all', { params })

export const createPost = (data) =>
  api.post('/posts', data)

export const updatePost = (id, data) =>
  api.put(`/posts/${id}`, data)

export const publishPost = (id) =>
  api.patch(`/posts/${id}/publish`)

export const unpublishPost = (id) =>
  api.patch(`/posts/${id}/unpublish`)

export const deletePost = (id) =>
  api.delete(`/posts/${id}`)

export const uploadBlogImage = (formData) =>
  api.post('/posts/uploads/image', formData)
