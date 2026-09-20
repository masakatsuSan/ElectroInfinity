const express = require('express')
const mongoose = require('mongoose')
const axios = require('axios')
const Folder = require('../models/Folder')
const Resource = require('../models/Resource')
const YTLecture = require('../models/YTLecture')
const User = require('../models/User')
const { protect, guard, optionalAuth } = require('../middleware/auth')
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../utils/upload')
const { createActivity } = require('../utils/activity')
const { createNotificationBulk } = require('../utils/notification')
const { extractPlaylistId, importPlaylist } = require('../services/youtube')

const router = express.Router()

function toObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null
}

async function generateUniqueSlug(base, batchId) {
  const slugBase = String(base)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'folder'

  let candidate = slugBase
  let suffix = 0
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await Folder.findOne({ slug: candidate, batchId: batchId || '' }).select('_id')
    if (!existing) return candidate
    suffix += 1
    candidate = `${slugBase}-${suffix}`
  }
}

function applyBatchScope(filter, user) {
  if (!user) {
    filter.visibility = 'GLOBAL'
    return
  }
  if (user.role === 'cr' || user.role === 'student') {
    const batch = user.batch || ''
    if (batch) {
      filter['$or'] = [{ visibility: 'GLOBAL' }, { batchId: batch }]
    } else {
      filter.visibility = 'GLOBAL'
    }
    return
  }
}

function canUserViewFolder(user, folder) {
  if (!folder) return false
  if (!user) return folder.visibility === 'GLOBAL'
  if (['admin', 'super_admin', 'faculty'].includes(user.role)) return true
  if (user.role === 'cr' || user.role === 'student') {
    if (folder.visibility === 'GLOBAL') return true
    if (folder.batchId && folder.batchId === user.batch) return true
  }
  return false
}

async function resolveItems(items) {
  const resourceRefs = items.filter((i) => i.type === 'resource').map((i) => i.ref)
  const lectureRefs = items.filter((i) => i.type === 'lecture').map((i) => i.ref)

  const [resources, lectures] = await Promise.all([
    resourceRefs.length ? Resource.find({ _id: { $in: resourceRefs } }).lean() : [],
    lectureRefs.length ? YTLecture.find({ _id: { $in: lectureRefs } }).lean() : [],
  ])

  const resourceMap = new Map(resources.map((r) => [r._id.toString(), r]))
  const lectureMap = new Map(lectures.map((l) => [l._id.toString(), l]))

  const resolved = []
  for (const item of items) {
    const rid = item.ref.toString()
    const leaf = item.type === 'resource' ? resourceMap.get(rid) : lectureMap.get(rid)
    if (!leaf) continue
    resolved.push({
      ref: item.ref,
      type: item.type,
      title: item.title || leaf.title,
      thumbnail: item.thumbnail || leaf.thumbnail || '',
      data: leaf,
    })
  }
  return resolved
}

async function sendUploadNotifications(folder, io) {
  try {
    const recipientQuery = { role: { $in: ['student', 'cr'] }, isActive: true }
    if (folder.batchId) recipientQuery.batch = folder.batchId
    if (folder.visibility === 'BATCH' && !folder.batchId) return

    const recipients = await User.find(recipientQuery).select('_id')
    const recipientIds = recipients.map((r) => r._id.toString())
    if (recipientIds.length === 0) return

    await createNotificationBulk({
      recipients: recipientIds,
      actor: folder.createdBy,
      type: 'resource_uploaded',
      title: `New resources in: ${folder.title}`,
      message: folder.subject || `Semester ${folder.semester || '—'}`,
      link: `/resources`,
      entityId: folder._id,
      entityType: 'Folder',
      io,
    })
  } catch (err) {
    console.error('Folder notification error:', err.message)
  }
}

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { semester, subject, batchId, search } = req.query
    const filter = {}
    applyBatchScope(filter, req.user)
    if (semester) filter.semester = Number(semester)
    if (subject) filter.subject = subject
    if (batchId && req.user && ['admin', 'super_admin'].includes(req.user.role)) filter.batchId = batchId
    if (search) filter.title = new RegExp(search, 'i')

    const folders = await Folder.find(filter)
      .populate('createdBy', 'name photo')
      .populate('updatedBy', 'name photo')
      .sort({ createdAt: -1 })

    res.json({ success: true, count: folders.length, data: folders })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id)
      .populate('createdBy', 'name photo')
      .populate('updatedBy', 'name photo')

    if (!folder) return res.status(404).json({ success: false, error: 'Folder not found' })

    if (!canUserViewFolder(req.user, folder)) {
      return res
        .status(req.user ? 403 : 401)
        .json({ success: false, error: req.user ? 'Not your folder' : 'Login required' })
    }

    const items = await resolveItems(folder.items)
    res.json({ success: true, data: { ...folder.toObject(), items } })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

router.post('/', protect, guard('cr', 'super_admin', 'admin'), async (req, res) => {
  try {
    const { title, slug, description, semester, subject, batchId, visibility } = req.body

    if (!title) return res.status(400).json({ success: false, error: 'Title is required' })

    const isCourseStaff = ['admin', 'super_admin'].includes(req.user.role)
    const scopedBatchId = isCourseStaff ? (batchId || '') : (req.user.batch || '')

    if (req.user.role === 'cr' && batchId && batchId !== req.user.batch) {
      return res.status(403).json({ success: false, error: 'CR can only create folders for their own batch' })
    }

    const finalSlug = slug ? slug.toLowerCase() : await generateUniqueSlug(title, scopedBatchId)

    const folder = await Folder.create({
      title,
      slug: finalSlug,
      description: description || '',
      semester: semester ? Number(semester) : null,
      subject: subject || '',
      batchId: scopedBatchId,
      visibility: visibility || (scopedBatchId ? 'BATCH' : 'GLOBAL'),
      createdBy: req.user._id,
    })

    await createActivity(
      req.user._id,
      'resource_uploaded',
      `Created folder: ${title}`,
      `Folder for ${subject || '—'} (Semester ${semester || '—'})`,
      `/admin/resource-folders`
    )

    res.status(201).json({ success: true, data: folder })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, error: 'Folder with this slug already exists for this batch' })
    }
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

router.put('/:id', protect, guard('cr', 'super_admin', 'admin'), async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id)
    if (!folder) return res.status(404).json({ success: false, error: 'Folder not found' })

    const isOwner = folder.createdBy.toString() === req.user._id.toString()
    const isCourseStaff = ['admin', 'super_admin'].includes(req.user.role)
    if (!isCourseStaff && !isOwner) {
      return res.status(403).json({ success: false, error: 'Not your folder' })
    }

    const { title, slug, description, semester, subject, batchId, visibility } = req.body

    if (req.user.role === 'cr' && batchId && batchId !== req.user.batch) {
      return res.status(403).json({ success: false, error: 'CR can only scope folders to their own batch' })
    }

    if (title) folder.title = title
    if (slug) folder.slug = slug.toLowerCase()
    if (description !== undefined) folder.description = description
    if (semester !== undefined) folder.semester = semester ? Number(semester) : null
    if (subject !== undefined) folder.subject = subject
    if (req.user.role !== 'cr' && batchId !== undefined) folder.batchId = batchId || ''
    if (visibility) folder.visibility = visibility
    folder.updatedBy = req.user._id

    await folder.save()
    res.json({ success: true, data: folder })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, error: 'Folder with this slug already exists for this batch' })
    }
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

router.delete('/:id', protect, guard('cr', 'super_admin', 'admin'), async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id)
    if (!folder) return res.status(404).json({ success: false, error: 'Folder not found' })

    const isCourseStaff = ['admin', 'super_admin'].includes(req.user.role)
    if (!isCourseStaff && folder.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not your folder' })
    }
    if (req.user.role === 'cr' && folder.batchId && folder.batchId !== req.user.batch) {
      return res.status(403).json({ success: false, error: 'Not your folder' })
    }

    const cascade = req.query.cascade === '1' || req.query.cascade === 'true'

    if (cascade) {
      const resourceRefs = folder.items.filter((i) => i.type === 'resource').map((i) => i.ref)
      const lectureRefs = folder.items.filter((i) => i.type === 'lecture').map((i) => i.ref)

      if (resourceRefs.length) {
        const resources = await Resource.find({ _id: { $in: resourceRefs } })
        await Promise.all(
          resources.map((r) => {
            if (r.filePublicId) {
              const isRaw = r.fileUrl.includes('/raw/upload/')
              return deleteFromCloudinary(r.filePublicId, isRaw ? 'raw' : 'image')
            }
            return Promise.resolve()
          })
        )
        await Resource.deleteMany({ _id: { $in: resourceRefs } })
      }

      if (lectureRefs.length) {
        await YTLecture.deleteMany({ _id: { $in: lectureRefs } })
      }
    }

    await folder.deleteOne()
    res.json({ success: true, message: 'Folder deleted' })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

async function uploadFromDriveLink(driveLink, fileType, title) {
  let fileId
  const idMatch = driveLink.match(/[?&]id=([^&]+)/)
  const dMatch = driveLink.match(/\/d\/([^/]+)/)
  if (idMatch) {
    fileId = idMatch[1]
  } else if (dMatch) {
    fileId = dMatch[1]
  } else {
    throw new Error('Invalid Google Drive link')
  }

  const response = await axios.get(`https://drive.google.com/uc?export=download&id=${fileId}`, {
    responseType: 'arraybuffer',
    maxContentLength: 20 * 1024 * 1024,
    maxBodyLength: 20 * 1024 * 1024,
  })

  const buffer = Buffer.from(response.data)
  const isPdf = (response.headers['content-type'] || '').includes('pdf') || (title || '').toLowerCase().endsWith('.pdf')
  const resourceType = isPdf ? 'raw' : 'auto'

  const folderMap = {
    notes: 'notes',
    books: 'books',
    organisers: 'organisers',
    pyqs: 'pyqs',
    'yt playlist': 'yt-playlist',
  }
  const cloudFolder = `electro-infinity/${folderMap[fileType] || 'resources'}`

  const { url, publicId } = await uploadToCloudinary(buffer, {
    folder: cloudFolder,
    resource_type: resourceType,
    public_id: `drive-${fileId}`,
    overwrite: false,
  })

  return {
    url,
    publicId,
    fileName: (title || `drive-file-${fileId}`).replace(/[^a-zA-Z0-9._-]/g, '_'),
  }
}

router.post('/:id/upload', protect, guard('cr', 'super_admin', 'admin'), upload.single('file'), async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id)
    if (!folder) return res.status(404).json({ success: false, error: 'Folder not found' })

    const isCourseStaff = ['admin', 'super_admin'].includes(req.user.role)
    if (!isCourseStaff && folder.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not your folder' })
    }
    if (req.user.role === 'cr' && folder.batchId && folder.batchId !== req.user.batch) {
      return res.status(403).json({ success: false, error: 'Not your folder' })
    }

    if (!req.file && !req.body.driveLink) {
      return res.status(400).json({ success: false, error: 'No file uploaded' })
    }

    const { title, type, dueDate } = req.body
    const fileType = type || 'notes'

    let url, publicId, fileName

    if (req.body.driveLink) {
      const driveResult = await uploadFromDriveLink(req.body.driveLink, fileType, title)
      url = driveResult.url
      publicId = driveResult.publicId
      fileName = driveResult.fileName
    } else {
      const resolvedTitle = title || req.file.originalname.replace(/\.[^/.]+$/, '')

      const folderMap = {
        notes: 'notes',
        books: 'books',
        organisers: 'organisers',
        pyqs: 'pyqs',
        'yt playlist': 'yt-playlist',
      }
      const cloudFolder = `electro-infinity/${folderMap[fileType] || 'resources'}`
      const isPdf = req.file.mimetype === 'application/pdf'
      const resourceType = isPdf ? 'raw' : 'auto'

      const uploadResult = await uploadToCloudinary(req.file.buffer, {
        folder: cloudFolder,
        resource_type: resourceType,
        public_id: req.file.originalname.replace(/\.[^/.]+$/, ''),
        overwrite: false,
      })
      url = uploadResult.url
      publicId = uploadResult.publicId
      fileName = req.file.originalname
    }

    const resource = await Resource.create({
      title: title || fileName,
      type: fileType,
      semester: folder.semester,
      subject: folder.subject,
      dueDate: dueDate || null,
      fileUrl: url,
      filePublicId: publicId,
      fileName,
      uploadedBy: req.user._id,
      batchId: folder.batchId,
      visibility: folder.visibility,
    })

    folder.items.push({
      ref: resource._id,
      type: 'resource',
      title: resource.title,
      thumbnail: '',
    })
    await folder.save()

    await createActivity(
      req.user._id,
      'resource_uploaded',
      `Added file to folder: ${folder.title}`,
      `${resource.title} (${fileType})`,
      `/admin/resource-folders/${folder._id}`
    )

    const io = req.app.get('io')
    await sendUploadNotifications(folder, io)

    const item = { ref: resource._id, type: 'resource', title: resource.title, thumbnail: '', data: resource.toObject() }
    res.status(201).json({ success: true, data: { folder, item } })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

router.post('/:id/playlist', protect, guard('cr', 'super_admin', 'admin'), async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id)
    if (!folder) return res.status(404).json({ success: false, error: 'Folder not found' })

    const isCourseStaff = ['admin', 'super_admin'].includes(req.user.role)
    if (!isCourseStaff && folder.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not your folder' })
    }
    if (req.user.role === 'cr' && folder.batchId && folder.batchId !== req.user.batch) {
      return res.status(403).json({ success: false, error: 'Not your folder' })
    }

    const { playlistUrl, playlistId, titlePrefix, subject, semester } = req.body
    const playlistInput = playlistId || playlistUrl
    const playlistIdResolved = extractPlaylistId(playlistInput)

    if (!playlistIdResolved) {
      return res.status(400).json({ success: false, error: 'A valid YouTube playlist URL or ID is required' })
    }

    const abortController = new AbortController()
    const { videos } = await importPlaylist(playlistIdResolved, { signal: abortController.signal })

    const existingLectures = await YTLecture.find({
      youtubeVideoId: { $in: videos.map((v) => v.videoId) },
    }).select('youtubeVideoId')
    const existingVideoIds = new Set(existingLectures.map((l) => l.youtubeVideoId))
    const newVideos = videos.filter((v) => !existingVideoIds.has(v.videoId))

    let lectureNumber = folder.items.filter((i) => i.type === 'lecture').length + 1
    const created = []

    for (const video of newVideos) {
      const lecture = await YTLecture.create({
        title: `${titlePrefix ? titlePrefix + ' — ' : ''}${video.title}`,
        lectureNumber: lectureNumber,
        youtubeVideoId: video.videoId,
        thumbnail: video.thumbnail || `https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`,
        semester: semester !== undefined ? (semester ? Number(semester) : null) : folder.semester,
        subject: subject !== undefined ? subject : folder.subject,
        uploadedBy: req.user._id,
        batchId: folder.batchId,
        visibility: folder.visibility,
      })

      folder.items.push({
        ref: lecture._id,
        type: 'lecture',
        title: lecture.title,
        thumbnail: lecture.thumbnail || '',
      })
      created.push(lecture)
      lectureNumber += 1
    }

    await folder.save()

    await createActivity(
      req.user._id,
      'resource_uploaded',
      `Imported playlist into folder: ${folder.title}`,
      `Added ${created.length} lectures`,
      `/admin/resource-folders/${folder._id}`
    )

    const io = req.app.get('io')
    await sendUploadNotifications(folder, io)

    res.status(201).json({ success: true, count: created.length, data: created })
  } catch (err) {
    if (err.code === 'NO_YOUTUBE_KEY' || err.code === 'PLAYLIST_NOT_FOUND' || err.code === 'PLAYLIST_EMPTY' || err.code === 'YOUTUBE_API_ERROR') {
      return res.status(400).json({ success: false, error: 'Request could not be completed.' })
    }
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

router.put('/:id/items', protect, guard('cr', 'super_admin', 'admin'), async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id)
    if (!folder) return res.status(404).json({ success: false, error: 'Folder not found' })

    const isCourseStaff = ['admin', 'super_admin'].includes(req.user.role)
    if (!isCourseStaff && folder.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not your folder' })
    }
    if (req.user.role === 'cr' && folder.batchId && folder.batchId !== req.user.batch) {
      return res.status(403).json({ success: false, error: 'Not your folder' })
    }

    let newItems = req.body.items || req.body.order

    if (!Array.isArray(newItems)) {
      return res.status(400).json({ success: false, error: 'items must be an array' })
    }

    const normalized = newItems.map((it) => ({
      ref: toObjectId(it.ref || it.id),
      type: it.type,
      title: it.title || '',
      thumbnail: it.thumbnail || '',
    }))

    const valid = normalized.every((it) => it.ref && it.type)
    if (!valid) return res.status(400).json({ success: false, error: 'Each item needs a valid ref and type' })

    const existingRefs = new Set(folder.items.map((i) => i.ref.toString() + ':' + i.type))
    const incomingRefs = new Set(normalized.map((i) => i.ref.toString() + ':' + i.type))

    if (existingRefs.size !== incomingRefs.size) {
      return res.status(400).json({ success: false, error: 'Reordered set does not match existing items' })
    }
    for (const key of existingRefs) {
      if (!incomingRefs.has(key)) {
        return res.status(400).json({ success: false, error: 'Reordered set does not match existing items' })
      }
    }

    const seen = new Set()
    for (const it of normalized) {
      const key = it.ref.toString() + ':' + it.type
      if (seen.has(key)) return res.status(400).json({ success: false, error: 'Duplicate item in order' })
      seen.add(key)
    }

    for (const it of normalized) {
      const original = folder.items.find(
        (i) => i.ref.toString() === it.ref.toString() && i.type === it.type
      )
      if (original) {
        it.title = original.title || it.title
        it.thumbnail = original.thumbnail || it.thumbnail
      }
    }

    folder.items = normalized
    folder.updatedBy = req.user._id
    await folder.save()

    res.json({ success: true, data: folder })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

router.delete('/:id/items/:itemId', protect, guard('cr', 'super_admin', 'admin'), async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id)
    if (!folder) return res.status(404).json({ success: false, error: 'Folder not found' })

    const isCourseStaff = ['admin', 'super_admin'].includes(req.user.role)
    if (!isCourseStaff && folder.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not your folder' })
    }
    if (req.user.role === 'cr' && folder.batchId && folder.batchId !== req.user.batch) {
      return res.status(403).json({ success: false, error: 'Not your folder' })
    }

    const itemId = toObjectId(req.params.itemId)
    if (!itemId) return res.status(400).json({ success: false, error: 'Invalid item id' })

    const itemIndex = folder.items.findIndex((i) => i.ref.toString() === itemId.toString())
    if (itemIndex === -1) return res.status(404).json({ success: false, error: 'Item not in folder' })

    folder.items.splice(itemIndex, 1)
    folder.updatedBy = req.user._id
    await folder.save()

    res.json({ success: true, message: 'Item removed from folder' })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

module.exports = router
