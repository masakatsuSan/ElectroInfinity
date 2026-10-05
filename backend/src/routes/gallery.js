const express = require('express')
const Gallery = require('../models/Gallery')
const User = require('../models/User')
const { protect, guard } = require('../middleware/auth')
const { upload, uploadSingle, uploadToCloudinary, deleteFromCloudinary } = require('../utils/upload')
const { isCloudinaryUrl } = require('../utils/cloudinaryUrl')
const logger = require('../utils/logger')
const axios = require('axios')

const router = express.Router()

const TEASER_LIMIT = 6

// Only Cloudinary delivery URLs may be stored as an image source.
// The server fetches stored URLs (GET /:id/image), so anything
// else would be a server-side request forgery vector.
function assertSafeImageUrl(url) {
  if (!isCloudinaryUrl(url)) {
    const err = new Error('imageUrl must be a Cloudinary delivery URL (https://…cloudinary.com/…). Upload a file instead.')
    err.status = 400
    throw err
  }
}

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

// -- GET /api/gallery ------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const user = req.user
    const { author } = req.query

    const query = {}
    if (author) query.uploadedBy = author

    const photos = await Gallery.find(query).sort({ date: -1, createdAt: -1 }).lean()

    res.json({ success: true, data: photos })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// -- GET /api/gallery/:id --------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const photo = await Gallery.findById(req.params.id)
      .populate('uploadedBy', 'name photo rollNumber batch role profile.profileVisibility')
    if (!photo) return res.status(404).json({ success: false, error: 'Not found' })

    res.json({ success: true, data: photo })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
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
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// -- POST /api/gallery -----------------------------------------------
// Publishing to the public gallery is staff-only (admin,
// super_admin, faculty). It used to be open to any registered
// user, with isApproved hardcoded true.
router.post('/', protect, guard('admin', 'super_admin', 'faculty'), uploadSingle('image'), async (req, res) => {
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

    // SSRF defense: only Cloudinary URLs may be stored.
    assertSafeImageUrl(finalUrl)

    const photo = await Gallery.create({
      title: String(title || '').slice(0, 200),
      imageUrl: finalUrl,
      imagePublicId: finalPubId,
      category: String(category || 'campus').slice(0, 50),
      date: date ? new Date(date) : Date.now(),
      uploadedBy: req.user._id,
      isApproved: true,
    })

    logger.info({ event: 'gallery_upload', photoId: photo._id.toString(), adminId: req.user._id.toString() })
    res.status(201).json({ success: true, data: photo })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message })
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// -- PATCH /api/gallery/:id -------------------------------------------
router.patch('/:id', protect, uploadSingle('image'), async (req, res) => {
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
      // SSRF defense: only Cloudinary URLs may be stored.
      assertSafeImageUrl(imageUrl)
      photo.imageUrl = imageUrl
    }

    await photo.save()
    logger.info({ event: 'gallery_update', photoId: photo._id.toString(), adminId: req.user._id.toString() })
    res.json({ success: true, data: photo })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message })
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// -- DELETE /api/gallery/:id -----------------------------------------
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
    logger.info({ event: 'gallery_delete', photoId: photo._id.toString(), adminId: req.user._id.toString() })
    res.json({ success: true, message: 'Photo removed from gallery' })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

module.exports = router
