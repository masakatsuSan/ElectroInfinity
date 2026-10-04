const PlacementStat = require('../models/PlacementStat')
const Recruiter = require('../models/Recruiter')
const PlacedStudent = require('../models/PlacedStudent')
const AlumniStory = require('../models/AlumniStory')
const CareerOpening = require('../models/CareerOpening')
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/upload')

function sanitizeString(val) {
  if (typeof val !== 'string') return ''
  return val.replace(/<[^>]*>/g, '').trim()
}

function pickRequired(body, fields) {
  const out = {}
  for (const f of fields) {
    const v = body[f]
    if (v === undefined || v === null || String(v).trim() === '') {
      return { error: `${f} is required`, out }
    }
    out[f] = String(v).trim()
  }
  return { error: null, out }
}

function pickErrors(err) {
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message)
    return messages.join(', ')
  }
  if (err.code === 11000) {
    return 'Duplicate entry'
  }
  console.error('[ControllerError]', err?.message, err?.stack)
  return 'An unexpected error occurred'
}

function paginate(query, page, limit) {
  const p = Math.max(parseInt(page) || 1, 1)
  const l = Math.max(parseInt(limit) || 20, 1)
  return { skip: (p - 1) * l, limit: l, page: p }
}

function applySearch(q, search, fields) {
  if (!search || !search.trim()) return q
  const s = search.trim()
  const regex = new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
  const searchCond = { $or: fields.map(f => ({ [f]: { $regex: regex } })) }
  q.$and = q.$and || []
  q.$and.push(searchCond)
  return q
}

function checkAdmin(req) {
  const role = req.user?.role
  if (role !== 'admin' && role !== 'super_admin') {
    return false
  }
  return true
}

/* ─── Placement Stats ──────────────────────────────────────────────────── */

exports.listStats = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query
    const { skip, limit: l, page: p } = paginate({}, page, limit)
    const q = {}
    applySearch(q, search, ['academicYear', 'highestPackage', 'averagePackage'])
    const [items, total] = await Promise.all([
      PlacementStat.find(q).sort({ order: 1, createdAt: -1 }).skip(skip).limit(l),
      PlacementStat.countDocuments(q),
    ])
    res.json({ success: true, data: items, total, page: p, limit: l })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch stats' })
  }
}

exports.getStat = async (req, res) => {
  try {
    const item = await PlacementStat.findById(req.params.id)
    if (!item) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: item })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch stat' })
  }
}

exports.createStat = async (req, res) => {
  try {
    if (!checkAdmin(req)) return res.status(403).json({ success: false, error: 'Access denied' })
    const { error, out } = pickRequired(req.body, ['academicYear', 'totalStudents', 'placed', 'highestPackage', 'averagePackage'])
    if (error) return res.status(400).json({ success: false, error })
    const data = {
      ...out,
      totalStudents: Math.max(0, parseInt(req.body.totalStudents) || 0),
      placed: Math.max(0, parseInt(req.body.placed) || 0),
      medianPackage: sanitizeString(req.body.medianPackage),
      order: parseInt(req.body.order) || 0,
      published: req.body.published !== 'false' && req.body.published !== false,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    }
    const item = await PlacementStat.create(data)
    res.status(201).json({ success: true, data: item })
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: pickErrors(err) })
    }
    res.status(500).json({ success: false, error: 'Failed to create stat' })
  }
}

exports.updateStat = async (req, res) => {
  try {
    if (!checkAdmin(req)) return res.status(403).json({ success: false, error: 'Access denied' })
    const item = await PlacementStat.findById(req.params.id)
    if (!item) return res.status(404).json({ success: false, error: 'Not found' })
    const allowed = ['academicYear','totalStudents','placed','highestPackage','averagePackage','medianPackage','order','published']
    const update = {}
    for (const f of allowed) {
      if (req.body[f] !== undefined) {
        if (f === 'totalStudents' || f === 'placed') update[f] = Math.max(0, parseInt(req.body[f]) || 0)
        else if (f === 'order') update[f] = parseInt(req.body[f]) || 0
        else if (f === 'published') update[f] = req.body[f] === true || req.body[f] === 'true'
        else update[f] = sanitizeString(req.body[f])
      }
    }
    update.updatedBy = req.user._id
    const updated = await PlacementStat.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
    res.json({ success: true, data: updated })
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: pickErrors(err) })
    }
    res.status(500).json({ success: false, error: 'Failed to update stat' })
  }
}

exports.deleteStat = async (req, res) => {
  try {
    if (!checkAdmin(req)) return res.status(403).json({ success: false, error: 'Access denied' })
    const item = await PlacementStat.findByIdAndDelete(req.params.id)
    if (!item) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: {} })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete stat' })
  }
}

exports.reorderStats = async (req, res) => {
  try {
    if (!checkAdmin(req)) return res.status(403).json({ success: false, error: 'Access denied' })
    const { items } = req.body
    if (!Array.isArray(items)) return res.status(400).json({ success: false, error: 'items array required' })
    await Promise.all(items.map(({ id, order }) => PlacementStat.findByIdAndUpdate(id, { order: parseInt(order) || 0 })))
    res.json({ success: true })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to reorder' })
  }
}

/* ─── Recruiters ──────────────────────────────────────────────────────── */

exports.listRecruiters = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query
    const { skip, limit: l, page: p } = paginate({}, page, limit)
    const q = {}
    applySearch(q, search, ['name', 'type'])
    const [items, total] = await Promise.all([
      Recruiter.find(q).sort({ order: 1, createdAt: -1 }).skip(skip).limit(l),
      Recruiter.countDocuments(q),
    ])
    res.json({ success: true, data: items, total, page: p, limit: l })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch recruiters' })
  }
}

exports.getRecruiter = async (req, res) => {
  try {
    const item = await Recruiter.findById(req.params.id)
    if (!item) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: item })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch recruiter' })
  }
}

exports.createRecruiter = async (req, res) => {
  try {
    if (!checkAdmin(req)) return res.status(403).json({ success: false, error: 'Access denied' })
    // logoUrl is optional if a file is uploaded
    const { error, out } = pickRequired(req.body, ['name'])
    if (error && !req.file) return res.status(400).json({ success: false, error })
    let logoUrl = sanitizeString(req.body.logoUrl)
    let logoPublicId = ''
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'electro-infinity/placements/recruiters',
        resource_type: 'image',
      })
      logoUrl = result.url
      logoPublicId = result.publicId
    } else if (!logoUrl) {
      return res.status(400).json({ success: false, error: 'logoUrl is required' })
    }
    const data = {
      ...out,
      logoUrl,
      logoPublicId,
      website: sanitizeString(req.body.website),
      type: ['placement', 'internship', 'both'].includes(req.body.type) ? req.body.type : 'both',
      order: parseInt(req.body.order) || 0,
      published: req.body.published !== 'false' && req.body.published !== false,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    }
    const item = await Recruiter.create(data)
    res.status(201).json({ success: true, data: item })
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: pickErrors(err) })
    }
    res.status(500).json({ success: false, error: 'Failed to create recruiter' })
  }
}

exports.updateRecruiter = async (req, res) => {
  try {
    if (!checkAdmin(req)) return res.status(403).json({ success: false, error: 'Access denied' })
    const item = await Recruiter.findById(req.params.id)
    if (!item) return res.status(404).json({ success: false, error: 'Not found' })
    const allowed = ['name', 'logoUrl', 'website', 'type', 'order', 'published']
    const update = {}
    for (const f of allowed) {
      if (req.body[f] !== undefined) {
        if (f === 'order') update[f] = parseInt(req.body[f]) || 0
        else if (f === 'published') update[f] = req.body[f] === true || req.body[f] === 'true'
        else update[f] = sanitizeString(req.body[f])
      }
    }
    if (req.file) {
      if (item.logoPublicId) {
        await deleteFromCloudinary(item.logoPublicId, 'image')
      }
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'electro-infinity/placements/recruiters',
        resource_type: 'image',
      })
      update.logoUrl = result.url
      update.logoPublicId = result.publicId
    }
    update.updatedBy = req.user._id
    const updated = await Recruiter.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
    res.json({ success: true, data: updated })
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: pickErrors(err) })
    }
    res.status(500).json({ success: false, error: 'Failed to update recruiter' })
  }
}

exports.deleteRecruiter = async (req, res) => {
  try {
    if (!checkAdmin(req)) return res.status(403).json({ success: false, error: 'Access denied' })
    const item = await Recruiter.findByIdAndDelete(req.params.id)
    if (!item) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: {} })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete recruiter' })
  }
}

exports.reorderRecruiters = async (req, res) => {
  try {
    if (!checkAdmin(req)) return res.status(403).json({ success: false, error: 'Access denied' })
    const { items } = req.body
    if (!Array.isArray(items)) return res.status(400).json({ success: false, error: 'items array required' })
    await Promise.all(items.map(({ id, order }) => Recruiter.findByIdAndUpdate(id, { order: parseInt(order) || 0 })))
    res.json({ success: true })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to reorder' })
  }
}

/* ─── Placed Students ─────────────────────────────────────────────────── */

exports.listPlacedStudents = async (req, res) => {
  try {
    const { search, type, batchYear, page = 1, limit = 20 } = req.query
    const { skip, limit: l, page: p } = paginate({}, page, limit)
    const q = {}
    if (type && ['placement', 'internship'].includes(type)) q.type = type
    if (batchYear) q.batchYear = batchYear
    applySearch(q, search, ['studentName', 'company', 'role', 'branch'])
    const [items, total] = await Promise.all([
      PlacedStudent.find(q).sort({ createdAt: -1 }).skip(skip).limit(l),
      PlacedStudent.countDocuments(q),
    ])
    res.json({ success: true, data: items, total, page: p, limit: l })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch placed students' })
  }
}

exports.getPlacedStudent = async (req, res) => {
  try {
    const item = await PlacedStudent.findById(req.params.id)
    if (!item) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: item })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch placed student' })
  }
}

exports.createPlacedStudent = async (req, res) => {
  try {
    if (!checkAdmin(req)) return res.status(403).json({ success: false, error: 'Access denied' })
    const { error, out } = pickRequired(req.body, ['studentName', 'branch', 'batchYear', 'company', 'role', 'type'])
    if (error) return res.status(400).json({ success: false, error })
    let photoUrl = sanitizeString(req.body.photoUrl)
    let photoPublicId = ''
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'electro-infinity/placements/students',
        resource_type: 'image',
      })
      photoUrl = result.url
      photoPublicId = result.publicId
    }
    const data = {
      ...out,
      package: sanitizeString(req.body.package),
      photoUrl,
      photoPublicId,
      published: req.body.published !== 'false' && req.body.published !== false,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    }
    const item = await PlacedStudent.create(data)
    res.status(201).json({ success: true, data: item })
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: pickErrors(err) })
    }
    res.status(500).json({ success: false, error: 'Failed to create placed student' })
  }
}

exports.updatePlacedStudent = async (req, res) => {
  try {
    if (!checkAdmin(req)) return res.status(403).json({ success: false, error: 'Access denied' })
    const item = await PlacedStudent.findById(req.params.id)
    if (!item) return res.status(404).json({ success: false, error: 'Not found' })
    const allowed = ['studentName', 'branch', 'batchYear', 'company', 'role', 'package', 'photoUrl', 'type', 'published']
    const update = {}
    for (const f of allowed) {
      if (req.body[f] !== undefined) {
        if (f === 'published') update[f] = req.body[f] === true || req.body[f] === 'true'
        else update[f] = sanitizeString(req.body[f])
      }
    }
    if (req.file) {
      if (item.photoPublicId) {
        await deleteFromCloudinary(item.photoPublicId, 'image')
      }
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'electro-infinity/placements/students',
        resource_type: 'image',
      })
      update.photoUrl = result.url
      update.photoPublicId = result.publicId
    }
    update.updatedBy = req.user._id
    const updated = await PlacedStudent.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
    res.json({ success: true, data: updated })
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: pickErrors(err) })
    }
    res.status(500).json({ success: false, error: 'Failed to update placed student' })
  }
}

exports.deletePlacedStudent = async (req, res) => {
  try {
    if (!checkAdmin(req)) return res.status(403).json({ success: false, error: 'Access denied' })
    const item = await PlacedStudent.findByIdAndDelete(req.params.id)
    if (!item) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: {} })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete placed student' })
  }
}

/* ─── Alumni Stories ──────────────────────────────────────────────────── */

exports.listAlumniStories = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query
    const { skip, limit: l, page: p } = paginate({}, page, limit)
    const q = {}
    applySearch(q, search, ['name', 'currentRole', 'company', 'batchYear'])
    const [items, total] = await Promise.all([
      AlumniStory.find(q).sort({ order: 1, createdAt: -1 }).skip(skip).limit(l),
      AlumniStory.countDocuments(q),
    ])
    res.json({ success: true, data: items, total, page: p, limit: l })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch alumni stories' })
  }
}

exports.getAlumniStory = async (req, res) => {
  try {
    const item = await AlumniStory.findById(req.params.id)
    if (!item) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: item })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch alumni story' })
  }
}

exports.createAlumniStory = async (req, res) => {
  try {
    if (!checkAdmin(req)) return res.status(403).json({ success: false, error: 'Access denied' })
    const { error, out } = pickRequired(req.body, ['name', 'batchYear', 'currentRole', 'company', 'quote'])
    if (error) return res.status(400).json({ success: false, error })
    let photoUrl = sanitizeString(req.body.photoUrl)
    let photoPublicId = ''
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'electro-infinity/placements/alumni',
        resource_type: 'image',
      })
      photoUrl = result.url
      photoPublicId = result.publicId
    }
    const data = {
      ...out,
      photoUrl,
      photoPublicId,
      linkedinUrl: sanitizeString(req.body.linkedinUrl),
      order: parseInt(req.body.order) || 0,
      published: req.body.published !== 'false' && req.body.published !== false,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    }
    const item = await AlumniStory.create(data)
    res.status(201).json({ success: true, data: item })
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: pickErrors(err) })
    }
    res.status(500).json({ success: false, error: 'Failed to create alumni story' })
  }
}

exports.updateAlumniStory = async (req, res) => {
  try {
    if (!checkAdmin(req)) return res.status(403).json({ success: false, error: 'Access denied' })
    const item = await AlumniStory.findById(req.params.id)
    if (!item) return res.status(404).json({ success: false, error: 'Not found' })
    const allowed = ['name', 'batchYear', 'currentRole', 'company', 'quote', 'photoUrl', 'linkedinUrl', 'order', 'published']
    const update = {}
    for (const f of allowed) {
      if (req.body[f] !== undefined) {
        if (f === 'order') update[f] = parseInt(req.body[f]) || 0
        else if (f === 'published') update[f] = req.body[f] === true || req.body[f] === 'true'
        else update[f] = sanitizeString(req.body[f])
      }
    }
    if (req.file) {
      if (item.photoPublicId) {
        await deleteFromCloudinary(item.photoPublicId, 'image')
      }
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'electro-infinity/placements/alumni',
        resource_type: 'image',
      })
      update.photoUrl = result.url
      update.photoPublicId = result.publicId
    }
    update.updatedBy = req.user._id
    const updated = await AlumniStory.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
    res.json({ success: true, data: updated })
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: pickErrors(err) })
    }
    res.status(500).json({ success: false, error: 'Failed to update alumni story' })
  }
}

exports.deleteAlumniStory = async (req, res) => {
  try {
    if (!checkAdmin(req)) return res.status(403).json({ success: false, error: 'Access denied' })
    const item = await AlumniStory.findByIdAndDelete(req.params.id)
    if (!item) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: {} })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete alumni story' })
  }
}

exports.reorderAlumniStories = async (req, res) => {
  try {
    if (!checkAdmin(req)) return res.status(403).json({ success: false, error: 'Access denied' })
    const { items } = req.body
    if (!Array.isArray(items)) return res.status(400).json({ success: false, error: 'items array required' })
    await Promise.all(items.map(({ id, order }) => AlumniStory.findByIdAndUpdate(id, { order: parseInt(order) || 0 })))
    res.json({ success: true })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to reorder' })
  }
}

/* ─── Career Openings ─────────────────────────────────────────────────── */

exports.listOpenings = async (req, res) => {
  try {
    const { search, status, type, page = 1, limit = 20 } = req.query
    const { skip, limit: l, page: p } = paginate({}, page, limit)
    const q = {}
    if (status && ['open', 'closed'].includes(status)) q.status = status
    if (type && ['job', 'internship', 'training'].includes(type)) q.type = type
    applySearch(q, search, ['title', 'company', 'location', 'mode'])
    const [items, total] = await Promise.all([
      CareerOpening.find(q).sort({ createdAt: -1 }).skip(skip).limit(l),
      CareerOpening.countDocuments(q),
    ])
    res.json({ success: true, data: items, total, page: p, limit: l })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch openings' })
  }
}

exports.getOpening = async (req, res) => {
  try {
    const item = await CareerOpening.findById(req.params.id)
    if (!item) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: item })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch opening' })
  }
}

exports.createOpening = async (req, res) => {
  try {
    if (!checkAdmin(req)) return res.status(403).json({ success: false, error: 'Access denied' })
    const { error, out } = pickRequired(req.body, ['title', 'company', 'type', 'location', 'mode', 'description', 'applyUrl', 'deadline'])
    if (error) return res.status(400).json({ success: false, error })
    const data = {
      ...out,
      status: ['open', 'closed'].includes(req.body.status) ? req.body.status : 'open',
      published: req.body.published !== 'false' && req.body.published !== false,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    }
    const item = await CareerOpening.create(data)
    res.status(201).json({ success: true, data: item })
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: pickErrors(err) })
    }
    res.status(500).json({ success: false, error: 'Failed to create opening' })
  }
}

exports.updateOpening = async (req, res) => {
  try {
    if (!checkAdmin(req)) return res.status(403).json({ success: false, error: 'Access denied' })
    const item = await CareerOpening.findById(req.params.id)
    if (!item) return res.status(404).json({ success: false, error: 'Not found' })
    const allowed = ['title', 'company', 'type', 'location', 'mode', 'description', 'applyUrl', 'deadline', 'status', 'published']
    const update = {}
    for (const f of allowed) {
      if (req.body[f] !== undefined) {
        if (f === 'status') update[f] = ['open', 'closed'].includes(req.body[f]) ? req.body[f] : item.status
        else if (f === 'published') update[f] = req.body[f] === true || req.body[f] === 'true'
        else update[f] = sanitizeString(req.body[f])
      }
    }
    update.updatedBy = req.user._id
    const updated = await CareerOpening.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
    res.json({ success: true, data: updated })
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: pickErrors(err) })
    }
    res.status(500).json({ success: false, error: 'Failed to update opening' })
  }
}

exports.deleteOpening = async (req, res) => {
  try {
    if (!checkAdmin(req)) return res.status(403).json({ success: false, error: 'Access denied' })
    const item = await CareerOpening.findByIdAndDelete(req.params.id)
    if (!item) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: {} })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete opening' })
  }
}

/* ─── Toggle publish (generic) ─────────────────────────────────────────── */

exports.togglePublish = async (req, res) => {
  try {
    if (!checkAdmin(req)) return res.status(403).json({ success: false, error: 'Access denied' })
    const { section, id } = req.params
    const models = {
      stats: PlacementStat,
      recruiters: Recruiter,
      'placed-students': PlacedStudent,
      alumni: AlumniStory,
      openings: CareerOpening,
    }
    const Model = models[section]
    if (!Model) return res.status(400).json({ success: false, error: 'Invalid section' })
    const item = await Model.findById(id)
    if (!item) return res.status(404).json({ success: false, error: 'Not found' })
    item.published = !item.published
    item.updatedBy = req.user._id
    await item.save()
    res.json({ success: true, data: item })
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: pickErrors(err) })
    }
    res.status(500).json({ success: false, error: 'Failed to toggle publish' })
  }
}
