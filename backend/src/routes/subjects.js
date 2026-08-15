const express = require('express')
const Subject = require('../models/Subject')
const { protect, guard } = require('../middleware/auth')

const router = express.Router()

const DEFAULT_SUBJECTS = [
  { name: 'Electric Circuit Theory', code: 'ECT', batch: '2024-2028', semester: 3 },
  { name: 'Electrical Machines - II', code: 'EM-II', batch: '2024-2028', semester: 3 },
  { name: 'Digital Electronics', code: 'DE', batch: '2024-2028', semester: 3 },
  { name: 'Network Analysis', code: 'NA', batch: '2024-2028', semester: 3 },
  { name: 'Engineering Mathematics', code: 'Maths', batch: '2024-2028', semester: 3 },
  { name: 'ECT Laboratory', code: 'ECT Lab', batch: '2024-2028', semester: 3 },
  { name: 'EM Laboratory', code: 'EM Lab', batch: '2024-2028', semester: 3 },
  // Also seed for other batches
  { name: 'Power Systems - I', code: 'PS-I', batch: '2023-2027', semester: 5 },
  { name: 'Control Systems', code: 'CS', batch: '2023-2027', semester: 5 },
  { name: 'Microprocessors & Microcontrollers', code: 'MPMC', batch: '2023-2027', semester: 5 },
  { name: 'Power Electronics', code: 'PE', batch: '2023-2027', semester: 5 },
  { name: 'Advanced Control Engineering', code: 'ACE', batch: '2022-2026', semester: 7 },
  { name: 'Renewable Energy Systems', code: 'RES', batch: '2022-2026', semester: 7 },
]

const mongoose = require('mongoose')

// Auto seed default subjects if none exist
async function autoSeedDefaults() {
  try {
    if (mongoose.connection.readyState !== 1) return
    const count = await Subject.countDocuments()
    if (count === 0) {
      await Subject.insertMany(DEFAULT_SUBJECTS)
      console.log('⚡ Seeded default engineering subjects')
    }
  } catch (err) {
    // ignore
  }
}

mongoose.connection.on('connected', autoSeedDefaults)
if (mongoose.connection.readyState === 1) autoSeedDefaults()

// @route   GET /api/subjects
// @desc    Get subjects with optional batch filter
// @access  Public / Authenticated
router.get('/', async (req, res) => {
  try {
    const { batch, section, semester } = req.query
    const filter = {}
    if (batch) filter.batch = batch
    if (semester) filter.semester = Number(semester)
    if (section) {
      filter.$or = [{ section: '' }, { section }, { section: { $exists: false } }]
    }

    const subjects = await Subject.find(filter).sort({ code: 1, name: 1 })
    res.json({ success: true, count: subjects.length, data: subjects })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// @route   POST /api/subjects
// @desc    Create subject (Admin)
// @access  Private (Admin)
router.post('/', protect, guard('admin', 'super_admin'), async (req, res) => {
  try {
    const { name, code, batch, section, semester } = req.body
    if (!name || !code || !batch) {
      return res.status(400).json({ success: false, error: 'Name, code, and batch are required' })
    }

    const existing = await Subject.findOne({
      code: code.trim().toUpperCase(),
      batch: batch.trim(),
      section: (section || '').trim(),
    })
    if (existing) {
      return res.status(400).json({ success: false, error: 'Subject with this code already exists for this batch/section' })
    }

    const subject = await Subject.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      batch: batch.trim(),
      section: (section || '').trim(),
      semester: semester ? Number(semester) : 1,
    })

    res.status(201).json({ success: true, data: subject })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// @route   DELETE /api/subjects/:id
// @desc    Delete subject (Admin)
// @access  Private (Admin)
router.delete('/:id', protect, guard('admin', 'super_admin'), async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'Subject deleted' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
