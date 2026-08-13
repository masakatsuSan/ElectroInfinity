const express = require('express')
const Event = require('../models/Event')
const { protect, guard, optionalAuth } = require('../middleware/auth')
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../utils/upload')

const router = express.Router()

// ── GET /api/events ────────────────────────────────────────────────────────
// Public — returns upcoming events first, then past
router.get('/', optionalAuth, async (req, res) => {
  try {
    let filter = {}

    // Batch Isolation Logic
    let batchCondition = {}
    if (req.user && (req.user.role === 'student' || req.user.role === 'cr')) {
      batchCondition = {
        $or: [
          { visibility: 'BATCH', batchId: req.user.batch },
          { visibility: 'GLOBAL' }
        ]
      }
    } else if (!req.user) {
      batchCondition = { visibility: 'GLOBAL' }
    }

    if (Object.keys(batchCondition).length > 0) {
      filter = { ...batchCondition }
    }

    const events = await Event.find(filter)
      .sort({ date: -1 })
      .populate('createdBy', 'name')

    res.json({ success: true, data: events })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── GET /api/events/:id ────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' })
    res.json({ success: true, data: event })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── POST /api/events ───────────────────────────────────────────────────────
// Create event with optional banner image
router.post(
  '/',
  protect,
  guard('cr', 'super_admin', 'admin'),
  upload.single('banner'),
  async (req, res) => {
    try {
      const { title, type, description, date, venue, registrationLink } = req.body

      let bannerUrl = '', bannerPublicId = ''

      // Upload banner if one was attached
      if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer, {
          folder: 'electro-infinity/events',
          resource_type: 'image',
        })
        bannerUrl = result.url
        bannerPublicId = result.publicId
      }

      const visibility = req.user.role === 'admin' || req.user.role === 'super_admin' ? (req.body.visibility || 'BATCH') : 'BATCH'
      const batchId = req.user.role === 'cr' ? req.user.batch : (req.body.batchId || '')

      const event = await Event.create({
        title, type, description, date, venue, registrationLink,
        bannerUrl, bannerPublicId,
        createdBy: req.user._id,
        batchId,
        visibility
      })

      res.status(201).json({ success: true, data: event })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  }
)

// ── PATCH /api/events/:id ──────────────────────────────────────────────────
router.patch('/:id', protect, guard('cr', 'super_admin', 'admin'), async (req, res) => {
  try {
    let event = await Event.findById(req.params.id)
    if (!event) return res.status(404).json({ success: false, error: 'Not found' })
    
    // CR can only patch their own batch's events
    if (req.user.role === 'cr' && event.batchId !== req.user.batch) {
        return res.status(403).json({ success: false, error: 'Not authorized' })
    }
    
    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    })
    res.json({ success: true, data: event })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── DELETE /api/events/:id ─────────────────────────────────────────────────
router.delete('/:id', protect, guard('cr', 'super_admin', 'admin'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) return res.status(404).json({ success: false, error: 'Not found' })

    // CR can only delete their own batch's events
    if (req.user.role === 'cr' && event.batchId !== req.user.batch) {
        return res.status(403).json({ success: false, error: 'Not authorized' })
    }

    if (event.bannerPublicId) {
      await deleteFromCloudinary(event.bannerPublicId)
    }

    await event.deleteOne()
    res.json({ success: true, message: 'Event deleted' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
