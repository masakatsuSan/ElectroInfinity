const express = require('express')
const router = express.Router()
const User = require('../models/User')
const Activity = require('../models/Activity')
const Badge = require('../models/Badge')
const Project = require('../models/Project')
const ForumPost = require('../models/ForumPost')
const Resource = require('../models/Resource')
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
      followers: user.followers?.length || 0,
      following: user.following?.length || 0,
      badges: user.badges || [],
      collegeEmail: user.collegeEmail || '',
      personalEmail: user.personalEmail || '',
      phone: user.phone || '',
      projects: projectCount,
      forumPosts: postCount,
      resourcesUploaded: resourceCount,
      isOwn,
      isFollowing: viewer ? user.followers?.some(id => id.toString() === viewer._id.toString()) : false,
      followsMe: viewer ? user.following?.some(id => id.toString() === viewer._id.toString()) : false,
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
        const isFriend = viewer && user.followers?.some(id => id.toString() === viewer._id.toString())
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

const QRCode = require('qrcode')

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
        .select('name rollNumber batch semester role photo email profile.department profile.skills profile.socialLinks profile.interests followers following')
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
      followers: u.followers?.length || 0,
      following: u.following?.length || 0,
      isFollowing: viewerId ? u.followers?.some(id => id.toString() === viewerId.toString()) : false,
      followsMe: viewerId ? u.following?.some(id => id.toString() === viewerId.toString()) : false,
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

// ── GET /api/profile/:id/qr ──────────────────────────────────────────────
// Generate QR code for a user profile
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
          department: user.profile?.department || '',
        },
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── POST /api/profile/:id/follow ──────────────────────────────────────────
router.post('/:id/follow', protect, async (req, res) => {
  try {
    const targetId = req.params.id
    const currentUserId = req.user._id

    if (targetId.toString() === currentUserId.toString()) {
      return res.status(400).json({ success: false, error: 'You cannot follow yourself' })
    }

    const targetUser = await User.findById(targetId)
    if (!targetUser) return res.status(404).json({ success: false, error: 'User not found' })

    const currentUser = await User.findById(currentUserId)
    const isFollowing = currentUser.following?.some(id => id.toString() === targetId)

    if (isFollowing) {
      currentUser.following = currentUser.following.filter(id => id.toString() !== targetId)
      targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUserId.toString())
    } else {
      currentUser.following = [...(currentUser.following || []), targetId]
      targetUser.followers = [...(targetUser.followers || []), currentUserId]
    }

    await currentUser.save()
    await targetUser.save()

    // Create notification for the follow action
    if (!isFollowing) {
      const io = req.app.get('io')
      const actorName = currentUser.name || 'Someone'
      await createNotification({
        recipient: targetId,
        actor: currentUserId,
        type: 'follow',
        title: `${actorName} started following you`,
        message: '',
        link: `/profile/${currentUserId}`,
        entityId: currentUserId,
        entityType: 'User',
        io,
      })

      // Check if it's a follow-back (mutual)
      const targetFollowsCurrent = targetUser.following?.some(
        (id) => id.toString() === currentUserId.toString()
      )
      if (targetFollowsCurrent) {
        await createNotification({
          recipient: currentUserId,
          actor: targetId,
          type: 'follow_back',
          title: `${targetUser.name || 'Someone'} followed you back`,
          message: 'You are now following each other',
          link: `/profile/${targetId}`,
          entityId: targetId,
          entityType: 'User',
          io,
        })
      }
    }

    res.json({
      success: true,
      data: {
        isFollowing: !isFollowing,
        followers: targetUser.followers.length,
        following: currentUser.following.length,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── GET /api/profile/:id/followers ────────────────────────────────────────
router.get('/:id/followers', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ success: false, error: 'User not found' })

    const followers = await User.find({ _id: { $in: user.followers || [] } })
      .select('name rollNumber batch role photo profile.department')
      .limit(50)

    res.json({ success: true, data: followers })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── GET /api/profile/:id/following ────────────────────────────────────────
router.get('/:id/following', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ success: false, error: 'User not found' })

    const following = await User.find({ _id: { $in: user.following || [] } })
      .select('name rollNumber batch role photo profile.department')
      .limit(50)

    res.json({ success: true, data: following })
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

module.exports = router
