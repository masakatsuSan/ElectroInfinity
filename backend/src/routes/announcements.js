const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { protect, guard, optionalAuth } = require('../middleware/auth');

// @route   GET /api/announcements
// @desc    Get all announcements (public, with optional auth for personalization)
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { targetAudience, batch, section, page = 1, limit = 20 } = req.query;
    const query = {};

    if (targetAudience) {
      query.targetAudience = targetAudience;
    } else {
      query.$or = [
        { targetAudience: 'all' },
        { targetAudience: { $exists: false } }
      ];
    }

    if (batch) {
      query.$or = [
        { batchId: batch },
        { batchId: { $exists: false } }
      ];
    }

    if (section) {
      query.$or = [
        { section: section },
        { section: { $exists: false } }
      ];
    }

    if (req.user) {
      query.$or = [
        { targetAudience: 'all' },
        { batchId: req.user.batch, section: req.user.section },
        { batchId: req.user.batch, targetAudience: 'batch' },
        { targetAudience: { $exists: false } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const announcements = await Announcement.find(query)
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('postedBy', 'name role');

    const total = await Announcement.countDocuments(query);

    res.json({
      success: true,
      count: announcements.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: announcements
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/announcements/:id
// @desc    Get a single announcement
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('postedBy', 'name role');

    if (!announcement) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }

    if (req.user) {
      announcement.readBy = announcement.readBy || [];
      const hasRead = announcement.readBy.some(id => id.toString() === req.user.id);
      if (!hasRead) {
        announcement.readBy.push(req.user.id);
        await announcement.save();
      }
    }

    res.json({ success: true, data: announcement });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   POST /api/announcements
// @desc    Create an announcement
// @access  Private (cr, admin, super_admin, faculty)
router.post('/', protect, guard('cr', 'admin', 'super_admin', 'faculty'), async (req, res) => {
  try {
    req.body.postedBy = req.user.id;
    const announcement = await Announcement.create(req.body);
    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// @route   PATCH /api/announcements/:id
// @desc    Update an announcement
// @access  Private (cr, admin, super_admin)
router.patch('/:id', protect, guard('cr', 'admin', 'super_admin'), async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }
    Object.assign(announcement, req.body);
    await announcement.save();
    res.json({ success: true, data: announcement });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// @route   DELETE /api/announcements/:id
// @desc    Delete an announcement
// @access  Private (admin, super_admin)
router.delete('/:id', protect, guard('admin', 'super_admin'), async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }
    await announcement.deleteOne();
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   PUT /api/announcements/:id/read
// @desc    Mark announcement as read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }

    announcement.readBy = announcement.readBy || [];
    if (!announcement.readBy.some(id => id.toString() === req.user.id)) {
      announcement.readBy.push(req.user.id);
      await announcement.save();
    }

    res.json({ success: true, data: announcement });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
