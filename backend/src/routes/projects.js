const express = require('express');
const router = express.Router();
const axios = require('axios');
const Project = require('../models/Project');
const User = require('../models/User');
const { protect, guard, optionalAuth } = require('../middleware/auth');
const { createActivity } = require('../utils/activity');
const { createNotification, createNotificationBulk } = require('../utils/notification');
const { canApprove } = require('../utils/canApprove');

const TEASER_LIMIT = 6;

function buildProjectTeaser(p) {
  return {
    _id: p._id,
    kind: 'project',
    title: p.title,
    category: 'project',
    techStack: p.techStack || [],
    createdAt: p.createdAt,
    date: p.createdAt,
    isApproved: false,
    isPendingTeaser: true,
    author: p.author && typeof p.author === 'object'
      ? {
          _id: p.author._id,
          name: p.author.name,
          photo: p.author.photo,
          rollNumber: p.author.rollNumber,
          batch: p.author.batch,
          role: p.author.role,
          profileVisibility: p.author.profile?.profileVisibility || 'public',
        }
      : p.author,
  };
}

// @route   GET /api/projects
// @desc    Approved projects (public). Pending teasers always attached.
//          Admin/faculty see all. ?teasers=true returns teasers only.
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { techStack, author, page = 1, limit = 20, teasers } = req.query;
    const user = req.user;

    if (teasers === 'true') {
      const recent = await Project.find({ isApproved: false })
        .sort({ createdAt: -1 })
        .limit(TEASER_LIMIT)
        .populate('author', 'name photo rollNumber batch role profile.profileVisibility');
      return res.json({
        success: true,
        data: [],
        pendingTeasers: recent.map(buildProjectTeaser),
      });
    }

    const query = {};
    const isStaff = user && (user.role === 'admin' || user.role === 'super_admin' || user.role === 'faculty');
    const isCr = user && user.role === 'cr';

    if (isStaff) {
      if (author) query.author = author;
    } else if (isCr) {
      if (author) {
        query.author = author;
        if (author !== user._id.toString()) query.isApproved = true;
      } else {
        query.$or = [{ isApproved: true }, { author: user._id }];
      }
    } else if (user && author && author === user._id.toString()) {
      query.$or = [{ isApproved: true }, { author: user._id }];
    } else {
      query.isApproved = true;
      if (author) query.author = author;
    }

    if (techStack && !query.author) {
      query.techStack = { $in: techStack.split(',') };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const projects = await Project.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'name role batch photo profile.profileVisibility');

    const total = await Project.countDocuments(query);

    let pendingTeasers = [];
    if (!isStaff && !author) {
      const recentPending = await Project.find({ isApproved: false })
        .sort({ createdAt: -1 })
        .limit(TEASER_LIMIT)
        .populate('author', 'name photo rollNumber batch role profile.profileVisibility');
      pendingTeasers = recentPending.map(buildProjectTeaser);
    }

    res.json({
      success: true,
      count: projects.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: projects,
      pendingTeasers,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/projects/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('author', 'name role batch photo profile.profileVisibility');

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    if (!project.isApproved) {
      const user = req.user;
      const isAuthor = user && project.author && project.author._id.toString() === user._id.toString();
      const allowed = isAuthor || canApprove(user, project.author);
      if (!allowed) {
        return res.json({ success: true, data: buildProjectTeaser(project) });
      }
    }

    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/projects/:id/image/:idx
// @desc    Stream a project image with privacy guard for pending items.
router.get('/:id/image/:idx', optionalAuth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('author', 'batch role _id');
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    if (!project.isApproved) {
      const user = req.user;
      const isAuthor = user && project.author && project.author._id.toString() === user._id.toString();
      const allowed = isAuthor || canApprove(user, project.author);
      if (!allowed) {
        return res.status(403).json({ success: false, error: 'Project not approved yet' });
      }
    }

    const idx = parseInt(req.params.idx, 10) || 0;
    let url = '';
    if (idx === 0 && project.thumbnail) url = project.thumbnail;
    else if (project.images && project.images[idx]) url = project.images[idx];
    if (!url) return res.status(404).json({ success: false, error: 'No image at this index' });

    let parsed;
    try { parsed = new URL(url); } catch (_) { parsed = null; }
    if (!parsed || !/^https?:$/.test(parsed.protocol)) {
      return res.status(400).json({ success: false, error: 'Invalid image URL' });
    }

    const response = await axios.get(url, {
      responseType: 'stream',
      maxRedirects: 5,
      timeout: 15000,
      validateStatus: () => true,
    });
    if (response.status < 200 || response.status >= 300) {
      response.data.resume();
      return res.status(502).json({ success: false, error: `Upstream returned ${response.status}` });
    }
    res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
    if (response.headers['content-length']) res.setHeader('Content-Length', response.headers['content-length']);
    res.setHeader('Cache-Control', project.isApproved ? 'public, max-age=3600' : 'private, no-store');
    response.data.on('error', () => { try { res.end() } catch (_) {} });
    req.on('close', () => { try { response.data.destroy() } catch (_) {} });
    response.data.pipe(res);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// @route   POST /api/projects
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

    const io = req.app.get('io');
    const reviewers = await User.find({
      role: { $in: ['admin', 'super_admin', 'cr'] },
      _id: { $ne: req.user.id },
    }).select('_id');
    if (reviewers.length > 0) {
      await createNotificationBulk({
        recipients: reviewers.map(a => a._id.toString()),
        actor: req.user.id,
        type: 'project_submitted',
        title: `${req.user.name || 'Someone'} submitted a new project`,
        message: project.title,
        link: `/projects/${project._id}`,
        entityId: project._id,
        entityType: 'Project',
        io,
      });
    }

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// @route   PATCH /api/projects/:id
// @desc    Approve/update a project. Admin/super_admin OR same-batch CR can approve.
router.patch('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('author', 'name batch role _id');
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const isApprover = canApprove(req.user, project.author);
    if (!isApprover) {
      return res.status(403).json({ success: false, error: 'Not authorized to approve or modify this project' });
    }

    const wantsStatusChange = req.body.isApproved !== undefined;
    if (wantsStatusChange) {
      if (req.body.isApproved === true) {
        project.isApproved = true;
        project.approvedBy = req.user.id;
        project.approvedAt = new Date();
        project.rejectionReason = '';
      } else {
        project.isApproved = false;
        project.approvedBy = null;
        project.approvedAt = null;
        project.rejectionReason = req.body.rejectionReason || '';
      }
    }

    const allowedFields = ['title', 'description', 'techStack', 'githubLink', 'demoLink', 'images', 'thumbnail', 'pinned', 'rejectionReason'];
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) project[f] = req.body[f];
    });

    await project.save();

    const io = req.app.get('io');
    const ownerId = project.author?._id || project.author;
    if (wantsStatusChange && ownerId && ownerId.toString() !== req.user.id.toString()) {
      if (req.body.isApproved === true) {
        await createNotification({
          recipient: ownerId,
          actor: req.user.id,
          type: 'project_approved',
          title: 'Your project has been approved!',
          message: project.title,
          link: `/projects/${project._id}`,
          entityId: project._id,
          entityType: 'Project',
          io,
        });
      } else {
        await createNotification({
          recipient: ownerId,
          actor: req.user.id,
          type: 'project_rejected',
          title: 'Your project was not approved',
          message: project.rejectionReason || project.title,
          link: `/profile/${req.user.id}?tab=uploads`,
          entityId: project._id,
          entityType: 'Project',
          io,
        });
      }
    }

    res.json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// @route   DELETE /api/projects/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('author', 'batch role _id');
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
    const isAuthor = project.author && project.author._id.toString() === req.user.id.toString();
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

    if (likeIndex === -1 && project.author.toString() !== req.user.id) {
      const io = req.app.get('io');
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
      });
    }

    res.json({ success: true, data: { likes: project.likes } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
