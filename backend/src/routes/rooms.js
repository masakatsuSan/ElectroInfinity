const express = require('express');
const router = express.Router();
const CommunityRoom = require('../models/CommunityRoom');
const { protect, guard } = require('../middleware/auth');

// @route   GET /api/rooms
// @desc    Get all community rooms (public list)
// @access  Public (optionalAuth)
router.get('/', async (req, res) => {
  try {
    const rooms = await CommunityRoom.find({ isActive: true })
      .sort({ isPopular: -1, postCount: -1, name: 1 })
      .select('name description icon color isPopular postCount lastActivity createdAt')
    res.json({ success: true, count: rooms.length, data: rooms });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/rooms/:id
// @desc    Get a single community room
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const room = await CommunityRoom.findById(req.params.id)
      .select('name description icon color isPopular postCount lastActivity createdAt');
    if (!room || !room.isActive) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    res.json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   POST /api/rooms
// @desc    Create a community room
// @access  Private (cr, admin, super_admin)
router.post('/', protect, guard('cr', 'admin', 'super_admin'), async (req, res) => {
  try {
    req.body.createdBy = req.user.id;
    const room = await CommunityRoom.create(req.body);
    res.status(201).json({ success: true, data: room });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Room name already exists' });
    }
    res.status(400).json({ success: false, error: error.message });
  }
});

// @route   PATCH /api/rooms/:id
// @desc    Update a community room
// @access  Private (cr, admin, super_admin)
router.patch('/:id', protect, guard('cr', 'admin', 'super_admin'), async (req, res) => {
  try {
    const room = await CommunityRoom.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    Object.assign(room, req.body);
    await room.save();
    res.json({ success: true, data: room });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    res.status(400).json({ success: false, error: error.message });
  }
});

// @route   DELETE /api/rooms/:id
// @desc    Soft delete a community room
// @access  Private (admin, super_admin)
router.delete('/:id', protect, guard('admin', 'super_admin'), async (req, res) => {
  try {
    const room = await CommunityRoom.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    room.isActive = false;
    await room.save();
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
