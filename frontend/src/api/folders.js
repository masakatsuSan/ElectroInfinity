import api from './axios'

export const getFolders = (params) =>
  api.get('/folders', { params })

export const getFolder = (id) =>
  api.get(`/folders/${id}`).then(r => r.data.data)

export const createFolder = (data) =>
  api.post('/folders', data)

export const updateFolder = (id, data) =>
  api.put(`/folders/${id}`, data)

export const deleteFolder = (id, opts = {}) =>
  api.delete(`/folders/${id}`, { params: { cascade: opts.cascade ? 1 : 0 } })

export const uploadToFolder = (folderId, formData) =>
  api.post(`/folders/${folderId}/upload`, formData)

export const importPlaylistToFolder = (folderId, data) =>
  api.post(`/folders/${folderId}/playlist`, data)

export const reorderFolderItems = (folderId, items) =>
  api.put(`/folders/${folderId}/items`, { items })

export const removeFolderItem = (folderId, itemId) =>
  api.delete(`/folders/${folderId}/items/${itemId}`)
