import axios from 'axios'
import api from './axios'

// Get all resources — optional ?type=notes&semester=5
export const getResources = (params) =>
  api.get('/resources', { params })

// Fetch a resource preview as a blob URL via the axios instance (handles auth + base URL)
export const fetchPreviewBlobUrl = async (id) => {
  const response = await api.get(`/resources/${id}/preview`, {
    responseType: 'blob',
  })
  return URL.createObjectURL(response.data)
}

// Build the in-app preview URL for a resource (used by the PDF viewer)
export const getPreviewUrl = (id) =>
  `${import.meta.env.VITE_API_URL || '/api'}/resources/${id}/preview`

// Download a resource.
//
// This returns a plain URL (not a request) because it is used as an <a href>,
// so no Authorization header is sent — GET /resources/:id/download is
// therefore deliberately unauthenticated on the backend. That endpoint counts
// the download and then 302-redirects to wherever the file actually lives:
// the Cloudinary URL (with fl_attachment) for uploads, Drive's
// /uc?export=download endpoint for legacy Drive links. It never streams the
// file through the API server.
export const downloadResource = (id) =>
  `${import.meta.env.VITE_API_URL || '/api'}/resources/${id}/download`

// Increment download count without redirecting (for Google Drive direct downloads)
export const incrementDownloadCount = (id) =>
  api.post(`/resources/${id}/download/increment`)

// ── Google Drive helpers ──────────────────────────────────────────────────
// Re-exported from the shared module so there is a single source of truth;
// these used to be duplicated here and in both preview components, and the
// copies disagreed on which Drive hosts count.
export {
  isGoogleDriveUrl,
  isGoogleFolderUrl,
  isGoogleNonFileUrl,
  extractGoogleDriveFileId,
  getGoogleDriveEmbedUrl,
  getGoogleDriveDownloadUrl,
  normalizeGoogleDriveUrl,
} from '../utils/googleDrive'

// Upload a new resource — sends as FormData (has a file attached)
// NOTE: do NOT set Content-Type manually — the browser/axios must set
// multipart/form-data WITH the boundary, otherwise multer can't parse it
// and every upload fails.
export const uploadResource = (formData) =>
  api.post('/resources', formData)

// ── Signed direct upload to Cloudinary ──────────────────────────────────────
// The admin panel no longer sends PDF bytes through the API server. It fetches a
// one-time signature (the API secret never leaves the backend), POSTs the file
// straight to Cloudinary with live progress, then creates the resource record
// from the returned secure_url + public_id.

// One-time signed upload credentials (admin/CR only). `name` is the original
// filename; the server derives the public_id from it and returns it, so the
// signed public_id and the uploaded public_id are guaranteed byte-identical.
export const getUploadSignature = (name) =>
  api.get('/upload-signature', { params: { name } }).then((r) => r.data.data)

// POST the file directly to Cloudinary's raw upload endpoint.
// onProgress receives a number 0–100.
//
// Uses plain axios rather than the `api` instance on purpose: the 30s API
// timeout and the 401 interceptor must not apply here. A large PDF needs as long
// as the network takes, and the progress bar keeps the user informed instead of
// failing at an arbitrary limit.
export const uploadToCloudinaryDirect = (file, signature, onProgress) => {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('folder', signature.folder)
  fd.append('timestamp', String(signature.timestamp))
  fd.append('signature', signature.signature)
  fd.append('api_key', signature.apiKey)
  // Must be byte-identical to what the server signed, otherwise Cloudinary
  // rejects the request with "Invalid Signature". publicId comes from the
  // signature response — never rebuilt here.
  fd.append('allowed_formats', signature.allowedFormats)
  fd.append('public_id', signature.publicId)
  return axios.post(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/raw/upload`,
    fd,
    {
      onUploadProgress: (event) => {
        if (event.total && onProgress) {
          onProgress(Math.round((event.loaded / event.total) * 100))
        }
      },
    },
  )
}

// Create the resource record after the file has landed in Cloudinary.
// JSON body — no multipart, because the file is already uploaded.
export const createResource = (payload) => api.post('/resources', payload)

// Update a resource — sends as FormData (optionally with a new file)
export const updateResource = (id, formData) =>
  api.put(`/resources/${id}`, formData)

// Delete a resource
export const deleteResource = (id) =>
  api.delete(`/resources/${id}`)
