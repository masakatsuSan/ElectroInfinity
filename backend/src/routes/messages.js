const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Channel = require('../models/Channel');
const ReadState = require('../models/ReadState');
const { protect } = require('../middleware/auth');
const { resolveMentions } = require('../utils/mentions');
const { createNotification, createNotificationBulk } = require('../utils/notification');

const MAX_MESSAGE_LENGTH = 2000;
const RATE_LIMIT_WINDOW = 5000; // 5 seconds
const RATE_LIMIT_MAX = 5; // 5 messages per window

const userSendTimes = new Map();

function checkRateLimit(userId) {
  const now = Date.now();
  const times = userSendTimes.get(userId) || [];
  const recent = times.filter(t => now - t < RATE_LIMIT_WINDOW);
  if (recent.length >= RATE_LIMIT_MAX) {
    return false;
  }
  recent.push(now);
  userSendTimes.set(userId, recent);
  return true;
}

function clearOldRateLimits() {
  const now = Date.now();
  for (const [userId, times] of userSendTimes.entries()) {
    const recent = times.filter(t => now - t < RATE_LIMIT_WINDOW * 2);
    if (recent.length === 0) {
      userSendTimes.delete(userId);
    } else {
      userSendTimes.set(userId, recent);
    }
  }
}

setInterval(clearOldRateLimits, 60000);

async function populateMessage(message, viewerId) {
  return message.populate('senderId', 'name role photo rollNumber batch semester');
}

async function enrichMessage(message, viewerId) {
  const populated = await populateMessage(message, viewerId);
  const obj = populated.toObject();
  
  obj.isOwn = obj.senderId._id.toString() === viewerId.toString();
  obj.reactions = (obj.reactions || []).map(r => ({
    ...r,
    userReacted: r.userIds.some(id => id.toString() === viewerId.toString()),
    count: r.userIds.length,
  }));
  obj.replyPreview = null;
  if (obj.replyTo) {
    const replied = await Message.findById(obj.replyTo)
      .populate('senderId', 'name role photo rollNumber')
      .select('text senderId createdAt');
    if (replied && !replied.deletedAt) {
      obj.replyPreview = {
        _id: replied._id,
        senderName: replied.senderId?.name,
        senderRole: replied.senderId?.role,
        text: replied.text?.substring(0, 80),
        createdAt: replied.createdAt,
      };
    }
  }
  return obj;
}

router.get('/:channelId', protect, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { before, limit = 30 } = req.query;

    const channel = await Channel.findById(channelId);
    if (!channel || !channel.isActive) {
      return res.status(404).json({ success: false, error: 'Channel not found' });
    }

    if (!channel.allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const query = { channelId, deletedAt: null };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) + 1);

    const hasMore = messages.length > parseInt(limit);
    const trimmed = hasMore ? messages.slice(0, -1) : messages;

    const enriched = await Promise.all(
      trimmed.reverse().map(m => enrichMessage(m, req.user._id))
    );

    const readState = await ReadState.findOne({ userId: req.user._id, channelId });
    const unreadCount = readState
      ? await Message.countDocuments({
          channelId,
          createdAt: { $gt: readState.lastReadAt },
          deletedAt: null,
          senderId: { $ne: req.user._id },
        })
      : await Message.countDocuments({ channelId, deletedAt: null });

    res.json({
      success: true,
      data: enriched,
      hasMore,
      unreadCount,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ success: false, error: 'Channel not found' });
    }
    res.status(500).json({ success: false, error: 'An internal server error occurred' });
  }
});

router.post('/:channelId', protect, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { text = '', imageUrl = '', replyTo = null } = req.body;

    if (!checkRateLimit(req.user._id.toString())) {
      return res.status(429).json({ success: false, error: 'Too many messages. Please slow down.' });
    }

    const channel = await Channel.findById(channelId);
    if (!channel || !channel.isActive) {
      return res.status(404).json({ success: false, error: 'Channel not found' });
    }

    if (!channel.postRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'You cannot post in this channel' });
    }

    if (!text.trim() && !imageUrl) {
      return res.status(400).json({ success: false, error: 'Message cannot be empty' });
    }

    if (text.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ success: false, error: `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters` });
    }

    let mentions = [];
    if (text) {
      const mentionResult = await resolveMentions(text, { actorId: req.user.id });
      mentions = mentionResult.mentions;
    }

    const message = await Message.create({
      channelId,
      senderId: req.user.id,
      text: text.trim(),
      imageUrl: imageUrl || '',
      replyTo: replyTo || null,
      mentions,
    });

    await Channel.findByIdAndUpdate(channelId, {
      $inc: { messageCount: 1 },
      $set: { lastActivity: new Date() },
    });

    const io = req.app.get('io');
    const enriched = await enrichMessage(message, req.user._id);
    io.to(`channel:${channelId}`).emit('new_message', enriched);

    const memberIds = channel.members
      .filter(id => id.toString() !== req.user.id)
      .map(id => id.toString());

    if (memberIds.length > 0) {
      const actorName = req.user.name || 'Someone';
      await createNotificationBulk({
        recipients: memberIds,
        actor: req.user.id,
        type: 'chat_message',
        title: `New message in #${channel.name}`,
        message: text?.substring(0, 120) || 'Sent an image',
        link: `/chat/${channel.slug}`,
        entityId: message._id,
        entityType: 'Message',
        io,
      });
    }

    if (mentions.length > 0) {
      const mentionedIds = mentions.map(id => id.toString());
      await createNotificationBulk({
        recipients: mentionedIds,
        actor: req.user.id,
        type: 'chat_mention',
        title: `${req.user.name || 'Someone'} mentioned you in #${channel.name}`,
        message: text?.substring(0, 120) || '',
        link: `/chat/${channel.slug}`,
        entityId: message._id,
        entityType: 'Message',
        io,
      });
    }

    if (replyTo) {
      const repliedMessage = await Message.findById(replyTo).select('senderId');
      if (repliedMessage && repliedMessage.senderId.toString() !== req.user.id) {
        await createNotification({
          recipient: repliedMessage.senderId,
          actor: req.user.id,
          type: 'chat_reply',
          title: `${req.user.name || 'Someone'} replied to your message`,
          message: text?.substring(0, 80) || '',
          link: `/chat/${channel.slug}`,
          entityId: message._id,
          entityType: 'Message',
          io,
        });
      }
    }

    res.status(201).json({ success: true, data: enriched });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Request could not be completed.' });
  }
});

router.patch('/:channelId/:messageId', protect, async (req, res) => {
  try {
    const { channelId, messageId } = req.params;
    const { text } = req.body;

    const message = await Message.findOne({ _id: messageId, channelId, deletedAt: null });
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    const isAuthor = message.senderId.toString() === req.user.id;
    const isMod = ['admin', 'super_admin', 'faculty'].includes(req.user.role);

    if (!isAuthor && !isMod) {
      return res.status(403).json({ success: false, error: 'You can only edit your own messages' });
    }

    if (!text?.trim()) {
      return res.status(400).json({ success: false, error: 'Message cannot be empty' });
    }

    if (text.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ success: false, error: `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters` });
    }

    let mentions = [];
    const mentionResult = await resolveMentions(text, { actorId: req.user.id });
    mentions = mentionResult.mentions;

    message.text = text.trim();
    message.mentions = mentions;
    message.editedAt = new Date();
    await message.save();

    const io = req.app.get('io');
    const enriched = await enrichMessage(message, req.user._id);
    io.to(`channel:${channelId}`).emit('edit_message', enriched);

    if (mentions.length > 0) {
      const mentionedIds = mentions.map(id => id.toString());
      await createNotificationBulk({
        recipients: mentionedIds,
        actor: req.user.id,
        type: 'chat_mention',
        title: `${req.user.name || 'Someone'} mentioned you in an edited message`,
        message: text?.substring(0, 120) || '',
        link: `/chat/${channel.slug}`,
        entityId: message._id,
        entityType: 'Message',
        io,
      });
    }

    res.json({ success: true, data: enriched });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    res.status(400).json({ success: false, error: 'Request could not be completed.' });
  }
});

router.delete('/:channelId/:messageId', protect, async (req, res) => {
  try {
    const { channelId, messageId } = req.params;

    const message = await Message.findOne({ _id: messageId, channelId, deletedAt: null });
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    const isAuthor = message.senderId.toString() === req.user.id;
    const isMod = ['admin', 'super_admin', 'faculty'].includes(req.user.role);

    if (!isAuthor && !isMod) {
      return res.status(403).json({ success: false, error: 'You can only delete your own messages' });
    }

    message.deletedAt = new Date();
    await message.save();

    const io = req.app.get('io');
    io.to(`channel:${channelId}`).emit('delete_message', { messageId, channelId });

    res.json({ success: true, data: {} });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    res.status(400).json({ success: false, error: 'Request could not be completed.' });
  }
});

router.post('/:channelId/:messageId/react', protect, async (req, res) => {
  try {
    const { channelId, messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ success: false, error: 'Emoji is required' });
    }

    const message = await Message.findOne({ _id: messageId, channelId, deletedAt: null });
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    const userId = req.user._id.toString();
    const reaction = message.reactions.find(r => r.emoji === emoji);

    if (reaction) {
      const userIndex = reaction.userIds.findIndex(id => id.toString() === userId);
      if (userIndex !== -1) {
        reaction.userIds.splice(userIndex, 1);
      } else {
        reaction.userIds.push(req.user._id);
      }
      if (reaction.userIds.length === 0) {
        message.reactions = message.reactions.filter(r => r.emoji !== emoji);
      }
    } else {
      message.reactions.push({ emoji, userIds: [req.user._id] });
    }

    await message.save();

    const io = req.app.get('io');
    const enriched = await enrichMessage(message, req.user._id);
    io.to(`channel:${channelId}`).emit('react_message', { messageId, reactions: enriched.reactions });

    res.json({ success: true, data: enriched.reactions });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    res.status(400).json({ success: false, error: 'Request could not be completed.' });
  }
});

router.post('/:channelId/read', protect, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { messageId } = req.body;

    const channel = await Channel.findById(channelId);
    if (!channel || !channel.isActive) {
      return res.status(404).json({ success: false, error: 'Channel not found' });
    }

    if (!channel.allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const now = new Date();
    let lastReadMessage = null;
    if (messageId) {
      lastReadMessage = await Message.findById(messageId).select('_id createdAt');
    }

    await ReadState.findOneAndUpdate(
      { userId: req.user._id, channelId },
      {
        lastReadAt: lastReadMessage?.createdAt || now,
        lastReadMessageId: lastReadMessage?._id || null,
      },
      { upsert: true, new: true }
    );

    const unreadCount = await Message.countDocuments({
      channelId,
      createdAt: { $gt: lastReadMessage?.createdAt || now },
      deletedAt: null,
      senderId: { $ne: req.user._id },
    });

    res.json({ success: true, data: { unreadCount } });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Request could not be completed.' });
  }
});

module.exports = router;