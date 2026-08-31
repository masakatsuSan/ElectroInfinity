const express = require('express')
const Resource = require('../models/Resource')
const { protect, guard, optionalAuth } = require('../middleware/auth')
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../utils/upload')

const router = express.Router()

// ── GET /api/resources ─────────────────────────────────────────────────────
// Public — supports ?type=notes&semester=5&subject=Power+System-I
// All resources are visible to all users; semester/subject are only for filtering
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { type, semester, subject } = req.query
    const filter = {}
    if (type) filter.type = type
    if (semester) filter.semester = Number(semester)
    if (subject) filter.subject = subject

    const resources = await Resource.find(filter)
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 })

    res.json({ success: true, data: resources })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── GET /api/resources/:id/download ───────────────────────────────────────
// Increments download count then redirects to the file
router.get('/:id/download', async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloadCount: 1 } },
      { new: true }
    )
    if (!resource) return res.status(404).json({ success: false, error: 'Not found' })

    // Redirect the browser to the Cloudinary URL
    res.redirect(resource.fileUrl)
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── POST /api/resources ────────────────────────────────────────────────────
// Upload a file — CR, and admin
// The file comes as multipart/form-data with field name "file"
router.post(
  '/',
  protect,
  guard('cr', 'super_admin', 'admin'),
  upload.single('file'),   // multer processes the file first
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' })
      }

      const { title, type, semester, subject, dueDate } = req.body

      // Determine Cloudinary folder based on type
      const folderMap = {
        notes: 'notes',
        pyq: 'previous-year-papers',
        assignment: 'assignments',
        lab_manual: 'lab-manuals',
        syllabus: 'syllabus',
      }
      const folder = `electro-infinity/${folderMap[type] || 'resources'}`

      const isPdf = req.file.mimetype === 'application/pdf';
      const resourceType = isPdf ? 'raw' : 'auto';

      // Upload the file buffer to Cloudinary
      const { url, publicId } = await uploadToCloudinary(req.file.buffer, {
        folder,
        resource_type: 'auto',
        // Use original filename (cleaned) as the Cloudinary public ID
        public_id: req.file.originalname.replace(/\.[^/.]+$/, ''),
        overwrite: false,
      })

      const resource = await Resource.create({
        title,
        type,
        semester: semester ? Number(semester) : null,
        subject,
        dueDate: dueDate || null,
        fileUrl: url,
        filePublicId: publicId,
        fileName: req.file.originalname,
        uploadedBy: req.user._id,
        batchId: req.user.role === 'cr' ? req.user.batch : (req.body.batchId || ''),
        visibility: 'GLOBAL',
      })

      res.status(201).json({ success: true, data: resource })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  }
)

// ── PUT /api/resources/:id ───────────────────────────────────────────────────
// Edit resource — CR (own batch only), super_admin, admin
router.put(
  '/:id',
  protect,
  guard('cr', 'super_admin', 'admin'),
  upload.single('file'),
  async (req, res) => {
    try {
      const resource = await Resource.findById(req.params.id)
      if (!resource) return res.status(404).json({ success: false, error: 'Not found' })

      // CR can only edit their own batch's uploads
      if (req.user.role === 'cr' && resource.batchId !== req.user.batch) {
        return res.status(403).json({ success: false, error: 'Not your upload' })
      }

      const { title, type, semester, subject, dueDate, visibility } = req.body
      const updates = {
        title:      title      || resource.title,
        type:       type       || resource.type,
        semester:   semester   !== undefined ? Number(semester) : resource.semester,
        subject:    subject    !== undefined ? subject : resource.subject,
        dueDate:    dueDate    || resource.dueDate,
        visibility: visibility || resource.visibility,
      }

      // If a new file is provided, delete the old one and upload the new
      if (req.file) {
        if (resource.filePublicId) {
          const isRaw = resource.fileUrl.includes('/raw/upload/')
          await deleteFromCloudinary(resource.filePublicId, isRaw ? 'raw' : 'image')
        }

        const folderMap = {
          notes: 'notes',
          pyq: 'previous-year-papers',
          assignment: 'assignments',
          lab_manual: 'lab-manuals',
          syllabus: 'syllabus',
        }
        const folder = `electro-infinity/${folderMap[updates.type] || 'resources'}`
        const isPdf = req.file.mimetype === 'application/pdf'
        const { url, publicId } = await uploadToCloudinary(req.file.buffer, {
          folder,
          resource_type: 'auto',
          public_id: req.file.originalname.replace(/\.[^/.]+$/, ''),
          overwrite: false,
        })

        updates.fileUrl      = url
        updates.filePublicId = publicId
        updates.fileName     = req.file.originalname
      }

      const updated = await Resource.findByIdAndUpdate(req.params.id, updates, { new: true })
      res.json({ success: true, data: updated })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  }
)

// ── DELETE /api/resources/:id ──────────────────────────────────────────────
router.delete('/:id', protect, guard('cr', 'super_admin', 'admin'), async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
    if (!resource) return res.status(404).json({ success: false, error: 'Not found' })

    // CR can only delete their own batch's uploads
    if (
      req.user.role === 'cr' &&
      resource.batchId !== req.user.batch
    ) {
      return res.status(403).json({ success: false, error: 'Not your upload' })
    }

    // Delete from Cloudinary first
    if (resource.filePublicId) {
      const isRaw = resource.fileUrl.includes('/raw/upload/');
      await deleteFromCloudinary(resource.filePublicId, isRaw ? 'raw' : 'image')
    }

    await resource.deleteOne()
    res.json({ success: true, message: 'Resource deleted' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
