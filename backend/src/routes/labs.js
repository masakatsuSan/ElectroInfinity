const express = require('express')
const Lab = require('../models/Lab')
const { protect, guard, optionalAuth } = require('../middleware/auth')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const labs = await Lab.find().sort({ createdAt: 1 })
    res.json({ success: true, data: labs })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/', protect, guard('super_admin', 'admin'), async (req, res) => {
  try {
    const lab = await Lab.create(req.body)
    res.status(201).json({ success: true, data: lab })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/:id', protect, guard('super_admin', 'admin'), async (req, res) => {
  try {
    const lab = await Lab.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!lab) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: lab })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/:id', protect, guard('super_admin', 'admin'), async (req, res) => {
  try {
    const lab = await Lab.findByIdAndDelete(req.params.id)
    if (!lab) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: {} })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
