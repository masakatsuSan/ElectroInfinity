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
          { visibility: 'GLOBAL' },
        ]
      }
    } else if (req.user && req.user.role === 'faculty') {
      // Faculty only see GLOBAL notices, notices for batches they teach,
      // or notices they themselves authored.
      const taughtBatches = [
        ...(req.user.assignedBatches || []),
        ...(req.user.teachingAssignments || []).map(a => a.batch),
      ].filter(Boolean)

      batchCondition = {
        $or: [
          { visibility: 'GLOBAL' },
          { visibility: 'BATCH', batchId: { $in: taughtBatches } },
          { postedBy: req.user._id },
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

// ─── GET /api/notices/faculty/mine ─────────────────────────────────────────
// Faculty-only — list notices authored by the logged-in faculty member
// (i.e. the "Notices I've sent" list shown on the faculty dashboard).
// Registered BEFORE /:id so the literal segment isn't swallowed by /:id.
router.get('/faculty/mine', protect, guard('faculty'), async (req, res) => {
  try {
    const notices = await Notice.find({ postedBy: req.user._id })
      .populate('postedBy', 'name role')
      .sort({ isPinned: -1, createdAt: -1 })

    res.json({
      success: true,
      count: notices.length,
      data: notices,
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
// Authenticated users can post notices — each role is scoped differently:
//  - faculty → BATCH only, restricted to batches they teach
//  - cr      → BATCH only, restricted to their own batch
//  - admin/super_admin → can choose GLOBAL or BATCH
router.post('/', protect, guard('cr', 'super_admin', 'admin', 'faculty'), async (req, res) => {
  try {
    if (req.user.role === 'faculty') {
      // Faculty can ONLY post to a batch they actually teach.
      // We ignore any visibility/batchId they send and re-derive it here so
      // the notice is always isolated to the correct batch of students.
      const taughtBatches = [
        ...(req.user.assignedBatches || []),
        ...(req.user.teachingAssignments || []).map(a => a.batch),
      ].filter(Boolean)

      const chosenBatch = (req.body.batchId || '').trim()
      if (!chosenBatch || !taughtBatches.includes(chosenBatch)) {
        return res.status(403).json({
          success: false,
          error: 'You can only post notices for batches you teach. Choose a valid class first.',
        })
      }

      // Destructure only the fields faculty are allowed to provide.
      // isPinned is deliberately excluded — only admin can pin.
      const {
        title, body, category, subject, date, time,
        expiresAt, attachmentUrl, attachmentName,
      } = req.body

      const notice = await Notice.create({
        title,
        body,
        category,
        subject,
        date: date ? new Date(date) : null,
        time,
        postedBy: req.user._id,
        batchId: chosenBatch,
        visibility: 'BATCH',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        attachmentUrl,
        attachmentName,
      })
      return res.status(201).json({ success: true, data: notice })
    }

    // CR / admin / super_admin path (existing behaviour)
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
// Admin can delete any; cr can only delete their own batch's; faculty can
// only delete notices they themselves authored.
router.delete('/:id', protect, guard('cr', 'super_admin', 'admin', 'faculty'), async (req, res) => {
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

    // Faculty can only delete their own notices
    if (
      req.user.role === 'faculty' &&
      String(notice.postedBy) !== String(req.user._id)
    ) {
      return res.status(403).json({ success: false, error: 'You can only delete notices you posted' })
    }

    await notice.deleteOne()
    res.json({ success: true, message: 'Notice deleted' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
