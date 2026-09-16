const express = require('express')
const router = express.Router()
const User = require('../models/User')
const Activity = require('../models/Activity')
const Badge = require('../models/Badge')
const Project = require('../models/Project')
const Gallery = require('../models/Gallery')
const Achievement = require('../models/Achievement')
const ForumPost = require('../models/ForumPost')
const Resource = require('../models/Resource')
const FriendRequest = require('../models/FriendRequest')
const { protect, guard, optionalAuth } = require('../middleware/auth')
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../utils/upload')
const { createActivity } = require('../utils/activity')
const { createNotification } = require('../utils/notification')

// ── Helpers ───────────────────────────────────────────────────────────────

function computeCompleteness(user) {
  const p = user.profile || {}
  const required = [
    !!user.name,
    !!p.bio?.trim(),
    !!p.department?.trim(),
    !!user.semester,
    (p.skills?.length || 0) > 0,
    !!user.photo,
    !!p.coverPhoto,
    !!user.collegeEmail?.trim(),
  ]
  const filled = required.filter(Boolean).length
  const percentage = Math.round((filled / required.length) * 100)
  const missing = []
  if (!user.name) missing.push('Full Name')
  if (!p.bio?.trim()) missing.push('Bio')
  if (!p.department?.trim()) missing.push('Department')
  if (!user.semester) missing.push('Semester')
  if ((p.skills?.length || 0) === 0) missing.push('Skills')
  if (!user.photo) missing.push('Profile Photo')
  if (!p.coverPhoto) missing.push('Cover Photo')
  if (!user.collegeEmail?.trim()) missing.push('College Email')
  if ((Object.values(p.socialLinks || {}).filter(Boolean).length === 0)) missing.push('Social Links')
  return { percentage, missing }
}

// ── GET /api/profile/search ───────────────────────────────────────────────
// Enhanced search with filters, pagination, and fuzzy matching
// Query: q, department, semester, batch, role, page, limit
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { q, department, semester, batch, role, page = 1, limit = 20 } = req.query
    const query = {
      isActive: true,
    }

    if (q && q.trim().length >= 1) {
      const regex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      query.$or = [
        { name: regex },
        { rollNumber: regex },
        { regNumber: regex },
        { email: regex },
        { collegeEmail: regex },
        { 'profile.department': regex },
        { 'profile.skills': { $in: [regex] } },
        { 'profile.interests': { $in: [regex] } },
      ]
    }

    if (department) {
      query['profile.department'] = new RegExp(department, 'i')
    }

    if (semester) {
      query.semester = Number(semester)
    }

    if (batch) {
      query.batch = new RegExp(batch, 'i')
    }

    if (role && ['student', 'cr', 'faculty'].includes(role)) {
      query.role = role
    } else {
      query.role = { $in: ['student', 'cr', 'faculty'] }
    }

    const skip = (Number(page) - 1) * Number(limit)
    const [users, total] = await Promise.all([
      User.find(query)
        .select('name rollNumber batch semester role photo email profile.department profile.skills profile.socialLinks profile.interests friends')
        .sort({ name: 1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query),
    ])

    const viewerId = req.user?._id
    const formatted = users.map(u => ({
      _id: u._id,
      name: u.name,
      rollNumber: u.rollNumber,
      email: u.email,
      batch: u.batch,
      semester: u.semester,
      role: u.role,
      photo: u.photo,
      department: u.profile?.department || '',
      skills: u.profile?.skills || [],
      interests: u.profile?.interests || [],
      socialLinks: u.profile?.socialLinks || {},
      friends: u.friends?.length || 0,
      friendStatus: viewerId
        ? (u.friends || []).some(id => id.toString() === viewerId.toString())
          ? 'friends'
          : 'none'
        : 'none',
    }))

    res.json({
      success: true,
      data: formatted,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── GET /api/profile/trending ──────────────────────────────────────────────
router.get('/trending', optionalAuth, async (req, res) => {
  try {
    const viewerId = req.user?._id
    const trending = await User.find({ isActive: true, role: { $in: ['student', 'cr', 'faculty'] } })
      .select('name rollNumber batch semester role photo profile.department friends')
      .sort({ lastActive: -1, friends: -1 })
      .limit(10)

    let friendStatusMap = new Map()
    if (viewerId) {
      const currentUser = await User.findById(viewerId).select('friends')
      const currentFriendIds = (currentUser?.friends || []).map(id => id.toString())

      const pendingRequests = await FriendRequest.find({
        $or: [
          { sender: viewerId, status: 'pending' },
          { recipient: viewerId, status: 'pending' },
        ],
      })

      pendingRequests.forEach(r => {
        if (r.sender.toString() === viewerId.toString()) {
          friendStatusMap.set(r.recipient.toString(), 'pending_sent')
        } else {
          friendStatusMap.set(r.sender.toString(), 'pending_received')
        }
      })
    }

    const formatted = trending.map(u => {
      const friendIds = (u.friends || []).map(id => id.toString())
      let friendStatus = 'none'
      if (viewerId) {
        const isFriend = friendIds.includes(viewerId.toString())
        if (isFriend) {
          friendStatus = 'friends'
        } else {
          friendStatus = friendStatusMap.get(u._id.toString()) || 'none'
        }
      }
      return {
        _id: u._id,
        name: u.name,
        rollNumber: u.rollNumber,
        batch: u.batch,
        semester: u.semester,
        role: u.role,
        photo: u.photo,
        department: u.profile?.department || '',
        friendStatus,
      }
    })

    res.json({ success: true, data: formatted })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── GET /api/profile/suggested ─────────────────────────────────────────────
router.get('/suggested', optionalAuth, async (req, res) => {
  try {
    const viewerId = req.user?._id
    const pipeline = []

    if (viewerId) {
      const viewer = await User.findById(viewerId).select('friends')
      const friendIds = (viewer?.friends || []).map(id => id.toString())

      pipeline.push(
        { $match: { _id: { $ne: viewerId, $nin: friendIds.map(id => require('mongoose').Types.ObjectId(id)) } } }
      )
    }

    pipeline.push(
      { $match: { isActive: true, role: { $in: ['student', 'cr', 'faculty'] } } },
      { $sort: { lastActive: -1 } },
      { $limit: 20 }
    )

    const users = await User.aggregate(pipeline)

    let friendStatusMap = new Map()
    if (viewerId) {
      const currentUser = await User.findById(viewerId).select('friends')
      const currentFriendIds = (currentUser?.friends || []).map(id => id.toString())

      const pendingRequests = await FriendRequest.find({
        $or: [
          { sender: viewerId, status: 'pending' },
          { recipient: viewerId, status: 'pending' },
        ],
      })

      pendingRequests.forEach(r => {
        if (r.sender.toString() === viewerId.toString()) {
          friendStatusMap.set(r.recipient.toString(), 'pending_sent')
        } else {
          friendStatusMap.set(r.sender.toString(), 'pending_received')
        }
      })
    }

    const formatted = users.map(u => {
      const friendIds = (u.friends || []).map(id => id.toString())
      let friendStatus = 'none'
      if (viewerId) {
        const isFriend = friendIds.includes(viewerId.toString())
        if (isFriend) {
          friendStatus = 'friends'
        } else {
          friendStatus = friendStatusMap.get(u._id.toString()) || 'none'
        }
      }
      return {
        _id: u._id,
        name: u.name,
        rollNumber: u.rollNumber,
        batch: u.batch,
        semester: u.semester,
        role: u.role,
        photo: u.photo,
        department: u.profile?.department || '',
        friendStatus,
      }
    })

    res.json({ success: true, data: formatted })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── GET /api/profile/badges ───────────────────────────────────────────────
router.get('/badges', async (req, res) => {
  try {
    const badges = await Badge.find().sort({ createdAt: -1 })
    res.json({ success: true, data: badges })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── POST /api/profile/badges (admin) ──────────────────────────────────────
router.post('/badges', protect, guard('super_admin', 'admin'), async (req, res) => {
  try {
    const badge = await Badge.create(req.body)
    res.status(201).json({ success: true, data: badge })
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
})

// ── GET /api/profile/me/completeness ──────────────────────────────────────
router.get('/me/completeness', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ success: false, error: 'User not found' })

    const { percentage, missing } = computeCompleteness(user)
    res.json({ success: true, data: { percentage, missing } })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── GET /api/profile/me/uploads ──────────────────────────────────────────
// Returns the authenticated user's uploads across Gallery, Achievements,
// Projects.
router.get('/me/uploads', protect, async (req, res) => {
  try {
    const userId = req.user._id

    const [gallery, achievements, projects] = await Promise.all([
      Gallery.find({ uploadedBy: userId }).sort({ createdAt: -1 }),
      Achievement.find({ author: userId }).sort({ createdAt: -1 }),
      Project.find({ author: userId }).sort({ createdAt: -1 }),
    ])

    const galleryItems = gallery.map((g) => ({
      _id: g._id,
      kind: 'gallery',
      title: g.title,
      category: g.category,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
      date: g.date,
      thumb: g.imageUrl || '',
      meta: {},
    }))

    const achievementItems = achievements.map((a) => ({
      _id: a._id,
      kind: 'achievement',
      title: a.title,
      category: a.category,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      date: a.date,
      thumb: a.image || '',
      meta: { description: a.description },
    }))

    const projectItems = projects.map((p) => ({
      _id: p._id,
      kind: 'project',
      title: p.title,
      category: 'project',
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      date: p.createdAt,
      thumb: p.thumbnail || (p.images && p.images[0]) || '',
      meta: { techStack: p.techStack || [] },
    }))

    const all = [...galleryItems, ...achievementItems, ...projectItems].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    )

    res.json({ success: true, data: all })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── GET /api/profile/me/views ──────────────────────────────────────────
// Returns recent profile views for the authenticated user
router.get('/me/views', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('profileViews.viewer', 'name rollNumber role photo profile.department')
    if (!user) return res.status(404).json({ success: false, error: 'User not found' })

    const formatted = (user.profileViews || []).map(v => ({
      _id: v.viewer?._id,
      name: v.viewer?.name || 'Unknown',
      rollNumber: v.viewer?.rollNumber || '',
      role: v.viewer?.role || 'student',
      photo: v.viewer?.photo || '',
      department: v.viewer?.profile?.department || '',
      viewedAt: v.viewedAt,
    })).reverse()

    res.json({ success: true, data: formatted })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── POST /api/profile/:id/view ─────────────────────────────────────────
// Record a profile view from the authenticated user to the target profile
router.post('/:id/view', protect, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.json({ success: true, data: { message: 'Own profile view skipped' } })
    }

    const targetUser = await User.findById(req.params.id)
    if (!targetUser) return res.status(404).json({ success: false, error: 'User not found' })

    const visibility = targetUser.profile?.profileVisibility || 'public'
    if (visibility === 'private') {
      return res.json({ success: true, data: { message: 'Profile is private' } })
    }

    if (visibility === 'friends') {
      const isFriend = (targetUser.friends || []).some(id => id.toString() === req.user._id.toString())
      if (!isFriend) {
        return res.json({ success: true, data: { message: 'Profile visible to friends only' } })
      }
    }

    const existing = (targetUser.profileViews || []).find(v => v.viewer?.toString() === req.user._id.toString())
    if (existing) {
      existing.viewedAt = new Date()
    } else {
      targetUser.profileViews.push({ viewer: req.user._id, viewedAt: new Date() })
    }

    if (targetUser.profileViews.length > 200) {
      targetUser.profileViews = targetUser.profileViews.slice(-200)
    }

    await targetUser.save()

    try {
      await createActivity(req.user._id, 'profile_view', `${req.user.name} viewed your profile`, '', `/profile/${targetUser._id}`)
    } catch (_) {}

    res.json({ success: true, data: { message: 'Profile view recorded' } })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── GET /api/profile/:id/qr ──────────────────────────────────────────────
// Generate QR code for a user profile
const QRCode = require('qrcode')

router.get('/:id/qr', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name rollNumber batch semester role photo profile.department')
    if (!user) return res.status(404).json({ success: false, error: 'User not found' })

    const profileUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/profile/${user._id}`

    const qrDataUrl = await QRCode.toDataURL(profileUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#111827',
        light: '#ffffff',
      },
    })

    res.json({
      success: true,
      data: {
        qrCode: qrDataUrl,
        profileUrl,
        user: {
          _id: user._id,
          name: user.name,
          rollNumber: user.rollNumber,
          batch: user.batch,
          semester: user.semester,
          role: user.role,
          photo: user.photo,
          department: u.profile?.department || '',
        },
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── POST /api/profile/:userId/badges ──────────────────────────────────────
router.post('/:userId/badges', protect, async (req, res) => {
  try {
    const { badgeId } = req.body
    if (!badgeId) return res.status(400).json({ success: false, error: 'badgeId required' })

    const badge = await Badge.findById(badgeId)
    if (!badge) return res.status(404).json({ success: false, error: 'Badge not found' })

    const targetUser = await User.findById(req.params.userId)
    if (!targetUser) return res.status(404).json({ success: false, error: 'User not found' })

    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin'
    const isSelf = req.user._id.toString() === req.params.userId.toString()

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ success: false, error: 'Not authorized to award this badge' })
    }

    if (!targetUser.badges) targetUser.badges = []
    if (!targetUser.badges.includes(badgeId)) {
      targetUser.badges.push(badgeId)
      await targetUser.save()
    }

    res.json({ success: true, data: targetUser })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── GET /api/profile/:id ──────────────────────────────────────────────────
// Public profile view — id is user _id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -otp -otpExpiry')
    if (!user) return res.status(404).json({ success: false, error: 'User not found' })

    const viewer = req.user || null
    const isOwn = viewer && viewer._id.toString() === user._id.toString()

    const [projectCount, postCount, resourceCount] = await Promise.all([
      Project.countDocuments({ author: user._id, ...(isOwn ? {} : { isApproved: true }) }),
      ForumPost.countDocuments({ author: user._id }),
      Resource.countDocuments({ uploadedBy: user._id }),
    ])

    const profile = {
      _id: user._id,
      name: user.name,
      rollNumber: user.rollNumber,
      batch: user.batch,
      section: user.section,
      semester: user.semester,
      role: user.role,
      photo: user.photo,
      bio: user.profile?.bio || '',
      department: user.profile?.department || '',
      location: user.profile?.location || '',
      skills: user.profile?.skills || [],
      interests: user.profile?.interests || [],
      languages: user.profile?.languages || [],
      coverPhoto: user.profile?.coverPhoto || '',
      socialLinks: user.profile?.socialLinks || {},
      profileVisibility: user.profile?.profileVisibility || 'public',
      friends: user.friends?.length || 0,
      badges: user.badges || [],
      collegeEmail: user.collegeEmail || '',
      personalEmail: user.personalEmail || '',
      phone: user.phone || '',
      projects: projectCount,
      forumPosts: postCount,
      resourcesUploaded: resourceCount,
      isOwn,
    }

    if (viewer) {
      const viewerIdStr = viewer._id.toString()
      const isFriend = (user.friends || []).some(id => id.toString() === viewerIdStr)
      if (isFriend) {
        profile.friendStatus = 'friends'
      } else {
        const pending = await FriendRequest.findOne({
          sender: viewer._id,
          recipient: user._id,
          status: 'pending',
        })
        if (pending) {
          profile.friendStatus = 'pending_sent'
        } else {
          const pendingReceived = await FriendRequest.findOne({
            sender: user._id,
            recipient: viewer._id,
            status: 'pending',
          })
          if (pendingReceived) {
            profile.friendStatus = 'pending_received'
          } else {
            profile.friendStatus = 'none'
          }
        }
      }
    } else {
      profile.friendStatus = 'none'
    }

    // Apply privacy
    if (!isOwn) {
      const visibility = user.profile?.profileVisibility || 'public'
      if (visibility === 'private') {
        profile.bio = ''
        profile.skills = []
        profile.interests = []
        profile.languages = []
        profile.socialLinks = {}
        profile.personalEmail = ''
        profile.phone = ''
      } else if (visibility === 'friends') {
        const isFriend = viewer && (user.friends || []).some(id => id.toString() === viewer._id.toString())
        if (!isFriend) {
          profile.bio = profile.bio.slice(0, 100) + (profile.bio.length > 100 ? '…' : '')
          profile.skills = []
          profile.interests = []
          profile.languages = []
          profile.socialLinks = {}
          profile.personalEmail = ''
          profile.phone = ''
        }
      }
    }

    res.json({ success: true, data: profile })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── PATCH /api/profile/me ─────────────────────────────────────────────────
router.patch('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ success: false, error: 'User not found' })

    const allowedRoot = ['name', 'collegeEmail', 'personalEmail', 'phone', 'rollNumber', 'batch', 'section', 'semester']
    const allowedProfile = ['bio', 'department', 'location', 'skills', 'interests', 'languages', 'coverPhoto', 'coverPhotoPublicId', 'profileVisibility', 'socialLinks']

    allowedRoot.forEach(f => {
      if (req.body[f] !== undefined) user[f] = req.body[f]
    })

    allowedProfile.forEach(f => {
      if (req.body[f] !== undefined) {
        if (f === 'socialLinks') {
          user.profile = user.profile || {}
          user.profile.socialLinks = { ...(user.profile.socialLinks || {}), ...req.body[f] }
        } else {
          user.profile = user.profile || {}
          user.profile[f] = req.body[f]
        }
      }
    })

    // Recompute completeness
    const { percentage, missing } = computeCompleteness(user)
    user.profile = user.profile || {}
    user.profile.isProfileComplete = percentage >= 80

    await user.save()
    await createActivity(req.user._id, 'profile_updated', 'Updated profile', '', `/profile/${user._id}`)
    res.json({ success: true, data: user.toObject() })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── POST /api/profile/me/cover ────────────────────────────────────────────
router.post('/me/cover', protect, upload.single('cover'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No cover photo uploaded' })

    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ success: false, error: 'User not found' })

    // Delete old cover if exists
    if (user.profile?.coverPhotoPublicId) {
      await deleteFromCloudinary(user.profile.coverPhotoPublicId, 'image')
    }

    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'electro-infinity/covers',
      resource_type: 'image',
      transformation: [{ width: 1500, height: 500, crop: 'fill', quality: 'auto' }],
    })

    user.profile = user.profile || {}
    user.profile.coverPhoto = result.url
    user.profile.coverPhotoPublicId = result.publicId
    await user.save()
    await createActivity(req.user._id, 'profile_updated', 'Updated cover photo', '', `/profile/${user._id}`)

    res.json({ success: true, data: { coverPhoto: result.url, coverPhotoPublicId: result.publicId } })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── POST /api/profile/me/photo ────────────────────────────────────────────
router.post('/me/photo', protect, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No photo uploaded' })

    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ success: false, error: 'User not found' })

    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'electro-infinity/avatars',
      resource_type: 'image',
      transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }],
    })

    user.photo = result.url
    await user.save()
    await createActivity(req.user._id, 'profile_updated', 'Updated profile photo', '', `/profile/${user._id}`)

    res.json({ success: true, data: { photo: result.url } })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
