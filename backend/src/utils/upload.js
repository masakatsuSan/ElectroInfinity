const multer = require('multer')
const cloudinary = require('../config/cloudinary')
const { Readable } = require('stream')

// ── Multer: store file in memory (not on disk) ─────────────────────────────
// We store in memory because we immediately stream it to Cloudinary
// No temp files left on the server
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max
  },
  fileFilter: (req, file, cb) => {
    // Only allow PDFs and images
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only PDFs and images (JPG, PNG, WebP) are allowed'))
    }
  },
})

// ── Sanitize a filename into a Cloudinary-safe public_id ────────────────────
// Cloudinary rejects public_ids with spaces, slashes or special chars.
// We also append a timestamp so re-uploading the same filename does NOT
// fail with "already exists" (overwrite:false + same public_id = 500).
function toSafePublicId(originalName = 'file') {
  const base = String(originalName).replace(/\.[^/.]+$/, '').trim() || 'file'
  const safe = base
    .normalize('NFKD')
    .replace(/[^\w\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'file'
  return `${safe}-${Date.now()}`
}

// ── Multer single-file wrapper with clean, explained errors ─────────────────
// upload.single('file') reports problems via next(err). Without this wrapper
// those errors fall through to server.js's generic 500 handler and the client
// only ever sees "An internal server error occurred" — which is what made PDF
// uploads from the admin panel look broken. This converts every failure mode
// into a 4xx carrying the real reason.
//
// A malformed multipart body (truncated upload, forced Content-Type without a
// boundary, aborted connection) can make multer/busboy throw synchronously
// rather than call back, so the call is wrapped in try/catch too — otherwise
// that throw escapes to Express and becomes a 500 again.
function uploadSingle(field) {
  return (req, res, next) => {
    let settled = false

    const fail = (err) => {
      if (settled || res.headersSent) return
      settled = true

      const code = err?.code
      if (code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ success: false, error: 'File is too large (max 20MB)' })
      }
      if (code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ success: false, error: `Unexpected file field "${err.field || field}"` })
      }
      if (code === 'LIMIT_FILE_COUNT' || code === 'LIMIT_PART_COUNT') {
        return res.status(400).json({ success: false, error: 'Too many files or form parts in one upload' })
      }
      // Wrong mimetype from fileFilter, busboy "Unexpected end of form"
      // (happens when the client forces Content-Type without a boundary),
      // or any other upload problem.
      res.status(400).json({ success: false, error: err?.message || 'File upload failed' })
    }

    try {
      upload.single(field)(req, res, (err) => {
        if (err) return fail(err)
        if (settled) return
        settled = true
        next()
      })
    } catch (err) {
      fail(err)
    }
  }
}

// ── Upload buffer to Cloudinary ─────────────────────────────────────────────
// Takes a file buffer (from multer) and uploads it to Cloudinary
// Returns { url, publicId }
function uploadToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    if (!buffer || buffer.length === 0) {
      return reject(new Error('Empty file buffer — upload aborted'))
    }
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return reject(new Error('Cloudinary is not configured on the server (missing CLOUDINARY_* env vars)'))
    }
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'electro-infinity',
        resource_type: options.resource_type || 'auto',
        ...options,
      },
      (error, result) => {
        if (error) {
          // Cloudinary nests the human-readable reason under error.error.message
          const reason = error?.error?.message || error?.message || 'Cloudinary upload failed'
          return reject(new Error(`Cloudinary rejected the upload: ${reason}`))
        }
        if (!result || !result.secure_url) return reject(new Error('Cloudinary upload failed (no URL returned)'))
        resolve({ url: result.secure_url, publicId: result.public_id })
      }
    )
    uploadStream.on('error', (err) => {
      reject(new Error(`Cloudinary upload stream error: ${err?.message || 'unknown error'}`))
    })
    // NOTE: must wrap buffer in an array — Readable.from(buffer) would
    // iterate the Buffer byte-by-byte (numbers), corrupting the upload
    // and making EVERY local PDF upload fail.
    Readable.from([buffer]).pipe(uploadStream)
  })
}

// ── Delete from Cloudinary ─────────────────────────────────────────────────
async function deleteFromCloudinary(publicId, resourceType = 'image') {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
  } catch (err) {
    console.error('Cloudinary delete operation failed')
  }
}

module.exports = { upload, uploadSingle, uploadToCloudinary, deleteFromCloudinary, toSafePublicId }
