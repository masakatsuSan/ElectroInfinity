const express = require('express')
const Notice = require('../models/Notice')
const { protect, guard, optionalAuth } = require('../middleware/auth')

const router = express.Router()

// ─── GET /api/notices ──────────────────────────────────────────────────────
// Public — anyone can read notices
// Supports ?category=exam&page=1&limit=10
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query

    // Build filter object
    const filter = {}
    if (category) filter.category = category

    const expireCondition = {
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } },
      ]
    }

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

    filter.$and = [expireCondition]
    if (Object.keys(batchCondition).length > 0) {
      filter.$and.push(batchCondition)
    }

    const total = await Notice.countDocuments(filter)

    const notices = await Notice.find(filter)
      .populate('postedBy', 'name role')   // bring in the poster's name
      .sort({ isPinned: -1, createdAt: -1 }) // pinned first, then newest
      .skip((page - 1) * limit)
      .limit(Number(limit))

    res.json({
      success: true,
      data: notices,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─── GET /api/notices/:id ──────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id).populate('postedBy', 'name')
    if (!notice) return res.status(404).json({ success: false, error: 'Notice not found' })
    res.json({ success: true, data: notice })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─── POST /api/notices ─────────────────────────────────────────────────────
// Only CR or admin can post notices
router.post('/', protect, guard('cr', 'super_admin', 'admin'), async (req, res) => {
  try {
    const visibility = req.user.role === 'admin' || req.user.role === 'super_admin' ? (req.body.visibility || 'BATCH') : 'BATCH'
    const batchId = req.user.role === 'cr' ? req.user.batch : (req.body.batchId || '')

    const notice = await Notice.create({
      ...req.body,
      postedBy: req.user._id,
      batchId,
      visibility
    })
    res.status(201).json({ success: true, data: notice })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─── PATCH /api/notices/:id/pin ────────────────────────────────────────────
// Only admin can pin/unpin
router.patch('/:id/pin', protect, guard('super_admin', 'admin'), async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id)
    if (!notice) return res.status(404).json({ success: false, error: 'Not found' })

    notice.isPinned = !notice.isPinned
    await notice.save()

    res.json({ success: true, data: notice })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─── DELETE /api/notices/:id ───────────────────────────────────────────────
// Admin can delete any; cr can only delete their own
router.delete('/:id', protect, guard('cr', 'super_admin', 'admin'), async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id)
    if (!notice) return res.status(404).json({ success: false, error: 'Not found' })

    // CR can only delete notices for their own batch
    if (
      req.user.role === 'cr' &&
      notice.batchId !== req.user.batch
    ) {
      return res.status(403).json({ success: false, error: 'Can only delete your own batch notices' })
    }

    await notice.deleteOne()
    res.json({ success: true, message: 'Notice deleted' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
