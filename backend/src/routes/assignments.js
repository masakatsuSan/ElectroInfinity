const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const { protect, guard } = require('../middleware/auth');

// @route   GET /api/assignments
// @desc    Get all assignments for the user's batch
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    // If not super_admin or admin, filter by user's graduation_year (batch_year)
    if (req.user.role === 'student' || req.user.role === 'cr') {
      if (req.user.graduation_year) {
        query.batch_year = req.user.graduation_year;
      }
    }
    
    // Allow filtering by query as well
    if (req.query.batch_year) {
      query.batch_year = req.query.batch_year;
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
    // Auto-set batch_year to the CR's graduation_year if not provided
    if (!req.body.batch_year && req.user.graduation_year) {
      req.body.batch_year = req.user.graduation_year;
    }
    
    const assignment = await Assignment.create(req.body);
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
    if (req.user.role === 'cr' && assignment.batch_year !== req.user.graduation_year) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this assignment' });
    }
    
    await assignment.deleteOne();
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
