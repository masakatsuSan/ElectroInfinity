const express = require('express')
const Gallery = require('../models/Gallery')
const { protect, guard, optionalAuth } = require('../middleware/auth')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const photos = await Gallery.find().sort({ date: -1 })
    res.json({ success: true, data: photos })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/', protect, guard('super_admin', 'admin'), async (req, res) => {
  try {
    const photo = await Gallery.create(req.body)
    res.status(201).json({ success: true, data: photo })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/:id', protect, guard('super_admin', 'admin'), async (req, res) => {
  try {
    const photo = await Gallery.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!photo) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: photo })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/:id', protect, guard('super_admin', 'admin'), async (req, res) => {
  try {
    const photo = await Gallery.findByIdAndDelete(req.params.id)
    if (!photo) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: {} })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
