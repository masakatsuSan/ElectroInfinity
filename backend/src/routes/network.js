const express = require('express')
const router = express.Router()
const User = require('../models/User')
const FriendRequest = require('../models/FriendRequest')
const { protect, optionalAuth } = require('../middleware/auth')

// Escape user input before it is embedded in a RegExp —
// an unescaped value is a ReDoS / regex-injection vector.
function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// @route   GET /api/network/college
// @desc    Get all active college mates with friend status
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
      const term = escapeRegex(q.trim())
      query.$or = [
        { name: { $regex: term, $options: 'i' } },
        { rollNumber: { $regex: term, $options: 'i' } },
        { 'profile.department': { $regex: term, $options: 'i' } },
        { 'profile.skills': { $in: [new RegExp(term, 'i')] } },
        { 'profile.interests': { $in: [new RegExp(term, 'i')] } },
      ]
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('name rollNumber batch semester role photo profile.department profile.skills profile.interests friends')
        .sort({ name: 1 })
        .lean(),
      User.countDocuments(query),
    ])

    const currentUser = await User.findById(currentUserId).select('friends').lean()
    const currentFriendIds = new Set((currentUser?.friends || []).map(id => id.toString()))

    const pendingRequests = await FriendRequest.find({
      $or: [
        { sender: currentUserId, status: 'pending' },
        { recipient: currentUserId, status: 'pending' },
      ],
    })

    const pendingMap = new Map()
    pendingRequests.forEach(r => {
      if (r.sender.toString() === currentUserId.toString()) {
        pendingMap.set(r.recipient.toString(), 'pending_sent')
      } else {
        pendingMap.set(r.sender.toString(), 'pending_received')
      }
    })

    const formatted = users.map(u => {
      const friendIds = (u.friends || []).map(id => id.toString())
      const mutualCount = friendIds.filter(id => currentFriendIds.has(id)).length
      const isFriend = currentFriendIds.has(currentUserId.toString())

      let friendStatus = 'none'
      if (isFriend) {
        friendStatus = 'friends'
      } else {
        friendStatus = pendingMap.get(u._id.toString()) || 'none'
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
        skills: u.profile?.skills || [],
        interests: u.profile?.interests || [],
        friends: u.friends?.length || 0,
        mutualCount,
        friendStatus,
      }
    })

    res.json({ success: true, data: formatted, total })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

module.exports = router
