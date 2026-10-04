const express = require('express')
const Resource = require('../models/Resource')
const { protect, guard, optionalAuth } = require('../middleware/auth')
const { uploadSingle, uploadToCloudinary, deleteFromCloudinary, toSafePublicId } = require('../utils/upload')
const cloudinary = require('../config/cloudinary')
const { createActivity } = require('../utils/activity')
const { createNotificationBulk } = require('../utils/notification')
const {
  isGoogleDriveUrl,
  isGoogleFolderUrl,
  extractGoogleDriveFileId,
} = require('../utils/googleDrive')
const {
  resolveDirectDownloadUrl,
  resolveExternalLink,
  deriveLinkFileName,
} = require('../utils/resourceLinks')
const axios = require('axios')

const router = express.Router()

function isExternalUrl(url) {
  if (!url) return false
  return /^https?:\/\/(?!.*\.cloudinary\.com)/.test(url)
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

async function streamCloudinaryToResponse(req, res, cloudinaryUrl, fileName, disposition = 'inline') {
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

    const isPdf = fileName && fileName.toLowerCase().endsWith('.pdf')
    const mimeType = isPdf ? 'application/pdf' : (response.headers['content-type'] || resolveMimeType(fileName))
    res.setHeader('Content-Type', mimeType)
    res.setHeader('Accept-Ranges', 'bytes')

    const safeName = (fileName && fileName.replace(/"/g, '')) || 'download'
    res.setHeader('Content-Disposition', `${disposition}; filename="${safeName}"`)

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

// ── GET /api/upload-signature ───────────────────────────────────────────────
// Signed direct-upload credentials for the admin panel. Deliberately registered
// BEFORE the /:id/* routes below so this literal path can never be matched as
// an id.
//
// The Cloudinary API secret never leaves this process. The client receives only
// a one-time signature scoped to the "resources" folder — plus allowed_formats,
// so Cloudinary itself rejects anything that is not a PDF — and POSTs the bytes
// straight to Cloudinary. That keeps PDFs off the Render dyno entirely, which is
// what made admin uploads slow and prone to the 30s client timeout: the file
// used to travel client -> dyno -> Cloudinary while buffered in RAM.
const uploadSignatureChain = [
  protect,
  guard('cr', 'super_admin', 'admin'), // same roles as POST /api/resources
  (req, res) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('[UPLOAD SIGNATURE] CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET are not set on the server')
      return res.status(500).json({ success: false, error: 'Cloudinary is not configured on the server' })
    }

    try {
      const timestamp = Math.round(Date.now() / 1000)
      const folder = 'resources'
      // Signed as the string 'pdf' (not ['pdf']) so the signature payload
      // contains exactly "allowed_formats=pdf" — the same bytes the browser
      // echoes back in the upload FormData. Any mismatch here fails with
      // "Invalid Signature".
      const allowedFormats = 'pdf'
      const signature = cloudinary.utils.api_sign_request(
        { timestamp, folder, allowed_formats: allowedFormats },
        apiSecret,
      )

      res.json({
        success: true,
        data: { timestamp, signature, apiKey, cloudName, folder, allowedFormats },
      })
    } catch (err) {
      console.error('[UPLOAD SIGNATURE ERROR]', err?.message, err?.stack)
      res.status(500).json({ success: false, error: 'Could not generate upload signature' })
    }
  },
]

router.get('/upload-signature', ...uploadSignatureChain)

// ── GET /api/resources/:id/download ───────────────────────────────────────
// Counts the download, then redirects the browser to wherever the file actually
// lives. Nothing is fetched or streamed here — see resolveDirectDownloadUrl in
// utils/resourceLinks.js for why.
router.get('/:id/download', async (req, res) => {
  let resource
  try {
    resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloadCount: 1 } },
      { new: true }
    )
  } catch (err) {
    console.error('[RESOURCES DOWNLOAD] DB lookup failed:', err?.message)
    return res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }

  if (!resource) return res.status(404).json({ success: false, error: 'Not found' })

  const target = resolveDirectDownloadUrl(resource)
  if (!target.url) {
    return res.status(target.status || 400).json({ success: false, error: target.error })
  }

  // 303 so the browser always issues a GET at the target, whatever the
  // original method was.
  return res.redirect(303, target.url)
})

// ── POST /api/resources/:id/download/increment ─────────────────────────────
// Increments download count without redirecting. `directUrl` is resolved with
// the exact same helper /download uses, so callers can point the browser at the
// real file themselves when they cannot follow a redirect.
router.post('/:id/download/increment', async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloadCount: 1 } },
      { new: true }
    )
    if (!resource) return res.status(404).json({ success: false, error: 'Not found' })

    const target = resolveDirectDownloadUrl(resource)

    res.json({
      success: true,
      data: {
        downloadCount: resource.downloadCount,
        isGoogleDrive: isGoogleDriveUrl(resource.fileUrl),
        directUrl: target.url || null,
      },
    })
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

    if (isGoogleDriveUrl(resource.fileUrl)) {
      // Kept for direct browser navigation / non-app clients only. The app
      // embeds Drive's viewer directly (see frontend getGoogleDriveEmbedUrl)
      // because pointing react-pdf at this endpoint made it follow a redirect
      // to an HTML page that pdf.js cannot parse.
      const fileId = extractGoogleDriveFileId(resource.fileUrl)
      if (fileId) {
        return res.redirect(`https://drive.google.com/file/d/${fileId}/preview`)
      }
      return res.status(400).json({ success: false, error: 'Invalid Google Drive URL' })
    }
    if (isExternalUrl(resource.fileUrl)) {
      return res.redirect(resource.fileUrl)
    }

    await streamCloudinaryToResponse(req, res, resource.fileUrl, resource.fileName, 'inline')
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// Turn any upload/update failure into a message the admin can act on.
// Mongoose validation, duplicate keys, Cloudinary rejections and plain network
// errors all land here — the point is that the client never receives a bare
// "internal server error" for a failed PDF upload.
function describeWriteError(err) {
  if (!err) return 'Upload failed'
  if (err.name === 'ValidationError') {
    return Object.values(err.errors || {}).map((e) => e.message).join(' · ') || 'Validation failed'
  }
  if (err.code === 11000) return 'A resource with that title already exists'
  if (err.name === 'MulterError' || err.code?.startsWith?.('LIMIT_')) {
    return err.message || 'File upload failed'
  }
  return err.message || 'Upload failed'
}

// Cloudinary/network failures are server-side, so they are logged loudly and
// reported as a 502 so the admin can tell "my file was rejected" apart from
// "the server is broken".
function writeErrorStatus(err) {
  const message = describeWriteError(err)
  const isServerSide =
    !err?.name?.includes?.('Validation') &&
    err?.code !== 11000 &&
    !err?.name?.includes?.('MulterError') &&
    !(typeof message === 'string' && /required|already exists/i.test(message))
  return { status: isServerSide ? 502 : 400, message }
}

// ── POST /api/resources ────────────────────────────────────────────────────
// Upload a file — CR, and admin
// The file comes as multipart/form-data with field name "file"
router.post(
  '/',
  protect,
  guard('cr', 'super_admin', 'admin'),
  uploadSingle('file'),   // multer processes the file first (400s, not 500s, on error)
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
          books: 'books',
          organisers: 'organisers',
          pyqs: 'pyqs',
          'yt playlist': 'yt-playlist',
        }
        const folder = `electro-infinity/${folderMap[type] || 'resources'}`

        const isPdf = req.file.mimetype === 'application/pdf';
        const resourceType = isPdf ? 'raw' : 'auto';

        // Upload the file buffer to Cloudinary
        const { url: cloudUrl, publicId: cloudId } = await uploadToCloudinary(req.file.buffer, {
          folder,
          resource_type: resourceType,
          // Sanitized + timestamped so re-uploads never clash
          // (overwrite:false + raw filename with spaces = 500 before).
          public_id: toSafePublicId(req.file.originalname),
          overwrite: true,
        })

        url = cloudUrl
        publicId = cloudId
        fileName = req.file.originalname
      } else {
        // Reject links we can never serve, instead of storing a resource that
        // is guaranteed to fail on download for every user who clicks it.
        // Drive links are stored normalised to their direct-download URL.
        const resolved = resolveExternalLink(fileUrl)
        if (!resolved.ok) {
          return res.status(400).json({ success: false, error: resolved.error })
        }

        url = resolved.url
        // A signed direct upload has already placed the asset in Cloudinary, so
        // the client sends back the publicId (needed to delete the asset later)
        // and the original filename. A pasted Drive/external link has neither.
        publicId = String(req.body.publicId || '').trim()
        // A Drive share link ends in "/view" or "/preview", which would be
        // saved as the download filename. Use the resource title instead so
        // the file the user receives is named something recognisable.
        fileName = String(req.body.fileName || '').trim() || deriveLinkFileName(url, {
          isGoogleDrive: resolved.isGoogleDrive,
          title,
        })
      }

      // A CR can only publish to their own batch. Admins and super_admins may
      // target a specific batch or publish globally; when nothing is supplied
      // the upload is batch-scoped so a normal upload no longer notifies all
      // ~170 students (visibility used to be hardcoded 'GLOBAL' here, which
      // both leaked uploads across batches and widened the fan-out).
      const isCr = req.user.role === 'cr'
      const batchId = isCr
        ? req.user.batch
        : (req.body.batchId || '').trim()
      const visibility = isCr
        ? 'BATCH'
        : ((req.body.visibility || '').trim().toUpperCase() === 'GLOBAL' && !batchId ? 'GLOBAL' : 'BATCH')

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
        batchId,
        visibility,
      })

      await createActivity(
        req.user._id,
        'resource_uploaded',
        title,
        `Uploaded a ${type || 'resource'} for ${subject || '—'}`,
        `/resources`
      );

      // Reply before the notification fan-out. The fan-out used to run inline
      // and awaited one unread-count query per recipient, so with ~170 students
      // the response routinely arrived after the browser's 30s axios timeout —
      // the upload had already been saved, but the admin saw "Upload failed"
      // and re-uploading created duplicates.
      res.status(201).json({ success: true, data: resource })

      // Fan-out continues after the response. createNotificationBulk swallows
      // its own errors, so a failure here can no longer corrupt the result.
      try {
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
      } catch (notifyError) {
        console.error('[RESOURCES NOTIFY ERROR]', notifyError?.message)
      }
    } catch (err) {
      console.error('[RESOURCES POST ERROR]', err?.message, err?.stack)
      // Surface the real problem (validation, Cloudinary rejection, network)
      // instead of a blanket "internal server error" so uploads can be debugged.
      const { status, message } = writeErrorStatus(err)
      res.status(status).json({ success: false, error: message })
    }
  }
)

// ── PUT /api/resources/:id ───────────────────────────────────────────────────
// Edit resource — CR (own batch only), super_admin, admin
router.put(
  '/:id',
  protect,
  guard('cr', 'super_admin', 'admin'),
  uploadSingle('file'),
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
          books: 'books',
          organisers: 'organisers',
          pyqs: 'pyqs',
          'yt playlist': 'yt-playlist',
        }
        const folder = `electro-infinity/${folderMap[updates.type] || 'resources'}`
        const isPdf = req.file.mimetype === 'application/pdf'
        const resourceType = isPdf ? 'raw' : 'auto';
        const { url, publicId } = await uploadToCloudinary(req.file.buffer, {
          folder,
          resource_type: resourceType,
          public_id: toSafePublicId(req.file.originalname),
          overwrite: true,
        })

        updates.fileUrl      = url
        updates.filePublicId = publicId
        updates.fileName     = req.file.originalname
      } else if (fileUrl) {
        // Same validation as create: an edit must not be able to store a link
        // that can only ever produce a broken download. Drive links are stored
        // normalised to their direct-download URL.
        const resolved = resolveExternalLink(fileUrl)
        if (!resolved.ok) {
          return res.status(400).json({ success: false, error: resolved.error })
        }

        // Only destroy the previous Cloudinary asset once the new link is known
        // to be servable, so a bad paste cannot destroy a working file.
        if (resource.filePublicId) {
          const isRaw = resource.fileUrl.includes('/raw/upload/')
          await deleteFromCloudinary(resource.filePublicId, isRaw ? 'raw' : 'image')
        }
        updates.fileUrl      = resolved.url
        updates.filePublicId = ''
        updates.fileName     = deriveLinkFileName(resolved.url, {
          isGoogleDrive: resolved.isGoogleDrive,
          title: updates.title || resource.title,
        })
      }

      const updated = await Resource.findByIdAndUpdate(req.params.id, updates, { new: true })
      res.json({ success: true, data: updated })
    } catch (err) {
      console.error('[RESOURCES PUT ERROR]', err?.message, err?.stack)
      const { status, message } = writeErrorStatus(err)
      res.status(status).json({ success: false, error: message })
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
// Exported so server.js can mount the same protected chain at the canonical
// /api/upload-signature path used by the admin panel.
module.exports.uploadSignature = uploadSignatureChain
