const express = require('express')
const Faculty = require('../models/Faculty')
const { protect, guard, optionalAuth } = require('../middleware/auth')

const router = express.Router()

// GET /api/faculty
router.get('/', async (req, res) => {
  try {
    const faculty = await Faculty.find().sort({ isHOD: -1, createdAt: 1 })
    res.json({ success: true, data: faculty })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// POST /api/faculty
router.post('/', protect, guard('super_admin', 'admin'), async (req, res) => {
  try {
    const faculty = await Faculty.create(req.body)
    res.status(201).json({ success: true, data: faculty })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// PUT /api/faculty/:id
router.put('/:id', protect, guard('super_admin', 'admin'), async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!faculty) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: faculty })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// DELETE /api/faculty/:id
router.delete('/:id', protect, guard('super_admin', 'admin'), async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndDelete(req.params.id)
    if (!faculty) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: {} })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

module.exports = router
