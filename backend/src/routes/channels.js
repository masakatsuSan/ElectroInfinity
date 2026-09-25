const express = require('express');
const router = express.Router();
const Channel = require('../models/Channel');
const Message = require('../models/Message');
const ReadState = require('../models/ReadState');
const { protect, guard } = require('../middleware/auth');
const { resolveMentions } = require('../utils/mentions');
const { createNotification, createNotificationBulk } = require('../utils/notification');

const ROLE_HIERARCHY = {
  student: 0,
  cr: 1,
  faculty: 2,
  admin: 3,
  super_admin: 4,
};

function canAccessChannel(user, channel) {
  return channel.allowedRoles.includes(user.role);
}

function canPostInChannel(user, channel) {
  if (channel.isReadOnly && !['admin', 'super_admin', 'faculty'].includes(user.role)) {
    return false;
  }
  return channel.postRoles.includes(user.role);
}

function filterChannelsByRole(channels, user) {
  return channels.filter(c => c.allowedRoles.includes(user.role));
}

router.get('/', protect, async (req, res) => {
  try {
    const channels = await Channel.find({ isActive: true })
      .sort({ category: 1, order: 1, name: 1 })
      .select('name slug description category type isReadOnly allowedRoles postRoles order messageCount lastActivity createdAt createdBy');

    const filtered = filterChannelsByRole(channels, req.user);
    const grouped = filtered.reduce((acc, ch) => {
      if (!acc[ch.category]) acc[ch.category] = [];
      acc[ch.category].push(ch);
      return acc;
    }, {});

    res.json({ success: true, data: grouped });
  } catch (error) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id)
      .populate('createdBy', 'name role photo rollNumber')
      .populate('members', 'name role photo rollNumber');

    if (!channel || !channel.isActive) {
      return res.status(404).json({ success: false, error: 'Channel not found' });
    }

    if (!canAccessChannel(req.user, channel)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const canPost = canPostInChannel(req.user, channel);

    const readState = await ReadState.findOne({ userId: req.user._id, channelId: channel._id });

    res.json({
      success: true,
      data: {
        ...channel.toObject(),
        canPost,
        lastReadAt: readState?.lastReadAt || null,
        lastReadMessageId: readState?.lastReadMessageId || null,
      },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ success: false, error: 'Channel not found' });
    }
    res.status(500).json({ success: false, error: 'An internal server error occurred' });
  }
});

router.post('/', protect, guard('admin', 'super_admin'), async (req, res) => {
  try {
    req.body.createdBy = req.user.id;
    req.body.slug = req.body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const existing = await Channel.findOne({ slug: req.body.slug });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Channel with this name already exists' });
    }

    const channel = await Channel.create(req.body);
    res.status(201).json({ success: true, data: channel });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Channel name already exists' });
    }
    res.status(400).json({ success: false, error: 'Request could not be completed.' });
  }
});

router.patch('/:id', protect, guard('admin', 'super_admin'), async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ success: false, error: 'Channel not found' });
    }

    const allowedUpdates = [
      'name', 'slug', 'description', 'category', 'type',
      'allowedRoles', 'postRoles', 'isReadOnly', 'order', 'isActive'
    ];
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        channel[key] = req.body[key];
      }
    });

    if (req.body.name && !req.body.slug) {
      channel.slug = req.body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    await channel.save();
    res.json({ success: true, data: channel });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ success: false, error: 'Channel not found' });
    }
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Channel name already exists' });
    }
    res.status(400).json({ success: false, error: 'Request could not be completed.' });
  }
});

router.delete('/:id', protect, guard('admin', 'super_admin'), async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ success: false, error: 'Channel not found' });
    }

    channel.isActive = false;
    await channel.save();
    res.json({ success: true, data: {} });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ success: false, error: 'Channel not found' });
    }
    res.status(500).json({ success: false, error: 'An internal server error occurred' });
  }
});

module.exports = router;