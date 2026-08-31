const express = require('express')
const Achievement = require('../models/Achievement')
const { protect, guard, optionalAuth } = require('../middleware/auth')
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../utils/upload')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const achievements = await Achievement.find().sort({ date: -1 })
    res.json({ success: true, data: achievements })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id)
    if (!achievement) return res.status(404).json({ success: false, error: 'Achievement not found' })
    res.json({ success: true, data: achievement })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/', protect, guard('super_admin', 'admin'), upload.single('image'), async (req, res) => {
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

    const achievement = await Achievement.create({
      title: title || '',
      description: description || '',
      date: date ? new Date(date) : Date.now(),
      category: category || 'student',
      image,
      imagePublicId,
      students: students ? (typeof students === 'string' ? students.split(',').map(s => s.trim()).filter(Boolean) : students) : []
    })

    res.status(201).json({ success: true, data: achievement })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/:id', protect, guard('super_admin', 'admin'), upload.single('image'), async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id)
    if (!achievement) return res.status(404).json({ success: false, error: 'Not found' })

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
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/:id', protect, guard('super_admin', 'admin'), async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id)
    if (!achievement) return res.status(404).json({ success: false, error: 'Not found' })

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
