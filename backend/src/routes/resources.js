const express = require('express')
const Resource = require('../models/Resource')
const { protect, guard, optionalAuth } = require('../middleware/auth')
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../utils/upload')
const { createActivity } = require('../utils/activity')
const { createNotificationBulk } = require('../utils/notification')
const axios = require('axios')

const router = express.Router()

function isExternalUrl(url) {
  if (!url) return false
  return /^https?:\/\/(?!.*\.cloudinary\.com)/.test(url)
}

function isGoogleDriveUrl(url) {
  if (!url) return false
  return /^https?:\/\/(?:drive\.google\.com|drive\.usercontent\.google\.com)/i.test(url)
}

function normalizeGoogleDriveUrl(url) {
  if (!url) return url
  if (!isGoogleDriveUrl(url)) return url

  let fileId = null

  const idMatch = url.match(/[?&]id=([^&]+)/)
  if (idMatch) {
    fileId = idMatch[1]
  } else {
    const dMatch = url.match(/\/d\/([^/]+)/)
    if (dMatch) fileId = dMatch[1]
  }

  if (!fileId) return url

  return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`
}

const EXTENSION_TO_MIME = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
}

function resolveMimeType(fileName) {
  if (!fileName || typeof fileName !== 'string') return 'application/octet-stream'
  const extension = fileName.split('.').pop()?.split('?')[0]?.toLowerCase() || ''
  return EXTENSION_TO_MIME[extension] || 'application/octet-stream'
}

async function streamCloudinaryToResponse(req, res, cloudinaryUrl, fileName) {
  try {
    const range = req.headers.range
    const requestConfig = {
      responseType: 'stream',
      timeout: 30000,
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 400,
    }
    if (range) {
      requestConfig.headers = { Range: range }
    }

    const response = await axios.get(cloudinaryUrl, requestConfig)

    const mimeType = response.headers['content-type'] || resolveMimeType(fileName)
    res.setHeader('Content-Type', mimeType)
    res.setHeader('Accept-Ranges', 'bytes')

    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length'])
    }
    if (response.headers['content-range']) {
      res.setHeader('Content-Range', response.headers['content-range'])
    }

    const isRange = range && response.status === 206
    res.status(isRange ? 206 : 200)

    response.data.on('error', (err) => {
      console.error('Stream error while fetching from Cloudinary:', {
        url: cloudinaryUrl,
        error: err.message,
      })
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'Failed to fetch the file.' })
      }
    })

    response.data.pipe(res)
  } catch (error) {
    console.error('Failed to fetch file from Cloudinary:', {
      url: cloudinaryUrl,
      error: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      code: error.code,
    })

    if (!res.headersSent) {
      if (error.response?.status === 404) {
        res.status(404).json({ success: false, error: 'File not found.' })
      } else if (error.code === 'ECONNABORTED') {
        res.status(504).json({ success: false, error: 'File request timed out.' })
      } else {
        res.status(500).json({ success: false, error: 'Failed to fetch the file.' })
      }
    }
  }
}

// ── GET /api/resources ─────────────────────────────────────────────────────
// Public — supports ?type=notes&semester=5&subject=Power+System-I
// All resources are visible to all users; semester/subject are only for filtering
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { type, semester, subject } = req.query
    const filter = {}
    if (type) filter.type = type
    if (semester) filter.semester = Number(semester)
    if (subject) filter.subject = subject

    // Optional pagination. Only applied when the caller sends ?page / ?limit,
    // so the existing "return everything" response shape stays byte-identical
    // for the live frontend (which calls this without any params).
    const wantsPaging = req.query.page !== undefined || req.query.limit !== undefined
    const page  = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50))

    let query = Resource.find(filter)
      .populate('uploadedBy', 'name photo')
      .sort({ createdAt: -1 })
      .lean()

    if (wantsPaging) query = query.skip((page - 1) * limit).limit(limit)

    const resources = await query

    if (!wantsPaging) {
      return res.json({ success: true, data: resources })
    }

    const total = await Resource.countDocuments(filter)
    res.json({
      success: true,
      data: resources,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// ── GET /api/resources/:id/download ───────────────────────────────────────
// Increments download count then redirects to the file URL for direct fast download
router.get('/:id/download', async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloadCount: 1 } },
      { new: true }
    )
    if (!resource) return res.status(404).json({ success: false, error: 'Not found' })

    // Use redirect for fast direct download from CDN/storage provider
    if (isGoogleDriveUrl(resource.fileUrl)) {
      const normalizedUrl = normalizeGoogleDriveUrl(resource.fileUrl)
      res.setHeader('Content-Disposition', `attachment; filename="${resource.fileName || 'download'}"`)
      return res.redirect(normalizedUrl)
    }

    if (isExternalUrl(resource.fileUrl)) {
      res.setHeader('Content-Disposition', `attachment; filename="${resource.fileName || 'download'}"`)
      return res.redirect(resource.fileUrl)
    }

    // Cloudinary files - redirect directly to Cloudinary CDN
    res.setHeader('Content-Disposition', `attachment; filename="${resource.fileName || 'download'}"`)
    return res.redirect(resource.fileUrl)
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// ── GET /api/resources/:id/preview ────────────────────────────────────────
// Streams the file inline for the application PDF viewer
router.get('/:id/preview', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
    if (!resource) return res.status(404).json({ success: false, error: 'Not found' })

    res.setHeader('Content-Disposition', `inline; filename="${resource.fileName || 'preview'}"`)

    if (isGoogleDriveUrl(resource.fileUrl)) {
      const normalizedUrl = normalizeGoogleDriveUrl(resource.fileUrl)
      return await streamCloudinaryToResponse(req, res, normalizedUrl, resource.fileName)
    }

    if (isExternalUrl(resource.fileUrl)) {
      return res.redirect(resource.fileUrl)
    }

    await streamCloudinaryToResponse(req, res, resource.fileUrl, resource.fileName)
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// ── POST /api/resources ────────────────────────────────────────────────────
// Upload a file — CR, and admin
// The file comes as multipart/form-data with field name "file"
router.post(
  '/',
  protect,
  guard('cr', 'super_admin', 'admin'),
  upload.single('file'),   // multer processes the file first
  async (req, res) => {
    try {
      const { title, type, semester, subject, dueDate, fileUrl } = req.body

      if (!fileUrl && !req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded and no link provided' })
      }

      let url = null
      let publicId = ''
      let fileName = ''

      if (req.file) {
        // Determine Cloudinary folder based on type
        const folderMap = {
          notes: 'notes',
          pyq: 'previous-year-papers',
          assignment: 'assignments',
          lab_manual: 'lab-manuals',
          syllabus: 'syllabus',
        }
        const folder = `electro-infinity/${folderMap[type] || 'resources'}`

        const isPdf = req.file.mimetype === 'application/pdf';
        const resourceType = isPdf ? 'raw' : 'auto';

        // Upload the file buffer to Cloudinary
        const { url: cloudUrl, publicId: cloudId } = await uploadToCloudinary(req.file.buffer, {
          folder,
          resource_type: resourceType,
          // Use original filename (cleaned) as the Cloudinary public ID
          public_id: req.file.originalname.replace(/\.[^/.]+$/, ''),
          overwrite: false,
        })

        url = cloudUrl
        publicId = cloudId
        fileName = req.file.originalname
      } else {
        url = fileUrl
        fileName = (fileUrl && fileUrl.split('/').pop()) || 'external-link'
      }

      const resource = await Resource.create({
        title,
        type,
        semester: semester ? Number(semester) : null,
        subject,
        dueDate: dueDate || null,
        fileUrl: url,
        filePublicId: publicId,
        fileName,
        uploadedBy: req.user._id,
        batchId: req.user.role === 'cr' ? req.user.batch : (req.body.batchId || ''),
        visibility: 'GLOBAL',
      })

      await createActivity(
        req.user._id,
        'resource_uploaded',
        title,
        `Uploaded a ${type || 'resource'} for ${subject || '—'}`,
        `/resources`
      );

      // Notify relevant users about new resource
      const io = req.app.get('io')
      const User = require('../models/User')
      let recipientQuery = { role: { $in: ['student', 'cr'] }, isActive: true }
      if (resource.batchId) {
        recipientQuery.batch = resource.batchId
      }
      const recipients = await User.find(recipientQuery).select('_id')
      const recipientIds = recipients
        .map(r => r._id.toString())
        .filter(id => id !== req.user._id.toString())
      if (recipientIds.length > 0) {
        await createNotificationBulk({
          recipients: recipientIds,
          actor: req.user._id,
          type: 'resource_uploaded',
          title: `New ${type || 'resource'}: ${title}`,
          message: subject || `Semester ${resource.semester || '—'}`,
          link: '/resources',
          entityId: resource._id,
          entityType: 'Resource',
          io,
        })
      }

      res.status(201).json({ success: true, data: resource })
    } catch (err) {
      res.status(500).json({ success: false, error: 'An internal server error occurred' })
    }
  }
)

// ── PUT /api/resources/:id ───────────────────────────────────────────────────
// Edit resource — CR (own batch only), super_admin, admin
router.put(
  '/:id',
  protect,
  guard('cr', 'super_admin', 'admin'),
  upload.single('file'),
  async (req, res) => {
    try {
      const resource = await Resource.findById(req.params.id)
      if (!resource) return res.status(404).json({ success: false, error: 'Not found' })

      // CR can only edit their own batch's uploads
      if (req.user.role === 'cr' && resource.batchId !== req.user.batch) {
        return res.status(403).json({ success: false, error: 'Not your upload' })
      }

      const { title, type, semester, subject, dueDate, visibility, fileUrl } = req.body
      const updates = {
        title:      title      || resource.title,
        type:       type       || resource.type,
        semester:   semester   !== undefined ? Number(semester) : resource.semester,
        subject:    subject    !== undefined ? subject : resource.subject,
        dueDate:    dueDate    || resource.dueDate,
        visibility: visibility || resource.visibility,
      }

      // If a new file is provided, delete the old one and upload the new
      if (req.file) {
        if (resource.filePublicId) {
          const isRaw = resource.fileUrl.includes('/raw/upload/')
          await deleteFromCloudinary(resource.filePublicId, isRaw ? 'raw' : 'image')
        }

        const folderMap = {
          notes: 'notes',
          pyq: 'previous-year-papers',
          assignment: 'assignments',
          lab_manual: 'lab-manuals',
          syllabus: 'syllabus',
        }
        const folder = `electro-infinity/${folderMap[updates.type] || 'resources'}`
        const isPdf = req.file.mimetype === 'application/pdf'
        const resourceType = isPdf ? 'raw' : 'auto';
        const { url, publicId } = await uploadToCloudinary(req.file.buffer, {
          folder,
          resource_type: resourceType,
          public_id: req.file.originalname.replace(/\.[^/.]+$/, ''),
          overwrite: false,
        })

        updates.fileUrl      = url
        updates.filePublicId = publicId
        updates.fileName     = req.file.originalname
      } else if (fileUrl) {
        if (resource.filePublicId) {
          const isRaw = resource.fileUrl.includes('/raw/upload/')
          await deleteFromCloudinary(resource.filePublicId, isRaw ? 'raw' : 'image')
        }
        updates.fileUrl      = fileUrl
        updates.filePublicId = ''
        updates.fileName     = (fileUrl && fileUrl.split('/').pop()) || 'external-link'
      }

      const updated = await Resource.findByIdAndUpdate(req.params.id, updates, { new: true })
      res.json({ success: true, data: updated })
    } catch (err) {
      res.status(500).json({ success: false, error: 'An internal server error occurred' })
    }
  }
)

// ── DELETE /api/resources/:id ──────────────────────────────────────────────
router.delete('/:id', protect, guard('cr', 'super_admin', 'admin'), async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
    if (!resource) return res.status(404).json({ success: false, error: 'Not found' })

    // CR can only delete their own batch's uploads
    if (
      req.user.role === 'cr' &&
      resource.batchId !== req.user.batch
    ) {
      return res.status(403).json({ success: false, error: 'Not your upload' })
    }

    // Delete from Cloudinary first
    if (resource.filePublicId) {
      const isRaw = resource.fileUrl.includes('/raw/upload/');
      await deleteFromCloudinary(resource.filePublicId, isRaw ? 'raw' : 'image')
    }

    await resource.deleteOne()
    res.json({ success: true, message: 'Resource deleted' })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

module.exports = router
