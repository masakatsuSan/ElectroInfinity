const express = require('express')
const Achievement = require('../models/Achievement')
const { protect, guard, optionalAuth } = require('../middleware/auth')
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../utils/upload')
const { createNotification, createNotificationBulk } = require('../utils/notification')

const router = express.Router()

// ── GET /api/achievements ─────────────────────────────────────────────────
// Public approved achievements. Authenticated users see their own pending ones too.
// Admin sees all. Optional ?author=... filters by author.
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { author } = req.query
    const query = {}

    if (author) {
      query.author = author
    }

    if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
      // Admin sees everything
    } else if (req.user && author && author === req.user._id.toString()) {
      // Viewing own achievements: see approved + pending
      query.$or = [
        { isApproved: true },
        { author: req.user._id },
      ]
    } else if (req.user && !author) {
      // No author filter, authenticated user: see all approved + own pending
      query.$or = [
        { isApproved: true },
        { author: req.user._id },
      ]
    } else {
      // Public or viewing someone else's achievements: only approved
      query.isApproved = true
    }

    const achievements = await Achievement.find(query)
      .sort({ createdAt: -1 })
      .populate('author', 'name rollNumber batch role photo')

    res.json({ success: true, data: achievements })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── GET /api/achievements/:id ─────────────────────────────────────────────
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id)
      .populate('author', 'name rollNumber batch role photo')
    if (!achievement) return res.status(404).json({ success: false, error: 'Achievement not found' })

    // Privacy: public can see approved; author/admin can see pending
    if (!achievement.isApproved) {
      const isAuthor = req.user && achievement.author && achievement.author._id.toString() === req.user._id.toString()
      const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')
      if (!isAuthor && !isAdmin) {
        return res.status(403).json({ success: false, error: 'Achievement not approved yet' })
      }
    }

    res.json({ success: true, data: achievement })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── POST /api/achievements ─────────────────────────────────────────────────
// Authenticated users can post their own achievements (pending approval)
// Admin/Super_admin can post directly approved achievements
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    const { title, description, date, category, students } = req.body
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin' || req.user.role === 'cr'

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
      } else if (isAdmin) {
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
      isApproved: isAdmin,
      approvedBy: isAdmin ? req.user._id : null,
      students: students ? (typeof students === 'string' ? students.split(',').map(s => s.trim()).filter(Boolean) : students) : []
    })

    // Notify mentioned students
    if (achievement.students?.length > 0) {
      const io = req.app.get('io')
      const User = require('../models/User')
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

    // Notify admins about new user-submitted achievement for review
    if (!isAdmin) {
      const io = req.app.get('io')
      const User = require('../models/User')
      const admins = await User.find({
        role: { $in: ['admin', 'super_admin'] },
        _id: { $ne: req.user._id },
      }).select('_id')
      if (admins.length > 0) {
        await createNotificationBulk({
          recipients: admins.map(a => a._id.toString()),
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
// Admin can approve/reject/update any achievement
// Author can update their own pending achievement
router.patch('/:id', protect, upload.single('image'), async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id)
    if (!achievement) return res.status(404).json({ success: false, error: 'Not found' })

    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin'
    const isAuthor = achievement.author && achievement.author.toString() === req.user._id.toString()

    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this achievement' })
    }

    // Only admin can change approval status
    if (req.body.isApproved !== undefined && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Only admins can change approval status' })
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
    if (rejectionReason !== undefined) achievement.rejectionReason = rejectionReason

    if (req.body.isApproved === true) {
      achievement.isApproved = true
      achievement.approvedBy = req.user._id
      achievement.rejectionReason = ''
    } else if (req.body.isApproved === false && isAdmin) {
      achievement.isApproved = false
      achievement.rejectionReason = req.body.rejectionReason || ''
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
// Admin can delete any; author can delete their own pending achievement
router.delete('/:id', protect, async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id)
    if (!achievement) return res.status(404).json({ success: false, error: 'Not found' })

    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin'
    const isAuthor = achievement.author && achievement.author.toString() === req.user._id.toString()

    if (!isAdmin && !isAuthor) {
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
