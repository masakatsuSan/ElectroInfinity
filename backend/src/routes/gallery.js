const express = require('express')
const Gallery = require('../models/Gallery')
const User = require('../models/User')
const { protect, guard } = require('../middleware/auth')
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../utils/upload')
const axios = require('axios')

const router = express.Router()

const TEASER_LIMIT = 6

function buildGalleryTeaser(photo) {
  return {
    _id: photo._id,
    kind: 'gallery',
    title: photo.title,
    category: photo.category,
    createdAt: photo.createdAt,
    date: photo.date,
    uploadedBy: photo.uploadedBy && typeof photo.uploadedBy === 'object'
      ? {
          _id: photo.uploadedBy._id,
          name: photo.uploadedBy.name,
          photo: photo.uploadedBy.photo,
          rollNumber: photo.uploadedBy.rollNumber,
          batch: photo.uploadedBy.batch,
          role: photo.uploadedBy.role,
          profileVisibility: photo.uploadedBy.profile?.profileVisibility || 'public',
        }
      : photo.uploadedBy,
  }
}

// ── GET /api/gallery ────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const user = req.user
    const { author } = req.query

    const query = {}
    if (author) query.uploadedBy = author

    const photos = await Gallery.find(query).sort({ date: -1, createdAt: -1 })

    res.json({ success: true, data: photos })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── GET /api/gallery/:id ────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const photo = await Gallery.findById(req.params.id)
      .populate('uploadedBy', 'name photo rollNumber batch role profile.profileVisibility')
    if (!photo) return res.status(404).json({ success: false, error: 'Not found' })

    res.json({ success: true, data: photo })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:id/image', async (req, res) => {
  try {
    const photo = await Gallery.findById(req.params.id)
      .populate('uploadedBy', 'batch role')
    if (!photo) return res.status(404).json({ success: false, error: 'Not found' })

    if (!photo.imageUrl) {
      return res.status(404).json({ success: false, error: 'No image for this photo' })
    }

    let parsed
    try { parsed = new URL(photo.imageUrl) } catch (_) { parsed = null }
    if (!parsed || !/^https?:$/.test(parsed.protocol)) {
      return res.status(400).json({ success: false, error: 'Invalid image URL' })
    }

    const response = await axios.get(photo.imageUrl, {
      responseType: 'stream',
      maxRedirects: 5,
      timeout: 15000,
      validateStatus: () => true,
    })

    if (response.status < 200 || response.status >= 300) {
      response.data.resume()
      return res.status(502).json({ success: false, error: `Upstream returned ${response.status}` })
    }

    const upstreamType = response.headers['content-type'] || 'application/octet-stream'
    res.setHeader('Content-Type', upstreamType)
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length'])
    }
    res.setHeader('Cache-Control', 'public, max-age=3600')

    response.data.on('error', () => { try { res.end() } catch (_) {} })
    req.on('close', () => { try { response.data.destroy() } catch (_) {} })

    response.data.pipe(res)
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── POST /api/gallery ───────────────────────────────────────────────
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    const { title, category, date, imageUrl } = req.body

    let finalUrl    = imageUrl || ''
    let finalPubId  = ''

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
      uploadedBy: req.user._id,
      isApproved: true,
    })

    res.status(201).json({ success: true, data: photo })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── PATCH /api/gallery/:id ───────────────────────────────────────────
router.patch('/:id', protect, upload.single('image'), async (req, res) => {
  try {
    const photo = await Gallery.findById(req.params.id)
      .populate('uploadedBy', 'batch role _id')
    if (!photo) return res.status(404).json({ success: false, error: 'Not found' })

    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin'
    const isAuthor = photo.uploadedBy && photo.uploadedBy._id.toString() === req.user._id.toString()
    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this photo' })
    }

    const { title, category, date, imageUrl } = req.body

    if (title)    photo.title = title
    if (category) photo.category = category
    if (date)     photo.date = new Date(date)

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
})

// ── DELETE /api/gallery/:id ─────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const photo = await Gallery.findById(req.params.id)
      .populate('uploadedBy', 'batch role _id')
    if (!photo) return res.status(404).json({ success: false, error: 'Not found' })

    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin'
    const isAuthor = photo.uploadedBy && photo.uploadedBy._id.toString() === req.user._id.toString()
    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this photo' })
    }

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
