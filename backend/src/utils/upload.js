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

// ── Upload buffer to Cloudinary ─────────────────────────────────────────────
// Takes a file buffer (from multer) and uploads it to Cloudinary
// Returns { url, publicId }
function uploadToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'electro-infinity',
        resource_type: options.resource_type || 'auto',
        ...options,
      },
      (error, result) => {
        if (error) return reject(error)
        resolve({ url: result.secure_url, publicId: result.public_id })
      }
    )
    // Convert buffer to readable stream and pipe to cloudinary
    Readable.from(buffer).pipe(uploadStream)
  })
}

// ── Delete from Cloudinary ─────────────────────────────────────────────────
async function deleteFromCloudinary(publicId, resourceType = 'image') {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
  } catch (err) {
    console.error('Cloudinary delete error:', err.message)
  }
}

module.exports = { upload, uploadToCloudinary, deleteFromCloudinary }
