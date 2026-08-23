const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { protect, guard, optionalAuth } = require('../middleware/auth');

// Canonical batches — keep in sync with frontend/src/data/batches.js
const BATCHES = ['2023-2027', '2024-2028', '2025-2029', '2026-2030'];
const CATEGORIES = ['general', 'academic', 'class', 'exam', 'urgent'];

// ─── Helpers ────────────────────────────────────────────────────────────────

// Visibility clauses for list queries based on the viewer's role.
// Students/CRs only see school-wide posts + posts targeted at their own batch.
function visibilityClauses(user) {
  const clauses = [];

  if (!user) {
    clauses.push({ $or: [{ targetAudience: 'all' }, { targetAudience: { $exists: false } }] });
  } else if (user.role === 'admin' || user.role === 'super_admin') {
    // Admins manage everything — no audience restriction
  } else if (user.role === 'faculty') {
    // Faculty see global posts, batches they teach, and their own posts
    const taught = [
      ...(user.assignedBatches || []),
      ...(user.teachingAssignments || []).map(a => a.batch),
    ].filter(Boolean);
    clauses.push({
      $or: [
        { targetAudience: 'all' },
        { targetAudience: { $exists: false } },
        { postedBy: user._id },
        { batchId: { $in: taught } },
      ],
    });
  } else {
    // Students & CRs: global + their own batch
    clauses.push({
      $or: [
        { targetAudience: 'all' },
        { targetAudience: { $exists: false } },
        { targetAudience: 'batch', batchId: user.batch },
      ],
    });
  }

  return clauses;
}

// Hide expired posts unless an admin explicitly opts in
function expiryClause(includeExpired, user) {
  if (includeExpired === 'true' && user && ['admin', 'super_admin'].includes(user.role)) return null;
  return {
    $or: [
      { expiresAt: null },
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } },
    ],
  };
}

// Whitelist fields. Faculty and CRs may never publish school-wide or pin posts.
function sanitizeForRole(body, role) {
  const clean = {};
  if (body.title !== undefined) clean.title = body.title;
  if (body.content !== undefined) clean.content = body.content;
  if (body.category !== undefined) clean.category = body.category;
  if (body.batchId !== undefined) clean.batchId = (body.batchId || '').trim();
  if (body.targetAudience !== undefined) clean.targetAudience = body.targetAudience;
  if (body.expiresAt !== undefined) clean.expiresAt = body.expiresAt || null;
  if (!['faculty', 'cr'].includes(role) && body.isPinned !== undefined) clean.isPinned = !!body.isPinned;
  return clean;
}

// Validate category + audience/batch combination. Returns error string or null.
function validatePayload(clean, role) {
  if (clean.category !== undefined && !CATEGORIES.includes(clean.category)) {
    return 'Invalid category. Use one of: ' + CATEGORIES.join(', ');
  }
  const audience = clean.targetAudience === 'all' ? 'all' : 'batch';
  if (['faculty', 'cr'].includes(role) && audience === 'all') {
    return role === 'cr'
      ? 'CR announcements must target your own classroom (batch)'
      : 'Faculty announcements must target one classroom (batch)';
  }
  if (audience === 'batch' && (!clean.batchId || !BATCHES.includes(clean.batchId))) {
    return 'Select a valid target classroom. Available batches: ' + BATCHES.join(', ');
  }
  return null;
}

// CRs are locked to their own classroom — force the target instead of trusting the client
function applyCrScope(clean, user) {
  if (user.role === 'cr') {
    clean.targetAudience = 'batch';
    clean.batchId = user.batch;
  }
  return clean;
}

// @route   GET /api/announcements/faculty/mine
// @desc    Announcements authored by the logged-in faculty ("My announcements")
// @access  Private (faculty) — registered BEFORE /:id
router.get('/faculty/mine', protect, guard('faculty'), async (req, res) => {
  try {
    const announcements = await Announcement.find({ postedBy: req.user._id })
      .populate('postedBy', 'name role')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: announcements.length, data: announcements });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/announcements
// @desc    List announcements filtered by viewer role/batch
// @access  Public (personalized when logged in)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, page = 1, limit = 20, includeExpired } = req.query;

    const clauses = visibilityClauses(req.user);
    if (category) clauses.push({ category });
    const expiry = expiryClause(includeExpired, req.user);
    if (expiry) clauses.push(expiry);

    const query = clauses.length > 0 ? { $and: clauses } : {};

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

// @route   POST /api/announcements
// @desc    Create an announcement (faculty/CR target one batch — CR locked to their own; admin may target all)
// @access  Private (cr, faculty, admin, super_admin)
router.post('/', protect, guard('cr', 'faculty', 'admin', 'super_admin'), async (req, res) => {
  try {
    const role = req.user.role;
    const clean = applyCrScope(sanitizeForRole(req.body, role), req.user);

    if (!clean.title || !String(clean.title).trim()) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }
    if (!clean.content || !String(clean.content).trim()) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    const invalid = validatePayload(clean, role);
    if (invalid) return res.status(400).json({ success: false, error: invalid });

    const audience = clean.targetAudience === 'all' ? 'all' : 'batch';

    const announcement = await Announcement.create({
      title: String(clean.title).trim(),
      content: String(clean.content).trim(),
      category: CATEGORIES.includes(clean.category) ? clean.category : 'general',
      postedBy: req.user._id,
      targetAudience: audience,
      batchId: audience === 'batch' ? clean.batchId : '',
      expiresAt: clean.expiresAt || null,
      attachmentUrl: req.body.attachmentUrl || '',
      isPinned: ['faculty', 'cr'].includes(role) ? false : !!req.body.isPinned,
    });

    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// @route   PATCH /api/announcements/:id
// @desc    Update an announcement (faculty/CR: own posts only)
// @access  Private (cr, faculty, admin, super_admin)
router.patch('/:id', protect, guard('cr', 'faculty', 'admin', 'super_admin'), async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }

    if (['faculty', 'cr'].includes(req.user.role) && String(announcement.postedBy) !== String(req.user._id)) {
      return res.status(403).json({ success: false, error: 'You can only edit announcements you posted' });
    }

    const clean = applyCrScope(sanitizeForRole(req.body, req.user.role), req.user);
    const merged = {
      ...clean,
      targetAudience: clean.targetAudience !== undefined ? clean.targetAudience : announcement.targetAudience,
      batchId: clean.batchId !== undefined ? clean.batchId : announcement.batchId,
    };
    const invalid = validatePayload(merged, req.user.role);
    if (invalid) return res.status(400).json({ success: false, error: invalid });

    Object.assign(announcement, clean);
    if (announcement.targetAudience === 'all') announcement.batchId = '';
    await announcement.save();

    res.json({ success: true, data: announcement });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// @route   DELETE /api/announcements/:id
// @desc    Delete an announcement (faculty/CR: own posts only; admin: any)
// @access  Private (cr, faculty, admin, super_admin)
router.delete('/:id', protect, guard('cr', 'faculty', 'admin', 'super_admin'), async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }

    if (['faculty', 'cr'].includes(req.user.role) && String(announcement.postedBy) !== String(req.user._id)) {
      return res.status(403).json({ success: false, error: 'You can only delete announcements you posted' });
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

// @route   GET /api/announcements/:id
// @desc    Get a single announcement (visibility enforced for direct access)
// @access  Public (read-marking when logged in)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('postedBy', 'name role');

    if (!announcement) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }

    // Enforce batch visibility even for direct URL access
    if (req.user && !['admin', 'super_admin'].includes(req.user.role)) {
      const isGlobal = announcement.targetAudience === 'all' || !announcement.targetAudience;
      const ownBatch = announcement.targetAudience === 'batch' && announcement.batchId === req.user.batch;
      let allowed = isGlobal || ownBatch;
      if (!allowed && req.user.role === 'faculty') {
        const taught = [
          ...(req.user.assignedBatches || []),
          ...(req.user.teachingAssignments || []).map(a => a.batch),
        ].filter(Boolean);
        const authorId = announcement.postedBy && announcement.postedBy._id ? announcement.postedBy._id : announcement.postedBy;
        allowed = String(authorId) === String(req.user._id) || taught.includes(announcement.batchId);
      }
      if (!allowed) {
        return res.status(403).json({ success: false, error: 'You are not allowed to view this announcement' });
      }
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

module.exports = router;