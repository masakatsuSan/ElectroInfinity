const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const { protect, guard } = require('../middleware/auth');
const { createNotificationBulk } = require('../utils/notification');

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
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   POST /api/assignments
// @desc    Create a new assignment
// @access  Private (CR)
router.post('/', protect, guard('cr', 'admin', 'super_admin'), async (req, res) => {
  try {
    req.body.createdBy = req.user.id;
    // Auto-set batchId and visibility for CRs
    if (req.user.role === 'cr') {
      req.body.batchId = req.user.batch;
      req.body.visibility = 'BATCH';
    } else if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      req.body.visibility = req.body.visibility || 'BATCH';
    }
    
    const assignment = await Assignment.create(req.body);

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
    res.status(400).json({ success: false, error: error.message });
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
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
