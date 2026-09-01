const express = require('express')
const YTLecture = require('../models/YTLecture')
const { protect, guard, optionalAuth } = require('../middleware/auth')
const { createActivity } = require('../utils/activity')
const { createNotificationBulk } = require('../utils/notification')

const router = express.Router()

function extractYouTubeId(input) {
  if (!input) return null
  const trimmed = input.trim()
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ]
  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match) return match[1]
  }
  return null
}

// ── GET /api/yt-lectures ─────────────────────────────────────────────────────
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { semester, subject } = req.query
    const filter = {}
    if (semester) filter.semester = Number(semester)
    if (subject) filter.subject = subject

    const lectures = await YTLecture.find(filter)
      .populate('uploadedBy', 'name')
      .sort({ lectureNumber: 1, createdAt: -1 })

    res.json({ success: true, data: lectures })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── POST /api/yt-lectures ────────────────────────────────────────────────────
router.post('/', protect, guard('cr', 'super_admin', 'admin'), async (req, res) => {
  try {
    const { title, lectureNumber, youtubeVideoId, semester, subject } = req.body

    const videoId = extractYouTubeId(youtubeVideoId)
    if (!videoId) {
      return res.status(400).json({ success: false, error: 'Invalid YouTube URL or video ID' })
    }

    if (!title || !lectureNumber) {
      return res.status(400).json({ success: false, error: 'Title and lecture number are required' })
    }

    const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

    const lecture = await YTLecture.create({
      title,
      lectureNumber: Number(lectureNumber),
      youtubeVideoId: videoId,
      thumbnail,
      semester: semester ? Number(semester) : null,
      subject: subject || '',
      uploadedBy: req.user._id,
      batchId: req.user.role === 'cr' ? req.user.batch : (req.body.batchId || ''),
      visibility: 'GLOBAL',
    })

    await createActivity(
      req.user._id,
      'resource_uploaded',
      title,
      `Added YT Lecture ${lectureNumber}: ${title}`,
      '/resources'
    )

    const io = req.app.get('io')
    const User = require('../models/User')
    let recipientQuery = { role: { $in: ['student', 'cr'] }, isActive: true }
    if (lecture.batchId) {
      recipientQuery.batch = lecture.batchId
    }
    const recipients = await User.find(recipientQuery).select('_id')
    const recipientIds = recipients
      .map(r => r._id.toString())
      .filter(id => id !== req.user._id.toString())
    if (recipientIds.length > 0) {
      await createNotificationBulk({
        recipients: recipientIds,
        actor: req.user._id,
        type: 'resource_uploaded',
        title: `New YT Lecture: ${title}`,
        message: subject || `Lecture ${lectureNumber}`,
        link: '/resources',
        entityId: lecture._id,
        entityType: 'YTLecture',
        io,
      })
    }

    res.status(201).json({ success: true, data: lecture })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── PUT /api/yt-lectures/:id ─────────────────────────────────────────────────
router.put('/:id', protect, guard('cr', 'super_admin', 'admin'), async (req, res) => {
  try {
    const lecture = await YTLecture.findById(req.params.id)
    if (!lecture) return res.status(404).json({ success: false, error: 'Not found' })

    if (req.user.role === 'cr' && lecture.batchId !== req.user.batch) {
      return res.status(403).json({ success: false, error: 'Not your upload' })
    }

    const { title, lectureNumber, youtubeVideoId, semester, subject } = req.body
    const updates = {
      title: title || lecture.title,
      lectureNumber: lectureNumber ? Number(lectureNumber) : lecture.lectureNumber,
      semester: semester !== undefined ? Number(semester) : lecture.semester,
      subject: subject !== undefined ? subject : lecture.subject,
    }

    if (youtubeVideoId) {
      const videoId = extractYouTubeId(youtubeVideoId)
      if (!videoId) {
        return res.status(400).json({ success: false, error: 'Invalid YouTube URL or video ID' })
      }
      updates.youtubeVideoId = videoId
      updates.thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    }

    const updated = await YTLecture.findByIdAndUpdate(req.params.id, updates, { new: true })
    res.json({ success: true, data: updated })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── DELETE /api/yt-lectures/:id ──────────────────────────────────────────────
router.delete('/:id', protect, guard('cr', 'super_admin', 'admin'), async (req, res) => {
  try {
    const lecture = await YTLecture.findById(req.params.id)
    if (!lecture) return res.status(404).json({ success: false, error: 'Not found' })

    if (req.user.role === 'cr' && lecture.batchId !== req.user.batch) {
      return res.status(403).json({ success: false, error: 'Not your upload' })
    }

    await lecture.deleteOne()
    res.json({ success: true, message: 'YT Lecture deleted' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
