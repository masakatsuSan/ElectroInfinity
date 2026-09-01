const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const User = require('../models/User');
const { protect, guard, optionalAuth } = require('../middleware/auth');
const { createActivity } = require('../utils/activity');
const { createNotification, createNotificationBulk } = require('../utils/notification');

// @route   GET /api/projects
// @desc    Get all approved projects (public), all projects for admins
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { techStack, author, page = 1, limit = 20 } = req.query;
    const query = {};

    if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin' || req.user.role === 'faculty')) {
      if (author) query.author = author;
    } else {
      query.isApproved = true;
    }

    if (techStack && !query.author) {
      query.techStack = { $in: techStack.split(',') };
    }

    if (author && !req.user?.role) {
      query.author = author;
      query.isApproved = true;
    } else if (author && req.user) {
      query.author = author;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const projects = await Project.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'name role batch');

    const total = await Project.countDocuments(query);

    res.json({
      success: true,
      count: projects.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: projects
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/projects/:id
// @desc    Get a single project
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('author', 'name role batch');

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    if (!project.isApproved && (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin' && req.user.role !== 'faculty' && project.author._id.toString() !== req.user.id))) {
      return res.status(403).json({ success: false, error: 'Project not approved yet' });
    }

    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   POST /api/projects
// @desc    Create a project submission
// @access  Private (student, cr, faculty, admin, super_admin)
router.post('/', protect, guard('student', 'cr', 'faculty', 'admin', 'super_admin'), async (req, res) => {
  try {
    req.body.author = req.user.id;
    req.body.isApproved = false;

    const project = await Project.create(req.body);
    await createActivity(
      req.user.id,
      'project_shared',
      project.title,
      project.description,
      `/projects/${project._id}`
    );

    // Notify admins about new project for review
    const io = req.app.get('io')
    const User = require('../models/User')
    const admins = await User.find({
      role: { $in: ['admin', 'super_admin'] },
      _id: { $ne: req.user.id },
    }).select('_id')
    if (admins.length > 0) {
      await createNotificationBulk({
        recipients: admins.map(a => a._id.toString()),
        actor: req.user.id,
        type: 'project_submitted',
        title: `${req.user.name || 'Someone'} submitted a new project`,
        message: project.title,
        link: `/projects/${project._id}`,
        entityId: project._id,
        entityType: 'Project',
        io,
      })
    }

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// @route   PATCH /api/projects/:id
// @desc    Approve or update a project
// @access  Private (admin, super_admin)
router.patch('/:id', protect, guard('admin', 'super_admin'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    if (req.body.isApproved === true) {
      project.isApproved = true;
      project.approvedBy = req.user.id;
      project.rejectionReason = '';
    } else if (req.body.isApproved === false) {
      project.isApproved = false;
      project.rejectionReason = req.body.rejectionReason || '';
    }

    Object.assign(project, req.body);
    await project.save();

    // Notify project author about approval/rejection
    const io = req.app.get('io')
    if (req.body.isApproved === true && project.author.toString() !== req.user.id) {
      await createNotification({
        recipient: project.author,
        actor: req.user.id,
        type: 'project_approved',
        title: 'Your project has been approved!',
        message: project.title,
        link: `/projects/${project._id}`,
        entityId: project._id,
        entityType: 'Project',
        io,
      })
    } else if (req.body.isApproved === false && project.author.toString() !== req.user.id) {
      await createNotification({
        recipient: project.author,
        actor: req.user.id,
        type: 'project_rejected',
        title: 'Your project was not approved',
        message: project.rejectionReason || project.title,
        link: `/projects/${project._id}`,
        entityId: project._id,
        entityType: 'Project',
        io,
      })
    }

    res.json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete a project
// @access  Private (admin, super_admin or author)
router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
    const isAuthor = project.author.toString() === req.user.id;

    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this project' });
    }

    await project.deleteOne();
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   POST /api/projects/:id/like
// @desc    Like/unlike a project
// @access  Private
router.post('/:id/like', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    if (!project.isApproved) {
      return res.status(403).json({ success: false, error: 'Project not approved yet' });
    }

    const likeIndex = project.likes.indexOf(req.user.id);
    if (likeIndex !== -1) {
      project.likes.splice(likeIndex, 1);
    } else {
      project.likes.push(req.user.id);
    }

    await project.save();

    // Notify project author about like (only when adding like, not removing)
    if (likeIndex === -1 && project.author.toString() !== req.user.id) {
      const io = req.app.get('io')
      await createNotification({
        recipient: project.author,
        actor: req.user.id,
        type: 'project_like',
        title: `${req.user.name || 'Someone'} liked your project`,
        message: project.title,
        link: `/projects/${project._id}`,
        entityId: project._id,
        entityType: 'Project',
        io,
      })
    }

    res.json({ success: true, data: { likes: project.likes } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
