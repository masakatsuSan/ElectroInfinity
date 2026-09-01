const express = require('express')
const Gallery = require('../models/Gallery')
const { protect, guard } = require('../middleware/auth')
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../utils/upload')
const { createNotificationBulk } = require('../utils/notification')
const axios = require('axios')

const router = express.Router()

// ── GET /api/gallery ────────────────────────────────────────────────
// Public: only approved photos. Admin/CR: see all (including pending).
// ?pending=true forces all (for admin toggle).
router.get('/', async (req, res) => {
  try {
    const user = req.user
    const { pending } = req.query
    const query = {}

    const isReviewer = user && (user.role === 'admin' || user.role === 'super_admin' || user.role === 'cr')

    if (!isReviewer && pending !== 'true') {
      query.isApproved = true
    } else if (pending === 'true' && !isReviewer) {
      query.isApproved = true
    }

    const photos = await Gallery.find(query).sort({ date: -1, createdAt: -1 })
    res.json({ success: true, data: photos })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── GET /api/gallery/:id ────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const photo = await Gallery.findById(req.params.id)
    if (!photo) return res.status(404).json({ success: false, error: 'Not found' })

    // Privacy: non-admin cannot view pending uploads from others
    if (!photo.isApproved) {
      const user = req.user
      const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin' || user.role === 'cr')
      const isAuthor = user && photo.uploadedBy && photo.uploadedBy.toString() === user._id.toString()
      if (!isAdmin && !isAuthor) {
        return res.status(403).json({ success: false, error: 'Photo not approved yet' })
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
    if (!photo) return res.status(404).json({ success: false, error: 'Not found' })

    const response = await axios.get(photo.imageUrl, { responseType: 'stream' })
    res.setHeader('Content-Type', response.headers['content-type'])
    response.data.pipe(res)
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── POST /api/gallery ───────────────────────────────────────────────
// Any authenticated user can upload a gallery photo (pending admin approval)
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

    const photo = await Gallery.create({
      title: title || '',
      imageUrl: finalUrl,
      imagePublicId: finalPubId,
      category: category || 'campus',
      date: date ? new Date(date) : Date.now(),
      uploadedBy: req.user._id,
      isApproved: false,
    })

    // Notify admins/CRs about new gallery photo for review
    const io = req.app.get('io')
    const User = require('../models/User')
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

    res.status(201).json({ success: true, data: photo })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── PATCH /api/gallery/:id ───────────────────────────────────────────
// Admin/CR can approve photos. Authors can update their own pending uploads.
router.patch('/:id', protect, upload.single('image'), async (req, res) => {
  try {
    const photo = await Gallery.findById(req.params.id)
    if (!photo) return res.status(404).json({ success: false, error: 'Not found' })

    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin' || req.user.role === 'cr'
    const isAuthor = photo.uploadedBy && photo.uploadedBy.toString() === req.user._id.toString()

    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this photo' })
    }

    // Only admin/CR can change approval status
    if (req.body.isApproved !== undefined && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Only admins can change approval status' })
    }

    const { title, category, date, imageUrl } = req.body

    if (title)    photo.title = title
    if (category) photo.category = category
    if (date)     photo.date = new Date(date)

    // Replace the image if a new file was uploaded
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

    if (req.body.isApproved === true && isAdmin) {
      photo.isApproved = true
      photo.approvedBy = req.user._id
    }

    await photo.save()
    res.json({ success: true, data: photo })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── DELETE /api/gallery/:id ─────────────────────────────────────────
// Admin/CR can remove any photo. Authors can remove their own pending photo.
router.delete('/:id', protect, async (req, res) => {
  try {
    const photo = await Gallery.findById(req.params.id)
    if (!photo) return res.status(404).json({ success: false, error: 'Not found' })

    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin' || req.user.role === 'cr'
    const isAuthor = photo.uploadedBy && photo.uploadedBy.toString() === req.user._id.toString()

    if (!isAdmin && !isAuthor) {
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
