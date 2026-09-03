const express = require('express')
const Achievement = require('../models/Achievement')
const User = require('../models/User')
const { protect, guard, optionalAuth } = require('../middleware/auth')
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../utils/upload')
const { createNotification, createNotificationBulk } = require('../utils/notification')
const { canApprove } = require('../utils/canApprove')

const router = express.Router()

const TEASER_LIMIT = 6

function buildAchievementTeaser(item) {
  const author = item.author
  return {
    _id: item._id,
    kind: 'achievement',
    title: item.title,
    category: item.category,
    createdAt: item.createdAt,
    date: item.date,
    isApproved: false,
    isPendingTeaser: true,
    author: author && typeof author === 'object'
      ? {
          _id: author._id,
          name: author.name,
          photo: author.photo,
          rollNumber: author.rollNumber,
          batch: author.batch,
          role: author.role,
          profileVisibility: author.profile?.profileVisibility || 'public',
        }
      : author,
  }
}

// ── GET /api/achievements ─────────────────────────────────────────────────
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { author, teasers } = req.query
    const user = req.user

    if (teasers === 'true') {
      const recent = await Achievement.find({ isApproved: false })
        .sort({ createdAt: -1 })
        .limit(TEASER_LIMIT)
        .populate('author', 'name photo rollNumber batch role profile.profileVisibility')
      return res.json({ success: true, data: [], pendingTeasers: recent.map(buildAchievementTeaser) })
    }

    const query = {}

    if (user && (user.role === 'admin' || user.role === 'super_admin')) {
      // Admin sees everything
    } else if (user && user.role === 'cr') {
      // CR sees all approved + own pending + same-batch pending (so they can review)
      query.$or = [
        { isApproved: true },
        { author: user._id },
      ]
    } else if (user && author && author === user._id.toString()) {
      query.$or = [
        { isApproved: true },
        { author: user._id },
      ]
    } else if (user) {
      query.$or = [
        { isApproved: true },
        { author: user._id },
      ]
    } else {
      query.isApproved = true
    }

    if (author) {
      query.author = author
    }

    const achievements = await Achievement.find(query)
      .sort({ createdAt: -1 })
      .populate('author', 'name rollNumber batch role photo profile.profileVisibility')

    let pendingTeasers = []
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      const recentPending = await Achievement.find({ isApproved: false })
        .sort({ createdAt: -1 })
        .limit(TEASER_LIMIT)
        .populate('author', 'name photo rollNumber batch role profile.profileVisibility')
      pendingTeasers = recentPending.map(buildAchievementTeaser)
    }

    res.json({ success: true, data: achievements, pendingTeasers })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── GET /api/achievements/:id ─────────────────────────────────────────────
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id)
      .populate('author', 'name rollNumber batch role photo profile.profileVisibility')
    if (!achievement) return res.status(404).json({ success: false, error: 'Achievement not found' })

    if (!achievement.isApproved) {
      const user = req.user
      const isAuthor = user && achievement.author && achievement.author._id.toString() === user._id.toString()
      const allowed = isAuthor || canApprove(user, achievement.author)
      if (!allowed) {
        return res.json({ success: true, data: buildAchievementTeaser(achievement) })
      }
    }

    res.json({ success: true, data: achievement })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── POST /api/achievements ─────────────────────────────────────────────────
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    const { title, description, date, category, students } = req.body
    const isReviewer = req.user.role === 'admin' || req.user.role === 'super_admin' || req.user.role === 'cr'

    let image = ''
    let imagePublicId = ''

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'electro-infinity/achievements',
        resource_type: 'image',
      })
      image = result.url
      imagePublicId = result.publicId
    }

    let finalCategory = category
    if (!finalCategory) {
      if (req.user.role === 'faculty') {
        finalCategory = 'faculty'
      } else if (isReviewer) {
        finalCategory = 'awards'
      } else {
        finalCategory = 'student'
      }
    }

    const achievement = await Achievement.create({
      title: title || '',
      description: description || '',
      date: date ? new Date(date) : Date.now(),
      category: finalCategory,
      image,
      imagePublicId,
      author: req.user._id,
      isApproved: isReviewer,
      approvedBy: isReviewer ? req.user._id : null,
      approvedAt: isReviewer ? new Date() : null,
      students: students ? (typeof students === 'string' ? students.split(',').map(s => s.trim()).filter(Boolean) : students) : []
    })

    if (achievement.students?.length > 0) {
      const io = req.app.get('io')
      const nameQueries = achievement.students.map(s => ({
        $or: [
          { name: { $regex: s, $options: 'i' } },
          { rollNumber: { $regex: s, $options: 'i' } },
        ]
      }))
      const mentionedUsers = await User.find({ $or: nameQueries, isActive: true }).select('_id')
      const recipientIds = mentionedUsers.map(u => u._id.toString())
      if (recipientIds.length > 0) {
        await createNotificationBulk({
          recipients: recipientIds,
          actor: req.user._id,
          type: 'achievement',
          title: `New achievement: ${achievement.title}`,
          message: achievement.description?.substring(0, 100) || '',
          link: '/achievements',
          entityId: achievement._id,
          entityType: 'Achievement',
          io,
        })
      }
    }

    if (!isReviewer) {
      const io = req.app.get('io')
      const reviewers = await User.find({
        role: { $in: ['admin', 'super_admin', 'cr'] },
        _id: { $ne: req.user._id },
      }).select('_id')
      if (reviewers.length > 0) {
        await createNotificationBulk({
          recipients: reviewers.map(a => a._id.toString()),
          actor: req.user._id,
          type: 'achievement_submitted',
          title: `New achievement submitted for review`,
          message: achievement.title,
          link: `/achievements/${achievement._id}`,
          entityId: achievement._id,
          entityType: 'Achievement',
          io,
        })
      }
    }

    res.status(201).json({ success: true, data: achievement })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── PATCH /api/achievements/:id ─────────────────────────────────────────────
router.patch('/:id', protect, upload.single('image'), async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id)
      .populate('author', 'name rollNumber batch role _id')
    if (!achievement) return res.status(404).json({ success: false, error: 'Not found' })

    const isAuthor = achievement.author && achievement.author._id.toString() === req.user._id.toString()
    const isApprover = canApprove(req.user, achievement.author)

    if (!isApprover && !isAuthor) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this achievement' })
    }

    if (req.body.isApproved !== undefined && !isApprover) {
      return res.status(403).json({ success: false, error: 'Only admins or same-batch CRs can change approval status' })
    }

    const { title, description, date, category, students, rejectionReason } = req.body

    if (title)       achievement.title = title
    if (description) achievement.description = description
    if (date)        achievement.date = new Date(date)
    if (category)    achievement.category = category
    if (students) {
      achievement.students = typeof students === 'string'
        ? students.split(',').map(s => s.trim()).filter(Boolean)
        : students
    }

    const io = req.app.get('io')
    const ownerId = achievement.author?._id || achievement.author

    if (req.body.isApproved === true && isApprover) {
      achievement.isApproved = true
      achievement.approvedBy = req.user._id
      achievement.approvedAt = new Date()
      achievement.rejectionReason = ''
      if (ownerId && ownerId.toString() !== req.user._id.toString()) {
        await createNotification({
          recipient: ownerId,
          actor: req.user._id,
          type: 'achievement_approved',
          title: 'Your achievement was approved!',
          message: achievement.title,
          link: '/achievements',
          entityId: achievement._id,
          entityType: 'Achievement',
          io,
        })
      }
    } else if (req.body.isApproved === false && isApprover) {
      achievement.isApproved = false
      achievement.approvedBy = null
      achievement.approvedAt = null
      achievement.rejectionReason = rejectionReason || ''
      if (ownerId && ownerId.toString() !== req.user._id.toString()) {
        await createNotification({
          recipient: ownerId,
          actor: req.user._id,
          type: 'achievement_rejected',
          title: 'Your achievement was not approved',
          message: achievement.rejectionReason || achievement.title,
          link: `/profile/${req.user._id}?tab=uploads`,
          entityId: achievement._id,
          entityType: 'Achievement',
          io,
        })
      }
    } else if (rejectionReason !== undefined && isApprover) {
      achievement.rejectionReason = rejectionReason
    }

    if (req.file) {
      if (achievement.imagePublicId) {
        await deleteFromCloudinary(achievement.imagePublicId, 'image')
      }
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'electro-infinity/achievements',
        resource_type: 'image',
      })
      achievement.image = result.url
      achievement.imagePublicId = result.publicId
    }

    await achievement.save()
    res.json({ success: true, data: achievement })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── DELETE /api/achievements/:id ───────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id)
      .populate('author', 'batch role _id')
    if (!achievement) return res.status(404).json({ success: false, error: 'Not found' })

    const isAuthor = achievement.author && achievement.author._id.toString() === req.user._id.toString()
    const allowed = isAuthor || canApprove(req.user, achievement.author)
    if (!allowed) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this achievement' })
    }

    if (achievement.imagePublicId) {
      await deleteFromCloudinary(achievement.imagePublicId, 'image')
    }

    await achievement.deleteOne()
    res.json({ success: true, message: 'Achievement removed' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
