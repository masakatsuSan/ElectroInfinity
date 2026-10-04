const express = require('express')
const router = express.Router()
const PlacementStat = require('../models/PlacementStat')
const Recruiter = require('../models/Recruiter')
const PlacedStudent = require('../models/PlacedStudent')
const AlumniStory = require('../models/AlumniStory')
const CareerOpening = require('../models/CareerOpening')

/* ─── Public: Placement Stats ────────────────────────────────────────── */
router.get('/stats', async (req, res) => {
  try {
    const items = await PlacementStat.find({ published: true }).sort({ order: 1, createdAt: -1 })
    res.json({ success: true, data: items })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch stats' })
  }
})

/* ─── Public: Recruiters ─────────────────────────────────────────────── */
router.get('/recruiters', async (req, res) => {
  try {
    const items = await Recruiter.find({ published: true }).sort({ order: 1, createdAt: -1 })
    res.json({ success: true, data: items })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch recruiters' })
  }
})

/* ─── Public: Placed Students ───────────────────────────────────────── */
router.get('/placed-students', async (req, res) => {
  try {
    const { type, batchYear, page = 1, limit = 50 } = req.query
    const q = { published: true }
    if (type && ['placement', 'internship'].includes(type)) q.type = type
    if (batchYear) q.batchYear = batchYear
    const skip = (Math.max(parseInt(page) || 1, 1) - 1) * Math.max(parseInt(limit) || 50, 1)
    const [items, total] = await Promise.all([
      PlacedStudent.find(q).sort({ createdAt: -1 }).skip(skip).limit(Math.max(parseInt(limit) || 50, 1)),
      PlacedStudent.countDocuments(q),
    ])
    res.json({ success: true, data: items, total, page: parseInt(page) || 1, limit: parseInt(limit) || 50 })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch placed students' })
  }
})

/* ─── Public: Alumni Stories ─────────────────────────────────────────── */
router.get('/alumni', async (req, res) => {
  try {
    const items = await AlumniStory.find({ published: true }).sort({ order: 1, createdAt: -1 })
    res.json({ success: true, data: items })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch alumni stories' })
  }
})

/* ─── Public: Career Openings ────────────────────────────────────────── */
// Note: auto-hides expired open items on the public endpoint
router.get('/openings', async (req, res) => {
  try {
    const { type } = req.query
    const q = { published: true }
    if (type && ['job', 'internship', 'training'].includes(type)) q.type = type
    const now = new Date()
    q.$or = [
      { status: 'closed' },
      { status: 'open', deadline: { $gt: now } },
    ]
    const items = await CareerOpening.find(q).sort({ createdAt: -1 })
    res.json({ success: true, data: items })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch openings' })
  }
})

module.exports = router
