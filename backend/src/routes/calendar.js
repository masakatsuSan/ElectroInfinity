const express = require('express');
const router = express.Router();
const AcademicCalendar = require('../models/AcademicCalendar');
const { protect, guard, optionalAuth } = require('../middleware/auth');
const { createNotificationBulk } = require('../utils/notification');

// @route   GET /api/calendar
// @desc    Get academic calendar entries
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { batch, type, startDate, endDate, page = 1, limit = 50 } = req.query;
    const query = {};

    if (batch) {
      query.$or = [
        { batch: batch },
        { batch: { $exists: false } }
      ];
    }

    if (type) {
      query.type = type;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const entries = await AcademicCalendar.find(query)
      .sort({ date: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name role');

    const total = await AcademicCalendar.countDocuments(query);

    res.json({
      success: true,
      count: entries.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: entries
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/calendar/:id
// @desc    Get a single calendar entry
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const entry = await AcademicCalendar.findById(req.params.id)
      .populate('createdBy', 'name role');

    if (!entry) {
      return res.status(404).json({ success: false, error: 'Calendar entry not found' });
    }
    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   POST /api/calendar
// @desc    Create a calendar entry
// @access  Private (cr, admin, super_admin, faculty)
router.post('/', protect, guard('cr', 'admin', 'super_admin', 'faculty'), async (req, res) => {
  try {
    req.body.createdBy = req.user.id;
    const entry = await AcademicCalendar.create(req.body);

    // Notify relevant users about new calendar event
    const io = req.app.get('io')
    const User = require('../models/User')
    let recipientQuery = { role: { $in: ['student', 'cr'] }, isActive: true }
    if (entry.batch) {
      recipientQuery.batch = entry.batch
    }
    const recipients = await User.find(recipientQuery).select('_id')
    const recipientIds = recipients
      .map(r => r._id.toString())
      .filter(id => id !== req.user._id.toString())
    if (recipientIds.length > 0) {
      await createNotificationBulk({
        recipients: recipientIds,
        actor: req.user._id,
        type: 'calendar_event',
        title: `New calendar event: ${entry.title}`,
        message: `${entry.type} on ${new Date(entry.date).toLocaleDateString('en-IN')}`,
        link: '/calendar',
        entityId: entry._id,
        entityType: 'AcademicCalendar',
        io,
      })
    }

    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// @route   PATCH /api/calendar/:id
// @desc    Update a calendar entry
// @access  Private (cr, admin, super_admin)
router.patch('/:id', protect, guard('cr', 'admin', 'super_admin'), async (req, res) => {
  try {
    const entry = await AcademicCalendar.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, error: 'Calendar entry not found' });
    }
    Object.assign(entry, req.body);
    await entry.save();
    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// @route   DELETE /api/calendar/:id
// @desc    Delete a calendar entry
// @access  Private (cr, admin, super_admin)
router.delete('/:id', protect, guard('cr', 'admin', 'super_admin'), async (req, res) => {
  try {
    const entry = await AcademicCalendar.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, error: 'Calendar entry not found' });
    }
    await entry.deleteOne();
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
