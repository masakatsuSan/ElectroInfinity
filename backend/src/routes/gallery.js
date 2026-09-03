const express = require('express')
const Gallery = require('../models/Gallery')
const User = require('../models/User')
const { protect, guard } = require('../middleware/auth')
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../utils/upload')
const { createNotification, createNotificationBulk } = require('../utils/notification')
const { canApprove } = require('../utils/canApprove')
const axios = require('axios')

const router = express.Router()

const TEASER_LIMIT = 6

function buildGalleryTeaser(photo) {
  return {
    _id: photo._id,
    kind: 'gallery',
    title: photo.title,
    category: photo.category,
    createdAt: photo.createdAt,
    date: photo.date,
    isApproved: false,
    isPendingTeaser: true,
    uploadedBy: photo.uploadedBy && typeof photo.uploadedBy === 'object'
      ? {
          _id: photo.uploadedBy._id,
          name: photo.uploadedBy.name,
          photo: photo.uploadedBy.photo,
          rollNumber: photo.uploadedBy.rollNumber,
          batch: photo.uploadedBy.batch,
          role: photo.uploadedBy.role,
          profileVisibility: photo.uploadedBy.profile?.profileVisibility || 'public',
        }
      : photo.uploadedBy,
  }
}

// ── GET /api/gallery ────────────────────────────────────────────────
// Public: only approved photos + sanitized pending teasers.
// Admin/CR: see all (including pending). ?pending=true forces all.
// ?teasers=true limits to most recent pending teasers only.
router.get('/', async (req, res) => {
  try {
    const user = req.user
    const { pending, author, teasers } = req.query
    const isReviewer = user && (user.role === 'admin' || user.role === 'super_admin' || user.role === 'cr')

    if (teasers === 'true') {
      const recent = await Gallery.find({ isApproved: false })
        .sort({ createdAt: -1 })
        .limit(TEASER_LIMIT)
        .populate('uploadedBy', 'name photo rollNumber batch role profile.profileVisibility')
      return res.json({ success: true, data: [], pendingTeasers: recent.map(buildGalleryTeaser) })
    }

    const query = {}
    if (author) query.uploadedBy = author

    let photos
    if (isReviewer) {
      photos = await Gallery.find(query).sort({ date: -1, createdAt: -1 })
    } else if (user && author && author === user._id.toString()) {
      query.$or = [{ isApproved: true }, { uploadedBy: user._id }]
      photos = await Gallery.find(query).sort({ date: -1, createdAt: -1 })
    } else if (pending === 'true') {
      return res.json({ success: true, data: [] })
    } else {
      query.isApproved = true
      photos = await Gallery.find(query).sort({ date: -1, createdAt: -1 })
    }

    // For public viewers, also attach sanitized recent pending teasers
    let pendingTeasers = []
    if (!isReviewer && !author) {
      const recentPending = await Gallery.find({ isApproved: false })
        .sort({ createdAt: -1 })
        .limit(TEASER_LIMIT)
        .populate('uploadedBy', 'name photo rollNumber batch role profile.profileVisibility')
      pendingTeasers = recentPending.map(buildGalleryTeaser)
    }

    res.json({ success: true, data: photos, pendingTeasers })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── GET /api/gallery/:id ────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const photo = await Gallery.findById(req.params.id)
      .populate('uploadedBy', 'name photo rollNumber batch role profile.profileVisibility')
    if (!photo) return res.status(404).json({ success: false, error: 'Not found' })

    if (!photo.isApproved) {
      const user = req.user
      const isAuthor = user && photo.uploadedBy && photo.uploadedBy._id.toString() === user._id.toString()
      const allowed = isAuthor || canApprove(user, photo.uploadedBy)
      if (!allowed) {
        // Return sanitized teaser for anonymous public
        return res.json({ success: true, data: buildGalleryTeaser(photo) })
      }
    }

    res.json({ success: true, data: photo })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:id/image', async (req, res) => {
  try {
    const photo = await Gallery.findById(req.params.id)
      .populate('uploadedBy', 'batch role')
    if (!photo) return res.status(404).json({ success: false, error: 'Not found' })

    if (!photo.isApproved) {
      const user = req.user
      const isAuthor = user && photo.uploadedBy && photo.uploadedBy._id.toString() === user._id.toString()
      const allowed = isAuthor || canApprove(user, photo.uploadedBy)
      if (!allowed) {
        return res.status(403).json({ success: false, error: 'Photo not approved yet' })
      }
    }

    if (!photo.imageUrl) {
      return res.status(404).json({ success: false, error: 'No image for this photo' })
    }

    let parsed
    try { parsed = new URL(photo.imageUrl) } catch (_) { parsed = null }
    if (!parsed || !/^https?:$/.test(parsed.protocol)) {
      return res.status(400).json({ success: false, error: 'Invalid image URL' })
    }

    const response = await axios.get(photo.imageUrl, {
      responseType: 'stream',
      maxRedirects: 5,
      timeout: 15000,
      validateStatus: () => true,
    })

    if (response.status < 200 || response.status >= 300) {
      response.data.resume()
      return res.status(502).json({ success: false, error: `Upstream returned ${response.status}` })
    }

    const upstreamType = response.headers['content-type'] || 'application/octet-stream'
    res.setHeader('Content-Type', upstreamType)
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length'])
    }
    if (photo.isApproved) {
      res.setHeader('Cache-Control', 'public, max-age=3600')
    } else {
      res.setHeader('Cache-Control', 'private, no-store')
    }

    response.data.on('error', () => { try { res.end() } catch (_) {} })
    req.on('close', () => { try { response.data.destroy() } catch (_) {} })

    response.data.pipe(res)
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── POST /api/gallery ───────────────────────────────────────────────
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    const { title, category, date, imageUrl } = req.body

    let finalUrl    = imageUrl || ''
    let finalPubId  = ''

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'electro-infinity/gallery',
        resource_type: 'image',
      })
      finalUrl = result.url
      finalPubId = result.publicId
    }

    if (!finalUrl) {
      return res.status(400).json({ success: false, error: 'An image file or imageUrl is required' })
    }

    const isReviewer = req.user.role === 'admin' || req.user.role === 'super_admin' || req.user.role === 'cr'

    const photo = await Gallery.create({
      title: title || '',
      imageUrl: finalUrl,
      imagePublicId: finalPubId,
      category: category || 'campus',
      date: date ? new Date(date) : Date.now(),
      uploadedBy: req.user._id,
      isApproved: isReviewer,
      approvedBy: isReviewer ? req.user._id : null,
      approvedAt: isReviewer ? new Date() : null,
    })

    if (!isReviewer) {
      const io = req.app.get('io')
      const reviewers = await User.find({
        role: { $in: ['admin', 'super_admin', 'cr'] },
        _id: { $ne: req.user._id },
      }).select('_id')
      const recipientIds = reviewers.map(r => r._id.toString())
      if (recipientIds.length > 0) {
        await createNotificationBulk({
          recipients: recipientIds,
          actor: req.user._id,
          type: 'gallery_submitted',
          title: `New gallery photo awaiting approval`,
          message: photo.title || 'Department moment',
          link: '/admin/gallery',
          entityId: photo._id,
          entityType: 'Gallery',
          io,
        })
      }
    }

    res.status(201).json({ success: true, data: photo })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── PATCH /api/gallery/:id ───────────────────────────────────────────
router.patch('/:id', protect, upload.single('image'), async (req, res) => {
  try {
    const photo = await Gallery.findById(req.params.id)
      .populate('uploadedBy', 'batch role _id')
    if (!photo) return res.status(404).json({ success: false, error: 'Not found' })

    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin'
    const isApprover = canApprove(req.user, photo.uploadedBy)
    const isAuthor = photo.uploadedBy && photo.uploadedBy._id.toString() === req.user._id.toString()

    if (!isApprover && !isAuthor) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this photo' })
    }

    if (req.body.isApproved !== undefined && !isApprover) {
      return res.status(403).json({ success: false, error: 'Only admins or same-batch CRs can change approval status' })
    }

    const { title, category, date, imageUrl, rejectionReason } = req.body

    if (title)    photo.title = title
    if (category) photo.category = category
    if (date)     photo.date = new Date(date)

    if (req.file) {
      if (photo.imagePublicId) {
        await deleteFromCloudinary(photo.imagePublicId, 'image')
      }
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'electro-infinity/gallery',
        resource_type: 'image',
      })
      photo.imageUrl = result.url
      photo.imagePublicId = result.publicId
    } else if (imageUrl) {
      photo.imageUrl = imageUrl
    }

    const io = req.app.get('io')
    const ownerId = photo.uploadedBy?._id || photo.uploadedBy

    if (req.body.isApproved === true && isApprover) {
      photo.isApproved = true
      photo.approvedBy = req.user._id
      photo.approvedAt = new Date()
      photo.rejectionReason = ''
      if (ownerId && ownerId.toString() !== req.user._id.toString()) {
        await createNotification({
          recipient: ownerId,
          actor: req.user._id,
          type: 'gallery_approved',
          title: 'Your gallery photo was approved!',
          message: photo.title,
          link: `/gallery`,
          entityId: photo._id,
          entityType: 'Gallery',
          io,
        })
      }
    } else if (req.body.isApproved === false && isApprover) {
      photo.isApproved = false
      photo.approvedBy = null
      photo.approvedAt = null
      photo.rejectionReason = rejectionReason || ''
      if (ownerId && ownerId.toString() !== req.user._id.toString()) {
        await createNotification({
          recipient: ownerId,
          actor: req.user._id,
          type: 'gallery_rejected',
          title: 'Your gallery photo was not approved',
          message: photo.rejectionReason || photo.title,
          link: `/profile/${req.user._id}?tab=uploads`,
          entityId: photo._id,
          entityType: 'Gallery',
          io,
        })
      }
    } else if (rejectionReason !== undefined && isApprover) {
      photo.rejectionReason = rejectionReason
    }

    await photo.save()
    res.json({ success: true, data: photo })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── DELETE /api/gallery/:id ─────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const photo = await Gallery.findById(req.params.id)
      .populate('uploadedBy', 'batch role _id')
    if (!photo) return res.status(404).json({ success: false, error: 'Not found' })

    const isAuthor = photo.uploadedBy && photo.uploadedBy._id.toString() === req.user._id.toString()
    const allowed = isAuthor || canApprove(req.user, photo.uploadedBy)
    if (!allowed) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this photo' })
    }

    if (photo.imagePublicId) {
      await deleteFromCloudinary(photo.imagePublicId, 'image')
    }

    await photo.deleteOne()
    res.json({ success: true, message: 'Photo removed from gallery' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
