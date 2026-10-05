const express = require('express')
const Faculty = require('../models/Faculty')
const { protect, guard, optionalAuth } = require('../middleware/auth')
const logger = require('../utils/logger')

const router = express.Router()

// Fields a client may set on the faculty directory.
const FACULTY_FIELDS = ['name', 'designation', 'qualification', 'specialization', 'email', 'photo', 'isHOD']

function pickFacultyFields(body, isCreate) {
  const payload = {}
  for (const f of FACULTY_FIELDS) {
    if (body[f] !== undefined) payload[f] = body[f]
  }
  if (payload.name !== undefined) {
    payload.name = String(payload.name).trim().slice(0, 100)
    if (isCreate && !payload.name) {
      const err = new Error('name is required')
      err.status = 400
      throw err
    }
  }
  if (payload.designation !== undefined) payload.designation = String(payload.designation).trim().slice(0, 100)
  if (payload.qualification !== undefined) payload.qualification = String(payload.qualification).trim().slice(0, 100)
  if (payload.specialization !== undefined) payload.specialization = String(payload.specialization).trim().slice(0, 100)
  if (payload.email !== undefined) payload.email = String(payload.email).trim().slice(0, 100)
  if (payload.photo !== undefined) payload.photo = String(payload.photo).trim().slice(0, 500)
  if (payload.isHOD !== undefined) payload.isHOD = Boolean(payload.isHOD)
  return payload
}

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
    // Mass-assignment defense: whitelisted fields only.
    const payload = pickFacultyFields(req.body, true)
    if (!payload.designation || !payload.qualification) {
      return res.status(400).json({ success: false, error: 'Designation and qualification are required' })
    }
    const faculty = await Faculty.create(payload)
    logger.info({ event: 'faculty_directory_create', facultyId: faculty._id.toString(), adminId: req.user._id.toString() })
    res.status(201).json({ success: true, data: faculty })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message })
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// PUT /api/faculty/:id
router.put('/:id', protect, guard('super_admin', 'admin'), async (req, res) => {
  try {
    // Mass-assignment defense: whitelisted fields only.
    const payload = pickFacultyFields(req.body, false)
    const faculty = await Faculty.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true })
    if (!faculty) return res.status(404).json({ success: false, error: 'Not found' })
    logger.info({ event: 'faculty_directory_update', facultyId: faculty._id.toString(), adminId: req.user._id.toString() })
    res.json({ success: true, data: faculty })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message })
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
