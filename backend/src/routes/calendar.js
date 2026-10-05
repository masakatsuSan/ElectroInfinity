const express = require('express');
const router = express.Router();
const AcademicCalendar = require('../models/AcademicCalendar');
const { protect, guard, optionalAuth } = require('../middleware/auth');
const { createNotificationBulk } = require('../utils/notification');
const logger = require('../utils/logger');

// Fields a client may set. `createdBy` is always the session user.
const CALENDAR_FIELDS = ['title', 'description', 'type', 'date', 'batch', 'section', 'location'];
const CALENDAR_TYPES = ['event', 'exam', 'holiday', 'deadline', 'other'];

function pickCalendarFields(body) {
  const payload = {};
  for (const f of CALENDAR_FIELDS) {
    if (body[f] !== undefined) payload[f] = body[f];
  }
  if (payload.title !== undefined) {
    payload.title = String(payload.title).trim().slice(0, 200);
  }
  if (payload.description !== undefined) payload.description = String(payload.description).slice(0, 2000);
  if (payload.type !== undefined && !CALENDAR_TYPES.includes(payload.type)) {
    const err = new Error(`type must be one of: ${CALENDAR_TYPES.join(', ')}`);
    err.status = 400;
    throw err;
  }
  if (payload.batch !== undefined) payload.batch = String(payload.batch).trim().slice(0, 20);
  if (payload.section !== undefined) payload.section = String(payload.section).trim().slice(0, 10);
  if (payload.location !== undefined) payload.location = String(payload.location).trim().slice(0, 200);
  if (payload.date !== undefined) {
    const d = new Date(payload.date);
    if (isNaN(d.getTime())) {
      const err = new Error('date must be a valid date');
      err.status = 400;
      throw err;
    }
    payload.date = d;
  }
  return payload;
}

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
    res.status(500).json({ success: false, error: 'An internal server error occurred' });
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
    res.status(500).json({ success: false, error: 'An internal server error occurred' });
  }
});

// @route   POST /api/calendar
// @desc    Create a calendar entry
// @access  Private (cr, admin, super_admin, faculty)
router.post('/', protect, guard('cr', 'admin', 'super_admin', 'faculty'), async (req, res) => {
  try {
    // Mass-assignment defense: whitelisted fields only,
    // createdBy is always the authenticated user.
    const payload = pickCalendarFields(req.body);
    if (!payload.title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }
    payload.createdBy = req.user.id;
    const entry = await AcademicCalendar.create(payload);

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
    res.status(400).json({ success: false, error: 'Request could not be completed.' });
  }
});

// @route   PATCH /api/calendar/:id
// @desc    Update a calendar entry
// @access  Private (owner, admin, super_admin)
router.patch('/:id', protect, guard('cr', 'admin', 'super_admin'), async (req, res) => {
  try {
    const entry = await AcademicCalendar.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, error: 'Calendar entry not found' });
    }
    // IDOR defense: non-admins may only edit entries they created.
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
    const isOwner = entry.createdBy && entry.createdBy.toString() === req.user.id;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this entry' });
    }
    const payload = pickCalendarFields(req.body);
    Object.assign(entry, payload);
    await entry.save();
    res.json({ success: true, data: entry });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, error: error.message });
    res.status(400).json({ success: false, error: 'Request could not be completed.' });
  }
});

// @route   DELETE /api/calendar/:id
// @desc    Delete a calendar entry
// @access  Private (owner, admin, super_admin)
router.delete('/:id', protect, guard('cr', 'admin', 'super_admin'), async (req, res) => {
  try {
    const entry = await AcademicCalendar.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, error: 'Calendar entry not found' });
    }
    // IDOR defense: non-admins may only delete entries they created.
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
    const isOwner = entry.createdBy && entry.createdBy.toString() === req.user.id;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this entry' });
    }
    await entry.deleteOne();
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' });
  }
});

module.exports = router;
