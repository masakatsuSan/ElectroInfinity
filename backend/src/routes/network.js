const express = require('express')
const router = express.Router()
const User = require('../models/User')
const { protect, optionalAuth } = require('../middleware/auth')

// @route   GET /api/network/college
// @desc    Get all active college mates with follow status
// @access  Private (authenticated users only)
router.get('/college', protect, async (req, res) => {
  try {
    const { q } = req.query
    const currentUserId = req.user._id

    const query = {
      role: { $in: ['student', 'cr', 'faculty'] },
      isActive: true,
      _id: { $ne: currentUserId },
    }

    if (q && q.trim().length >= 2) {
      query.$or = [
        { name: { $regex: q.trim(), $options: 'i' } },
        { rollNumber: { $regex: q.trim(), $options: 'i' } },
        { 'profile.department': { $regex: q.trim(), $options: 'i' } },
        { 'profile.skills': { $in: [new RegExp(q.trim(), 'i')] } },
        { 'profile.interests': { $in: [new RegExp(q.trim(), 'i')] } },
      ]
    }

    const users = await User.find(query)
      .select('name rollNumber batch semester role photo profile.department profile.skills profile.interests followers following')
      .sort({ name: 1 })
      .limit(100)

    const formatted = users.map(u => ({
      _id: u._id,
      name: u.name,
      rollNumber: u.rollNumber,
      batch: u.batch,
      semester: u.semester,
      role: u.role,
      photo: u.photo,
      department: u.profile?.department || '',
      skills: u.profile?.skills || [],
      interests: u.profile?.interests || [],
      followers: u.followers?.length || 0,
      following: u.following?.length || 0,
      isFollowing: u.followers?.some(id => id.toString() === currentUserId.toString()),
      followsMe: u.following?.some(id => id.toString() === currentUserId.toString()),
    }))

    res.json({ success: true, data: formatted })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
