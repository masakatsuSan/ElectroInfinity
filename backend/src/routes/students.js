const express = require('express')
const User    = require('../models/User')
const { protect, guard } = require('../middleware/auth')
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../utils/upload')

const router = express.Router()

// @route   GET /api/students/batch/:batch
// @desc    Get all students in a batch
// @access  Private (CR, Admin)
router.get('/batch/:batch', protect, guard('cr', 'super_admin', 'admin'), async (req, res) => {
  try {
    const students = await User.find({ batch: req.params.batch, role: { $in: ['student', 'cr'] } })
      .select('name rollNumber email batch')
      .sort({ rollNumber: 1 })
    res.json({ success: true, count: students.length, data: students })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// ── POST /api/students/add ─────────────────────────────────────────────────
// Admin adds a single student — no password set yet
router.post('/add', protect, guard('super_admin', 'admin'), async (req, res) => {
  try {
    const { name, rollNumber, email, batch, semester, regNumber } = req.body

    if (!name || !rollNumber) {
      return res.status(400).json({ success: false, error: 'Name and roll number are required' })
    }

    // Check duplicate roll number
    const existing = await User.findOne({ rollNumber: rollNumber.toUpperCase() })
    if (existing) {
      return res.status(400).json({ success: false, error: `Roll number ${rollNumber} already exists` })
    }

    const student = await User.create({
      name,
      rollNumber: rollNumber.toUpperCase(),
      email:      email || '',
      regNumber:  regNumber || '',
      batch:      batch || '',
      semester:   semester ? Number(semester) : 1,
      role:       'student',
      isActivated: false,   // student must activate themselves
    })

    res.status(201).json({ success: true, data: student })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── POST /api/students/bulk-import ────────────────────────────────────────
// Admin uploads CSV — creates all students at once
// CSV format: rollno,name,email,batch,semester
router.post('/bulk-import', protect, guard('super_admin', 'admin'), async (req, res) => {
  try {
    const { students } = req.body
    // students is an array parsed from CSV on the frontend before sending
    // Minimum required: rollNumber + email (from Google Form / WhatsApp data)
    // Optional: name, batch, semester, regNumber
    // [ { rollNumber, email, name?, batch?, semester? }, ... ]

    if (!students?.length) {
      return res.status(400).json({ success: false, error: 'No student data provided' })
    }

    const results = { created: 0, skipped: 0, errors: [] }

    for (const s of students) {
      if (!s.rollNumber) {
        results.errors.push(`Missing roll number: ${JSON.stringify(s)}`)
        continue
      }
      // If name not in CSV, use roll number as placeholder — admin can update later
      if (!s.name) s.name = s.rollNumber

      const exists = await User.findOne({ rollNumber: s.rollNumber.toUpperCase() })
      if (exists) {
        results.skipped++
        continue
      }

      await User.create({
        name:        s.name,
        rollNumber:  s.rollNumber.toUpperCase(),
        email:       s.email || '',
        regNumber:   s.regNumber || '',
        batch:       s.batch || '',
        semester:    s.semester ? Number(s.semester) : 1,
        role:        'student',
        isActivated: false,
      })
      results.created++
    }

    res.json({
      success: true,
      message: `Created ${results.created}, skipped ${results.skipped} duplicates`,
      results,
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── GET /api/students ─────────────────────────────────────────────────────
// Admin — list all students and CRs, optional ?batch=2024-2028&semester=3
router.get('/', protect, guard('super_admin', 'admin'), async (req, res) => {
  try {
    const { batch, semester } = req.query
    const filter = { role: { $in: ['student', 'cr'] } }
    if (batch)    filter.batch    = batch
    if (semester) filter.semester = Number(semester)

    const students = await User.find(filter)
      .select('-password')
      .sort({ batch: -1, name: 1 })

    const normalized = students.map(student => ({
      ...student.toObject(),
      isVerified: Boolean(student.isVerified ?? student.isActivated),
      isActivated: Boolean(student.isVerified ?? student.isActivated),
    }))

    res.json({ success: true, data: normalized })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// @route   PATCH /api/students/:id/role
// @desc    Promote or demote a student to/from CR role
router.patch('/:id/role', protect, guard('super_admin', 'admin'), async (req, res) => {
  try {
    const { role } = req.body
    if (!role || !['student', 'cr'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Role must be either student or cr' })
    }

    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }

    user.role = role
    await user.save()

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        role: user.role,
        batch: user.batch,
      },
      message: user.role === 'cr' ? 'Student promoted to CR successfully' : 'CR privileges removed successfully',
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── GET /api/students/batches ─────────────────────────────────────────────
router.get('/batches', protect, guard('super_admin', 'admin'), async (req, res) => {
  try {
    const batches = await User.distinct('batch', { role: 'student', batch: { $ne: '' } })
    res.json({ success: true, data: batches.sort().reverse() })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── DELETE /api/students/:id ──────────────────────────────────────────────
router.delete('/:id', protect, guard('super_admin', 'admin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'Student removed' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── PATCH /api/students/me/photo ─────────────────────────────────────────
router.patch('/me/photo', protect, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No photo uploaded' })

    const { url } = await uploadToCloudinary(req.file.buffer, {
      folder: 'electro-infinity/avatars',
      transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }],
    })

    const user = await User.findByIdAndUpdate(
      req.user._id, { photo: url }, { new: true }
    ).select('-password')

    res.json({ success: true, data: user })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
