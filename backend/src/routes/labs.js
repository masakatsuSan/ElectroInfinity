const express = require('express')
const Lab = require('../models/Lab')
const { protect, guard, optionalAuth } = require('../middleware/auth')
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../utils/upload')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const labs = await Lab.find().sort({ createdAt: 1 })
    res.json({ success: true, data: labs })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/', protect, guard('super_admin', 'admin'), upload.single('image'), async (req, res) => {
  try {
    const { name, icon, desc, equip } = req.body

    let image = ''
    let imagePublicId = ''

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'electro-infinity/labs',
        resource_type: 'image',
      })
      image = result.url
      imagePublicId = result.publicId
    }

    const lab = await Lab.create({
      name: name || '',
      icon: icon || '🧪',
      desc: desc || '',
      equip: equip ? (typeof equip === 'string' ? equip.split(',').map(s => s.trim()).filter(Boolean) : equip) : [],
      image,
      imagePublicId
    })

    res.status(201).json({ success: true, data: lab })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/:id', protect, guard('super_admin', 'admin'), upload.single('image'), async (req, res) => {
  try {
    const lab = await Lab.findById(req.params.id)
    if (!lab) return res.status(404).json({ success: false, error: 'Not found' })

    const { name, icon, desc, equip } = req.body

    if (name)    lab.name = name
    if (icon)    lab.icon = icon
    if (desc)    lab.desc = desc
    if (equip) {
      lab.equip = typeof equip === 'string'
        ? equip.split(',').map(s => s.trim()).filter(Boolean)
        : equip
    }

    if (req.file) {
      if (lab.imagePublicId) {
        await deleteFromCloudinary(lab.imagePublicId, 'image')
      }
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'electro-infinity/labs',
        resource_type: 'image',
      })
      lab.image = result.url
      lab.imagePublicId = result.publicId
    }

    await lab.save()
    res.json({ success: true, data: lab })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/:id', protect, guard('super_admin', 'admin'), async (req, res) => {
  try {
    const lab = await Lab.findById(req.params.id)
    if (!lab) return res.status(404).json({ success: false, error: 'Not found' })

    if (lab.imagePublicId) {
      await deleteFromCloudinary(lab.imagePublicId, 'image')
    }

    await lab.deleteOne()
    res.json({ success: true, data: {} })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
