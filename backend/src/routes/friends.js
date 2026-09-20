const express = require('express')
const router = express.Router()
const User = require('../models/User')
const FriendRequest = require('../models/FriendRequest')
const { protect } = require('../middleware/auth')
const { createNotification } = require('../utils/notification')

// @route   POST /api/friends/request
// @desc    Send a friend request
// @access  Private
router.post('/request', protect, async (req, res) => {
  try {
    const { recipientId } = req.body
    const senderId = req.user._id

    if (recipientId.toString() === senderId.toString()) {
      return res.status(400).json({ success: false, error: 'You cannot send a friend request to yourself' })
    }

    const recipient = await User.findById(recipientId)
    if (!recipient) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    const alreadyFriends = (recipient.friends || []).some(
      id => id.toString() === senderId.toString()
    )
    if (alreadyFriends) {
      return res.status(400).json({ success: false, error: 'You are already friends' })
    }

    const existing = await FriendRequest.findOne({
      $or: [
        { sender: senderId, recipient: recipientId },
        { sender: recipientId, recipient: senderId },
      ],
    })

    if (existing) {
      if (existing.status === 'pending') {
        return res.status(400).json({ success: false, error: 'A friend request is already pending' })
      }
      if (existing.status === 'accepted') {
        return res.status(400).json({ success: false, error: 'You are already friends' })
      }
      existing.status = 'pending'
      existing.updatedAt = new Date()
      await existing.save()
    } else {
      await FriendRequest.create({
        sender: senderId,
        recipient: recipientId,
        status: 'pending',
      })
    }

    const io = req.app.get('io')
    await createNotification({
      recipient: recipientId,
      actor: senderId,
      type: 'friend_request',
      title: `${req.user.name || 'Someone'} sent you a friend request`,
      message: '',
      link: `/profile/${senderId}`,
      entityId: senderId,
      entityType: 'User',
      io,
    })

    res.status(201).json({ success: true, message: 'Friend request sent' })
  } catch (err) {
    res.status(400).json({ success: false, error: 'Request could not be completed.' })
  }
})

// @route   POST /api/friends/:userId/accept
// @desc    Accept a pending friend request from another user
// @access  Private
router.post('/:userId/accept', protect, async (req, res) => {
  try {
    const senderId = req.params.userId
    const recipientId = req.user._id

    if (senderId.toString() === recipientId.toString()) {
      return res.status(400).json({ success: false, error: 'Invalid request' })
    }

    const request = await FriendRequest.findOne({
      sender: senderId,
      recipient: recipientId,
      status: 'pending',
    })

    if (!request) {
      return res.status(404).json({ success: false, error: 'Friend request not found' })
    }

    const [senderUser, recipientUser] = await Promise.all([
      User.findById(request.sender),
      User.findById(request.recipient),
    ])

    request.status = 'accepted'
    await request.save()

    if (!senderUser.friends) senderUser.friends = []
    if (!recipientUser.friends) recipientUser.friends = []

    if (!senderUser.friends.some(id => id.toString() === request.recipient.toString())) {
      senderUser.friends.push(request.recipient)
    }
    if (!recipientUser.friends.some(id => id.toString() === request.sender.toString())) {
      recipientUser.friends.push(request.sender)
    }

    await Promise.all([senderUser.save(), recipientUser.save()])

    const io = req.app.get('io')
    await createNotification({
      recipient: request.sender,
      actor: request.recipient,
      type: 'friend_accepted',
      title: `${req.user.name || 'Someone'} accepted your friend request`,
      message: 'You are now friends',
      link: `/profile/${request.recipient}`,
      entityId: request.recipient,
      entityType: 'User',
      io,
    })

    res.json({
      success: true,
      data: {
        friend: {
          _id: senderUser._id,
          name: senderUser.name,
          photo: senderUser.photo,
          rollNumber: senderUser.rollNumber,
          batch: senderUser.batch,
          role: senderUser.role,
          profile: { department: senderUser.profile?.department || '' },
        },
        friendsCount: recipientUser.friends.length,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// @route   POST /api/friends/:userId/reject
// @desc    Reject a pending friend request from another user
// @access  Private
router.post('/:userId/reject', protect, async (req, res) => {
  try {
    const senderId = req.params.userId
    const recipientId = req.user._id

    const request = await FriendRequest.findOne({
      sender: senderId,
      recipient: recipientId,
      status: 'pending',
    })

    if (!request) {
      return res.status(404).json({ success: false, error: 'Friend request not found' })
    }

    request.status = 'rejected'
    await request.save()

    res.json({ success: true, message: 'Friend request rejected' })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// @route   DELETE /api/friends/:id/remove
// @desc    Remove a friend
// @access  Private
router.delete('/:id/remove', protect, async (req, res) => {
  try {
    const friendId = req.params.id
    const currentUserId = req.user._id

    const [currentUser, friendUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(friendId),
    ])

    if (!currentUser || !friendUser) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    currentUser.friends = (currentUser.friends || []).filter(
      id => id.toString() !== friendId
    )
    friendUser.friends = (friendUser.friends || []).filter(
      id => id.toString() !== currentUserId.toString()
    )

    await Promise.all([currentUser.save(), friendUser.save()])

    await FriendRequest.deleteMany({
      $or: [
        { sender: currentUserId, recipient: friendId },
        { sender: friendId, recipient: currentUserId },
      ],
    })

    res.json({ success: true, message: 'Friend removed' })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// @route   GET /api/friends/:id/list
// @desc    Get friends list of a user
// @access  Public
router.get('/:id/list', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('friends')
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    const friends = await User.find({ _id: { $in: user.friends || [] } })
      .select('name rollNumber batch role photo profile.department lastActive')
      .sort({ name: 1 })
      .limit(100)

    const formatted = friends.map(f => ({
      _id: f._id,
      name: f.name,
      rollNumber: f.rollNumber,
      batch: f.batch,
      role: f.role,
      photo: f.photo,
      department: f.profile?.department || '',
      lastActive: f.lastActive,
    }))

    res.json({ success: true, data: formatted })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// @route   GET /api/friends/requests
// @desc    Get pending friend requests received by current user
// @access  Private
router.get('/requests', protect, async (req, res) => {
  try {
    const { status = 'pending' } = req.query
    const requests = await FriendRequest.find({
      recipient: req.user._id,
      status,
    })
      .populate('sender', 'name rollNumber batch role photo profile.department')
      .sort({ createdAt: -1 })

    const formatted = requests.map(r => ({
      _id: r._id,
      sender: {
        _id: r.sender._id,
        name: r.sender.name,
        rollNumber: r.sender.rollNumber,
        batch: r.sender.batch,
        role: r.sender.role,
        photo: r.sender.photo,
        department: r.sender.profile?.department || '',
      },
      status: r.status,
      createdAt: r.createdAt,
    }))

    res.json({ success: true, data: formatted })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

module.exports = router
