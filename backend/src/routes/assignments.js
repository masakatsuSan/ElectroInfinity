const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const { protect, guard } = require('../middleware/auth');
const { createNotificationBulk } = require('../utils/notification');

// Fields a client may set. `createdBy` is always the session
// user; CRs are always forced onto their own batch.
const ASSIGNMENT_FIELDS = ['title', 'description', 'link', 'deadline'];

function pickAssignmentFields(body) {
  const payload = {};
  for (const f of ASSIGNMENT_FIELDS) {
    if (body[f] !== undefined) payload[f] = body[f];
  }
  if (payload.title !== undefined) payload.title = String(payload.title).trim().slice(0, 100);
  if (payload.description !== undefined) payload.description = String(payload.description).slice(0, 5000);
  if (payload.link !== undefined) payload.link = String(payload.link).trim().slice(0, 500);
  if (payload.deadline !== undefined) {
    const d = new Date(payload.deadline);
    if (isNaN(d.getTime())) {
      const err = new Error('deadline must be a valid date');
      err.status = 400;
      throw err;
    }
    payload.deadline = d;
  }
  return payload;
}

// @route   GET /api/assignments
// @desc    Get all assignments for the user's batch
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    // Only fetch assignments for the user's batch, or globally visible assignments
    if (req.user.role === 'student' || req.user.role === 'cr') {
      if (req.user.batch) {
        query = {
          $or: [
            { visibility: 'BATCH', batchId: req.user.batch },
            { visibility: 'GLOBAL' }
          ]
        };
      }
    }

    const assignments = await Assignment.find(query)
      .sort({ deadline: 1 })
      .populate('createdBy', 'name role graduation_year');
      
    res.json({ success: true, count: assignments.length, data: assignments });
  } catch (error) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' });
  }
});

// @route   POST /api/assignments
// @desc    Create a new assignment
// @access  Private (CR)
router.post('/', protect, guard('cr', 'admin', 'super_admin'), async (req, res) => {
  try {
    // Mass-assignment defense: whitelisted fields only.
    const payload = pickAssignmentFields(req.body);
    if (!payload.title || !payload.description || !payload.deadline) {
      return res.status(400).json({ success: false, error: 'Title, description, and deadline are required' });
    }
    payload.createdBy = req.user.id;
    // Auto-set batchId and visibility for CRs — a CR can
    // never post to another batch or globally.
    if (req.user.role === 'cr') {
      payload.batchId = req.user.batch;
      payload.visibility = 'BATCH';
    } else {
      payload.batchId = typeof req.body.batchId === 'string' ? req.body.batchId.trim().slice(0, 20) : req.user.batch || '';
      payload.visibility = req.body.visibility === 'GLOBAL' && !payload.batchId ? 'GLOBAL' : 'BATCH';
    }

    const assignment = await Assignment.create(payload);

    // Notify students in the same batch about new assignment
    const io = req.app.get('io')
    const User = require('../models/User')
    const batchId = assignment.batchId || req.user.batch
    if (batchId) {
      const recipients = await User.find({
        role: { $in: ['student', 'cr'] },
        batch: batchId,
        isActive: true,
      }).select('_id')
      const recipientIds = recipients
        .map(r => r._id.toString())
        .filter(id => id !== req.user._id.toString())
      if (recipientIds.length > 0) {
        await createNotificationBulk({
          recipients: recipientIds,
          actor: req.user._id,
          type: 'assignment',
          title: `New assignment: ${assignment.title}`,
          message: `Due: ${new Date(assignment.deadline).toLocaleDateString('en-IN')}`,
          link: '/resources',
          entityId: assignment._id,
          entityType: 'Assignment',
          io,
        })
      }
    }

    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Request could not be completed.' });
  }
});

// @route   DELETE /api/assignments/:id
// @desc    Delete an assignment
// @access  Private (CR)
router.delete('/:id', protect, guard('cr', 'admin', 'super_admin'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }
    
    // Make sure CR can only delete their own batch's assignments
    if (req.user.role === 'cr' && assignment.batchId !== req.user.batch) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this assignment' });
    }
    
    await assignment.deleteOne();
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' });
  }
});

module.exports = router;
