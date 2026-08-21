const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { protect, guard, optionalAuth } = require('../middleware/auth');

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
    res.json({ success: true, data: { likes: project.likes } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
