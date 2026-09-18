const express = require('express')
const Achievement = require('../models/Achievement')
const User = require('../models/User')
const { protect, guard, optionalAuth } = require('../middleware/auth')
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../utils/upload')
const { createNotification, createNotificationBulk } = require('../utils/notification')

const router = express.Router()

// ── GET /api/achievements ─────────────────────────────────────────────────
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { author } = req.query
    const user = req.user

    const query = {}

    if (user && (user.role === 'admin' || user.role === 'super_admin')) {
      // Admin sees everything
    } else if (author) {
      query.author = author
    }

    const achievements = await Achievement.find(query)
      .sort({ createdAt: -1 })
      .populate('author', 'name rollNumber batch role photo profile.profileVisibility')
      .lean()

    res.json({ success: true, data: achievements })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// ── GET /api/achievements/:id ─────────────────────────────────────────────
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id)
      .populate('author', 'name rollNumber batch role photo profile.profileVisibility')
    if (!achievement) return res.status(404).json({ success: false, error: 'Achievement not found' })

    res.json({ success: true, data: achievement })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// ── POST /api/achievements ─────────────────────────────────────────────────
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    const { title, description, date, category, students } = req.body

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
      } else if (req.user.role === 'admin' || req.user.role === 'super_admin' || req.user.role === 'cr') {
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
      isApproved: true,
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

    res.status(201).json({ success: true, data: achievement })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// ── PATCH /api/achievements/:id ─────────────────────────────────────────────
router.patch('/:id', protect, upload.single('image'), async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id)
      .populate('author', 'name rollNumber batch role _id')
    if (!achievement) return res.status(404).json({ success: false, error: 'Not found' })

    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin'
    const isAuthor = achievement.author && achievement.author._id.toString() === req.user._id.toString()
    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this achievement' })
    }

    const { title, description, date, category, students } = req.body

    if (title)       achievement.title = title
    if (description) achievement.description = description
    if (date)        achievement.date = new Date(date)
    if (category)    achievement.category = category
    if (students) {
      achievement.students = typeof students === 'string'
        ? students.split(',').map(s => s.trim()).filter(Boolean)
        : students
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
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// ── DELETE /api/achievements/:id ───────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id)
      .populate('author', 'batch role _id')
    if (!achievement) return res.status(404).json({ success: false, error: 'Not found' })

    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin'
    const isAuthor = achievement.author && achievement.author._id.toString() === req.user._id.toString()
    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this achievement' })
    }

    if (achievement.imagePublicId) {
      await deleteFromCloudinary(achievement.imagePublicId, 'image')
    }

    await achievement.deleteOne()
    res.json({ success: true, message: 'Achievement removed' })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

module.exports = router
