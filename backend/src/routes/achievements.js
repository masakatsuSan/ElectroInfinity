const express = require('express')
const Achievement = require('../models/Achievement')
const { protect, guard, optionalAuth } = require('../middleware/auth')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const achievements = await Achievement.find().sort({ date: -1 })
    res.json({ success: true, data: achievements })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/', protect, guard('super_admin', 'admin'), async (req, res) => {
  try {
    const achievement = await Achievement.create(req.body)
    res.status(201).json({ success: true, data: achievement })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/:id', protect, guard('super_admin', 'admin'), async (req, res) => {
  try {
    const achievement = await Achievement.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!achievement) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: achievement })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/:id', protect, guard('super_admin', 'admin'), async (req, res) => {
  try {
    const achievement = await Achievement.findByIdAndDelete(req.params.id)
    if (!achievement) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: {} })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
