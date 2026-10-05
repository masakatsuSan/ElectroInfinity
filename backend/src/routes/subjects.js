const express = require('express')
const mongoose = require('mongoose')
const Subject = require('../models/Subject')
const { protect, guard, optionalAuth } = require('../middleware/auth')

const router = express.Router()

const DEFAULT_SUBJECTS = [
  { name: 'Mathematics-I', code: 'BS-M 101', batch: '', section: '', semester: 1, credits: 4 },
  { name: 'Physics-I', code: 'BS-P 101', batch: '', section: '', semester: 1, credits: 4 },
  { name: 'Programming in C', code: 'ES-CS 101', batch: '', section: '', semester: 1, credits: 3 },
  { name: 'Engineering Drawing', code: 'ES-ME 101', batch: '', section: '', semester: 1, credits: 3 },
  { name: 'Basic Electrical Engineering', code: 'PC-EE 101', batch: '', section: '', semester: 1, credits: 3 },
  { name: 'Mathematics-II', code: 'BS-M 102', batch: '', section: '', semester: 2, credits: 4 },
  { name: 'Physics-II', code: 'BS-P 102', batch: '', section: '', semester: 2, credits: 4 },
  { name: 'Object Oriented Programming', code: 'ES-CS 102', batch: '', section: '', semester: 2, credits: 3 },
  { name: 'Basic Electronics Engineering', code: 'PC-EE 102', batch: '', section: '', semester: 2, credits: 3 },
  { name: 'Environmental Science', code: 'MC-EE 102', batch: '', section: '', semester: 2, credits: 0 },
  { name: 'Electric Circuit Theory', code: 'PC-EE 301', batch: '2024-2028', section: '', semester: 3, credits: 4 },
  { name: 'Analog Electronics', code: 'PC-EE 302', batch: '2024-2028', section: '', semester: 3, credits: 3 },
  { name: 'Electromagnetic Field Theory', code: 'PC-EE 303', batch: '2024-2028', section: '', semester: 3, credits: 3 },
  { name: 'Engineering Mechanics', code: 'ES-ME 301', batch: '2024-2028', section: '', semester: 3, credits: 3 },
  { name: 'Mathematics-III', code: 'BS-M 301', batch: '2024-2028', section: '', semester: 3, credits: 3 },
  { name: 'Biology for Engineers', code: 'BS-EE301', batch: '2024-2028', section: '', semester: 3, credits: 3 },
  { name: 'Indian Constitution', code: 'MC-EE 301', batch: '2024-2028', section: '', semester: 3, credits: 0 },
  { name: 'Electric Circuit Theory Lab', code: 'PC-EE 391', batch: '2024-2028', section: '', semester: 3, credits: 1 },
  { name: 'Analog Electronics Lab', code: 'PC-EE 392', batch: '2024-2028', section: '', semester: 3, credits: 1 },
  { name: 'Numerical Methods Lab', code: 'PC-CS 391', batch: '2024-2028', section: '', semester: 3, credits: 1 },
  { name: 'Electric Machine-I', code: 'PC-EE 401', batch: '2024-2028', section: '', semester: 4, credits: 3 },
  { name: 'Digital Electronics', code: 'PC-EE 402', batch: '2024-2028', section: '', semester: 4, credits: 3 },
  { name: 'Electrical & Electronics Measurement', code: 'PC-EE 403', batch: '2024-2028', section: '', semester: 4, credits: 3 },
  { name: 'Thermal Power Engineering', code: 'ES-EE 401', batch: '2024-2028', section: '', semester: 4, credits: 3 },
  { name: 'Values and Ethics in Profession', code: 'HM-EE401', batch: '2024-2028', section: '', semester: 4, credits: 3 },
  { name: 'Environmental Science', code: 'MC-EE401', batch: '2024-2028', section: '', semester: 4, credits: 0 },
  { name: 'Electric Machine-I Lab', code: 'PC-EE 491', batch: '2024-2028', section: '', semester: 4, credits: 1 },
  { name: 'Digital Electronics Lab', code: 'PC-EE 492', batch: '2024-2028', section: '', semester: 4, credits: 1 },
  { name: 'Electrical & Electronic Measurement Lab', code: 'PC-EE 493', batch: '2024-2028', section: '', semester: 4, credits: 1 },
  { name: 'Thermal Power Engineering Lab', code: 'ES-ME 491', batch: '2024-2028', section: '', semester: 4, credits: 1 },
  { name: 'Electric Machine-II', code: 'PC-EE 501', batch: '2024-2028', section: '', semester: 5, credits: 3 },
  { name: 'Power System-I', code: 'PC-EE 502', batch: '2024-2028', section: '', semester: 5, credits: 3 },
  { name: 'Control System', code: 'PC-EE 503', batch: '2024-2028', section: '', semester: 5, credits: 3 },
  { name: 'Power Electronics', code: 'PC-EE 504', batch: '2024-2028', section: '', semester: 5, credits: 3 },
  { name: 'Professional Elective I', code: 'PE-EE 501', batch: '2024-2028', section: '', semester: 5, credits: 3 },
  { name: 'Open Elective I', code: 'OE-EE 501', batch: '2024-2028', section: '', semester: 5, credits: 3 },
  { name: 'Electric Machine-II Lab', code: 'PC-EE 591', batch: '2024-2028', section: '', semester: 5, credits: 1 },
  { name: 'Power System-I Lab', code: 'PC-EE 592', batch: '2024-2028', section: '', semester: 5, credits: 1 },
  { name: 'Control System Lab', code: 'PC-EE 593', batch: '2024-2028', section: '', semester: 5, credits: 1 },
  { name: 'Power Electronics Lab', code: 'PC-EE 594', batch: '2024-2028', section: '', semester: 5, credits: 1 },
  { name: 'Power System-II', code: 'PC-EE 601', batch: '2024-2028', section: '', semester: 6, credits: 3 },
  { name: 'Microprocessor & Microcontroller', code: 'PC-EE 602', batch: '2024-2028', section: '', semester: 6, credits: 3 },
  { name: 'Professional Elective II', code: 'PE-EE 601', batch: '2024-2028', section: '', semester: 6, credits: 3 },
  { name: 'Professional Elective III', code: 'PE-EE 602', batch: '2024-2028', section: '', semester: 6, credits: 3 },
  { name: 'Open Elective II', code: 'OE-EE 601', batch: '2024-2028', section: '', semester: 6, credits: 3 },
  { name: 'Economics for Engineers', code: 'HM-EE 601', batch: '2024-2028', section: '', semester: 6, credits: 3 },
  { name: 'Power System-II Lab', code: 'PC-EE 691', batch: '2024-2028', section: '', semester: 6, credits: 1 },
  { name: 'Microprocessor & Microcontroller Lab', code: 'PC-EE 692', batch: '2024-2028', section: '', semester: 6, credits: 1 },
  { name: 'Electrical & Electronic Design Lab', code: 'PC-EE 681', batch: '2024-2028', section: '', semester: 6, credits: 3 },
  { name: 'Electric Drive', code: 'PC-EE 701', batch: '2024-2028', section: '', semester: 7, credits: 3 },
  { name: 'Professional Elective IV', code: 'PE-EE 701', batch: '2024-2028', section: '', semester: 7, credits: 3 },
  { name: 'Open Elective III', code: 'OE-EE 701', batch: '2024-2028', section: '', semester: 7, credits: 3 },
  { name: 'Open Elective IV', code: 'OE-EE 702', batch: '2024-2028', section: '', semester: 7, credits: 3 },
  { name: 'Principles of Management', code: 'HM-EE 701', batch: '2024-2028', section: '', semester: 7, credits: 3 },
  { name: 'Electric Drive Lab', code: 'PC-EE 791', batch: '2024-2028', section: '', semester: 7, credits: 1 },
  { name: 'Project Stage-I', code: 'PW-EE 781', batch: '2024-2028', section: '', semester: 7, credits: 2 },
  { name: 'Seminar', code: 'PW-EE 782', batch: '2024-2028', section: '', semester: 7, credits: 1 },
  { name: 'Utilization of Electric Power', code: 'PC-EE 801', batch: '2024-2028', section: '', semester: 8, credits: 3 },
  { name: 'Professional Elective V', code: 'PE-EE 801', batch: '2024-2028', section: '', semester: 8, credits: 3 },
  { name: 'Open Elective V', code: 'OE-EE 801', batch: '2024-2028', section: '', semester: 8, credits: 3 },
  { name: 'Project Stage-II', code: 'PW-EE 881', batch: '2024-2028', section: '', semester: 8, credits: 8 },
].map(s => ({ ...s, status: 'approved' }))

async function autoSeedDefaults() {
  try {
    if (mongoose.connection.readyState !== 1) return
    const ops = DEFAULT_SUBJECTS.map((s) => ({
      updateOne: {
        filter: { code: s.code, batch: s.batch, section: s.section || '' },
        update: { $set: s },
        upsert: true,
      },
    }))
    await Subject.bulkWrite(ops, { ordered: false })
    console.log('Defaulted engineering curriculum (insert-only, approved)')
  } catch (err) {
    // ignore seeding errors
  }
}

mongoose.connection.on('connected', autoSeedDefaults)
if (mongoose.connection.readyState === 1) autoSeedDefaults()

function isCourseStaff(user) {
  return user && ['admin', 'super_admin', 'cr', 'faculty'].includes(user.role)
}

// Length/type caps for write payloads — keeps a single
// request from stuffing megabytes of modules/books into the DB.
const STRING_LIMITS = { name: 120, code: 20, batch: 20, section: 10, syllabus: 10000 }
const ARRAY_LIMITS = { modules: 100, referenceBooks: 50, objectives: 50 }

function cleanString(value, limit) {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > limit ? trimmed.slice(0, limit) : trimmed
}

function cleanArray(value, limit) {
  if (value === undefined || value === null) return undefined
  if (!Array.isArray(value)) return undefined
  return value
    .filter((item) => typeof item === 'string' && item.trim())
    .map((item) => item.trim().slice(0, 500))
    .slice(0, limit)
}

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { batch, section, semester, status } = req.query
    const filter = {}
    if (batch) filter.batch = batch
    if (semester) filter.semester = Number(semester)
    if (section) {
      filter['$or'] = [{ section: '' }, { section }, { section: { $exists: false } }]
    }
    if (!isCourseStaff(req.user)) {
      filter.status = 'approved'
    } else if (status) {
      filter.status = status
    }
    const subjects = await Subject.find(filter)
      .populate('updatedBy', 'name')
      .sort({ semester: 1, code: 1, name: 1 })
      .lean()
    res.json({ success: true, count: subjects.length, data: subjects })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    let subject = await Subject.findById(req.params.id).populate('updatedBy', 'name')
    if (!subject) return res.status(404).json({ success: false, error: 'Subject not found' })
    if (!isCourseStaff(req.user) && subject.status !== 'approved') {
      return res.status(404).json({ success: false, error: 'Subject not found' })
    }
    res.json({ success: true, data: subject })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

router.post('/', protect, guard('admin', 'super_admin'), async (req, res) => {
  try {
    const { name, code, batch, section, semester, credits, modules, syllabus, referenceBooks, objectives, l, t, p } = req.body
    const cleanName = cleanString(name, STRING_LIMITS.name)
    const cleanCode = cleanString(code, STRING_LIMITS.code)
    if (!cleanName || !cleanCode) {
      return res.status(400).json({ success: false, error: 'Name and code are required' })
    }
    const cleanBatch = cleanString(batch, STRING_LIMITS.batch) || ''
    const cleanSection = cleanString(section, STRING_LIMITS.section) || ''
    const existing = await Subject.findOne({
      code: cleanCode.toUpperCase(),
      batch: cleanBatch,
      section: cleanSection,
    })
    if (existing) {
      return res.status(400).json({ success: false, error: 'Subject with this code already exists for this batch/section' })
    }
    const subject = await Subject.create({
      name: cleanName,
      code: cleanCode.toUpperCase(),
      batch: cleanBatch,
      section: cleanSection,
      semester: semester ? Number(semester) : 1,
      credits: credits ? Number(credits) : 0,
      modules: cleanArray(modules, ARRAY_LIMITS.modules) || [],
      syllabus: cleanString(syllabus, STRING_LIMITS.syllabus) || '',
      referenceBooks: cleanArray(referenceBooks, ARRAY_LIMITS.referenceBooks) || [],
      objectives: cleanArray(objectives, ARRAY_LIMITS.objectives) || [],
      l: Number(l) || 0,
      t: Number(t) || 0,
      p: Number(p) || 0,
      status: 'approved',
      updatedBy: req.user._id,
    })
    res.status(201).json({ success: true, data: subject })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

router.patch('/:id/approve', protect, guard('admin', 'super_admin'), async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
    if (!subject) return res.status(404).json({ success: false, error: 'Subject not found' })
    subject.status = 'approved'
    subject.updatedBy = req.user._id
    await subject.save()
    res.json({ success: true, data: subject })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

router.patch('/:id', protect, guard('admin', 'super_admin', 'faculty'), async (req, res) => {
  try {
    const { name, code, batch, section, semester, credits, modules, syllabus, referenceBooks, objectives, l, t, p } = req.body
    const subject = await Subject.findById(req.params.id)
    if (!subject) return res.status(404).json({ success: false, error: 'Subject not found' })

    const patchName = cleanString(name, STRING_LIMITS.name)
    const patchCode = cleanString(code, STRING_LIMITS.code)
    if (patchName) subject.name = patchName
    if (patchCode) subject.code = patchCode.toUpperCase()
    const patchBatch = cleanString(batch, STRING_LIMITS.batch)
    if (patchBatch !== undefined) subject.batch = patchBatch
    const patchSection = cleanString(section, STRING_LIMITS.section)
    if (patchSection !== undefined) subject.section = patchSection
    if (semester !== undefined) subject.semester = Number(semester)
    if (credits !== undefined) subject.credits = Number(credits)
    const patchModules = cleanArray(modules, ARRAY_LIMITS.modules)
    if (patchModules !== undefined) subject.modules = patchModules
    const patchSyllabus = cleanString(syllabus, STRING_LIMITS.syllabus)
    if (patchSyllabus !== undefined) subject.syllabus = patchSyllabus
    const patchBooks = cleanArray(referenceBooks, ARRAY_LIMITS.referenceBooks)
    if (patchBooks !== undefined) subject.referenceBooks = patchBooks
    const patchObjectives = cleanArray(objectives, ARRAY_LIMITS.objectives)
    if (patchObjectives !== undefined) subject.objectives = patchObjectives
    if (l !== undefined) subject.l = Number(l)
    if (t !== undefined) subject.t = Number(t)
    if (p !== undefined) subject.p = Number(p)
    subject.updatedBy = req.user._id
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      subject.status = 'pending'
    }
    await subject.save()
    res.json({ success: true, data: subject })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

router.delete('/:id', protect, guard('admin', 'super_admin'), async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'Subject deleted' })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

module.exports = router
