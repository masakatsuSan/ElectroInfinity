const express = require('express')
const router = express.Router()
const Deadline = require('../models/Deadline')
const { protect, guard } = require('../middleware/auth')
const { createNotificationBulk } = require('../utils/notification')

// @route   GET /api/deadlines
// @desc    Get all deadlines (filtered by batch/section)
// @access  Private (Student+)
router.get('/', protect, async (req, res) => {
  try {
    const { batch, section } = req.query
    const query = {}
    
    // Students/CRs can only see their own batch deadlines
    if (req.user.role === 'student' || req.user.role === 'cr') {
      query.batch = req.user.batch
    } else {
      if (batch) query.batch = batch
    }

    if (section) query.section = section
    
    const deadlines = await Deadline.find(query).sort({ deadline: 1 }).populate('postedBy', 'name role')
    res.json({ success: true, count: deadlines.length, data: deadlines })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// @route   POST /api/deadlines
// @desc    Create a new deadline
// @access  Private (CR, Admin)
router.post('/', protect, guard('cr', 'super_admin', 'admin'), async (req, res) => {
  try {
    req.body.postedBy = req.user.id
    
    // If CR, they should only be able to post for their own batch/section.
    if (req.user.role === 'cr') {
      req.body.batch = req.user.batch
      if (req.user.section) req.body.section = req.user.section
    }

    const deadline = await Deadline.create(req.body)

    // Notify students in the same batch about new deadline
    const io = req.app.get('io')
    const User = require('../models/User')
    const recipients = await User.find({
      role: { $in: ['student', 'cr'] },
      batch: deadline.batch,
      isActive: true,
    }).select('_id')
    const recipientIds = recipients
      .map(r => r._id.toString())
      .filter(id => id !== req.user._id.toString())
    if (recipientIds.length > 0) {
      await createNotificationBulk({
        recipients: recipientIds,
        actor: req.user._id,
        type: 'deadline',
        title: `New deadline: ${deadline.title}`,
        message: `Due: ${new Date(deadline.deadline).toLocaleDateString('en-IN')}`,
        link: '/students',
        entityId: deadline._id,
        entityType: 'Deadline',
        io,
      })
    }

    res.status(201).json({ success: true, data: deadline })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

// @route   PATCH /api/deadlines/:id
// @desc    Update a deadline
// @access  Private (Owner, Admin)
router.patch('/:id', protect, guard('cr', 'super_admin', 'admin'), async (req, res) => {
  try {
    let deadline = await Deadline.findById(req.params.id)
    if (!deadline) {
      return res.status(404).json({ success: false, error: 'Deadline not found' })
    }

    // Ensure CR is the owner
    if (req.user.role === 'cr' && deadline.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this deadline' })
    }

    deadline = await Deadline.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    res.json({ success: true, data: deadline })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

// @route   DELETE /api/deadlines/:id
// @desc    Delete a deadline
// @access  Private (Owner, Admin)
router.delete('/:id', protect, guard('cr', 'super_admin', 'admin'), async (req, res) => {
  try {
    const deadline = await Deadline.findById(req.params.id)
    if (!deadline) {
      return res.status(404).json({ success: false, error: 'Deadline not found' })
    }

    if (req.user.role === 'cr' && deadline.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this deadline' })
    }

    await deadline.deleteOne()
    res.json({ success: true, data: {} })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

// @route   PUT /api/deadlines/:id/submit
// @desc    Toggle submission status for a student
// @access  Private
router.put('/:id/submit', protect, async (req, res) => {
  try {
    const deadline = await Deadline.findById(req.params.id)
    if (!deadline) {
      return res.status(404).json({ success: false, error: 'Deadline not found' })
    }

    const userId = req.user.id;
    const hasSubmitted = deadline.submittedBy.includes(userId);

    if (hasSubmitted) {
      deadline.submittedBy = deadline.submittedBy.filter(id => id.toString() !== userId);
    } else {
      deadline.submittedBy.push(userId);
    }

    await deadline.save();
    res.json({ success: true, data: deadline.submittedBy });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

module.exports = router
