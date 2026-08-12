const express = require('express')
const Placement = require('../models/Placement')
const { protect, guard, optionalAuth } = require('../middleware/auth')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const type = req.query.type
    let filter = {}
    if (type) {
      filter.type = type
    }
    const placements = await Placement.find(filter).sort({ createdAt: -1 })
    res.json({ success: true, data: placements })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/', protect, guard('super_admin', 'admin'), async (req, res) => {
  try {
    const placement = await Placement.create(req.body)
    res.status(201).json({ success: true, data: placement })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/:id', protect, guard('super_admin', 'admin'), async (req, res) => {
  try {
    const placement = await Placement.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!placement) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: placement })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/:id', protect, guard('super_admin', 'admin'), async (req, res) => {
  try {
    const placement = await Placement.findByIdAndDelete(req.params.id)
    if (!placement) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: {} })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
