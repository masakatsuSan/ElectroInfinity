const express = require('express')
const Gallery = require('../models/Gallery')
const { protect, guard } = require('../middleware/auth')
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../utils/upload')

const router = express.Router()

// ── GET /api/gallery ────────────────────────────────────────────────
// Public — department gallery, visible to students of ALL batches
router.get('/', async (req, res) => {
  try {
    const photos = await Gallery.find().sort({ date: -1, createdAt: -1 })
    res.json({ success: true, data: photos })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── GET /api/gallery/:id ────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const photo = await Gallery.findById(req.params.id)
    if (!photo) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: photo })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── POST /api/gallery ───────────────────────────────────────────────
// Admin uploads a department moment (image file) or links an existing URL.
router.post(
  '/',
  protect,
  guard('super_admin', 'admin'),
  upload.single('image'),
  async (req, res) => {
    try {
      const { title, category, date, imageUrl } = req.body

      let finalUrl    = imageUrl || ''
      let finalPubId  = ''

      // If an image file was attached, stream it to Cloudinary
      if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer, {
          folder: 'electro-infinity/gallery',
          resource_type: 'image',
        })
        finalUrl = result.url
        finalPubId = result.publicId
      }

      if (!finalUrl) {
        return res.status(400).json({ success: false, error: 'An image file or imageUrl is required' })
      }

      const photo = await Gallery.create({
        title: title || '',
        imageUrl: finalUrl,
        imagePublicId: finalPubId,
        category: category || 'campus',
        date: date ? new Date(date) : Date.now(),
      })

      res.status(201).json({ success: true, data: photo })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  }
)

// ── PUT /api/gallery/:id ────────────────────────────────────────────
// Admin updates metadata (and optionally replaces the image)
router.put(
  '/:id',
  protect,
  guard('super_admin', 'admin'),
  upload.single('image'),
  async (req, res) => {
    try {
      const photo = await Gallery.findById(req.params.id)
      if (!photo) return res.status(404).json({ success: false, error: 'Not found' })

      const { title, category, date, imageUrl } = req.body

      if (title)    photo.title = title
      if (category) photo.category = category
      if (date)     photo.date = new Date(date)

      // Replace the image if a new file was uploaded
      if (req.file) {
        if (photo.imagePublicId) {
          await deleteFromCloudinary(photo.imagePublicId, 'image')
        }
        const result = await uploadToCloudinary(req.file.buffer, {
          folder: 'electro-infinity/gallery',
          resource_type: 'image',
        })
        photo.imageUrl = result.url
        photo.imagePublicId = result.publicId
      } else if (imageUrl) {
        photo.imageUrl = imageUrl
      }

      await photo.save()
      res.json({ success: true, data: photo })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  }
)

// ── DELETE /api/gallery/:id ─────────────────────────────────────────
// Admin removes a moment (and the underlying Cloudinary image)
router.delete('/:id', protect, guard('super_admin', 'admin'), async (req, res) => {
  try {
    const photo = await Gallery.findById(req.params.id)
    if (!photo) return res.status(404).json({ success: false, error: 'Not found' })

    if (photo.imagePublicId) {
      await deleteFromCloudinary(photo.imagePublicId, 'image')
    }

    await photo.deleteOne()
    res.json({ success: true, message: 'Photo removed from gallery' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router