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

// ── Multer single-file wrapper with clean 400 errors ─────────────────────────
// upload.single('file') throws via next(err). Without this wrapper those
// errors fall through to server.js's generic 500 handler ("internal server
// error"). This converts them to a 400 with the real reason instead.
function uploadSingle(field) {
  return (req, res, next) => {
    upload.single(field)(req, res, (err) => {
      if (!err) return next()
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, error: 'File is too large (max 20MB)' })
      }
      // Wrong mimetype from fileFilter, busboy "Unexpected end of form"
      // (happens when the client forces Content-Type without a boundary),
      // or any other upload problem.
      return res.status(400).json({ success: false, error: err.message || 'File upload failed' })
    })
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
        if (error) return reject(error)
        if (!result || !result.secure_url) return reject(new Error('Cloudinary upload failed (no URL returned)'))
        resolve({ url: result.secure_url, publicId: result.public_id })
      }
    )
    uploadStream.on('error', reject)
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
