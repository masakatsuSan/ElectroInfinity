const express = require('express')
const router = express.Router()
const Notification = require('../models/Notification')
const { protect } = require('../middleware/auth')
const { markAsRead, markAllAsRead, getUnreadCount, formatTimeAgo } = require('../utils/notification')

function getIo(req) {
  return req.app.get('io')
}

// ── GET /api/notifications ──────────────────────────────────────────────
// List notifications for the logged-in user
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = 'false' } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const query = { recipient: req.user._id, isArchived: false }
    if (unreadOnly === 'true') query.isRead = false

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('actor', 'name photo rollNumber batch role')
        .lean(),
      Notification.countDocuments(query),
      getUnreadCount(req.user._id),
    ])

    const formatted = notifications.map((n) => ({
      ...n,
      timeAgo: formatTimeAgo(n.createdAt),
    }))

    res.json({
      success: true,
      data: formatted,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── GET /api/notifications/unread-count ─────────────────────────────────
// Get just the unread count (for badge)
router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await getUnreadCount(req.user._id)
    res.json({ success: true, data: { count } })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── PUT /api/notifications/:id/read ─────────────────────────────────────
// Mark a single notification as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await markAsRead(req.params.id, req.user._id)
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' })
    }
    const unreadCount = await getUnreadCount(req.user._id)
    res.json({ success: true, data: { notification, unreadCount } })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── PUT /api/notifications/mark-all-read ────────────────────────────────
// Mark all notifications as read
router.put('/mark-all-read', protect, async (req, res) => {
  try {
    await markAllAsRead(req.user._id)
    res.json({ success: true, data: { unreadCount: 0 } })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── DELETE /api/notifications/:id ───────────────────────────────────────
// Delete a notification
router.delete('/:id', protect, async (req, res) => {
  try {
    const result = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    })
    if (!result) {
      return res.status(404).json({ success: false, error: 'Notification not found' })
    }
    const unreadCount = await getUnreadCount(req.user._id)
    res.json({ success: true, data: { unreadCount } })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
