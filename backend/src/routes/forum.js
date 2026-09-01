const express = require('express');
const router = express.Router();
const ForumPost = require('../models/ForumPost');
const ForumComment = require('../models/ForumComment');
const CommunityRoom = require('../models/CommunityRoom');
const User = require('../models/User');
const { protect, guard } = require('../middleware/auth');
const { createActivity } = require('../utils/activity');
const { createNotification, createNotificationBulk } = require('../utils/notification');

// @route   GET /api/forum/rooms
// @desc    Get all community rooms
// @access  Private
router.get('/rooms', protect, async (req, res) => {
  try {
    const rooms = await CommunityRoom.find({ isActive: true })
      .sort({ isPopular: -1, postCount: -1, name: 1 })
      .select('name description icon color isPopular postCount lastActivity createdAt')
    res.json({ success: true, count: rooms.length, data: rooms });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   POST /api/forum/rooms
// @desc    Create a community room
// @access  Private (cr, admin, super_admin)
router.post('/rooms', protect, guard('cr', 'admin', 'super_admin'), async (req, res) => {
  try {
    req.body.createdBy = req.user.id;
    const room = await CommunityRoom.create(req.body);
    res.status(201).json({ success: true, data: room });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Room name already exists' });
    }
    res.status(400).json({ success: false, error: error.message });
  }
});

// @route   PATCH /api/forum/rooms/:id
// @desc    Update a community room
// @access  Private (cr, admin, super_admin)
router.patch('/rooms/:id', protect, guard('cr', 'admin', 'super_admin'), async (req, res) => {
  try {
    const room = await CommunityRoom.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    Object.assign(room, req.body);
    await room.save();
    res.json({ success: true, data: room });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    res.status(400).json({ success: false, error: error.message });
  }
});

// @route   DELETE /api/forum/rooms/:id
// @desc    Soft delete a community room
// @access  Private (admin, super_admin)
router.delete('/rooms/:id', protect, guard('admin', 'super_admin'), async (req, res) => {
  try {
    const room = await CommunityRoom.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    room.isActive = false;
    await room.save();
    res.json({ success: true, data: {} });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/forum
// @desc    Get forum posts with filtering, sorting, and pagination
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { room, sort = 'latest', page = 1, limit = 20 } = req.query;
    const query = {};

    if (room) {
      query.room = room;
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'popular') {
      sortOption = { upvotes: -1, createdAt: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const posts = await ForumPost.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'name role photo rollNumber batch semester followers following')
      .populate('room', 'name icon color isPopular')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name role photo rollNumber batch semester followers following'
        }
      });

    const total = await ForumPost.countDocuments(query);

    const viewerId = req.user?._id;
    if (viewerId) {
      const authorIds = new Set();
      posts.forEach(post => {
        if (post.author?._id) authorIds.add(post.author._id.toString());
        (post.comments || []).forEach(c => {
          if (c.author?._id) authorIds.add(c.author._id.toString());
        });
      });

      const postCounts = await ForumPost.aggregate([
        { $match: { author: { $in: Array.from(authorIds).map(id => require('mongoose').Types.ObjectId(id)) } } },
        { $group: { _id: '$author', count: { $sum: 1 } } }
      ]);
      const postCountMap = {};
      postCounts.forEach(pc => { postCountMap[pc._id.toString()] = pc.count; });

      const enrichedPosts = posts.map(post => {
        const enrichedAuthor = post.author ? {
          ...post.author.toObject(),
          isFollowing: post.author.followers?.some(id => id.toString() === viewerId.toString()) || false,
          followsMe: post.author.following?.some(id => id.toString() === viewerId.toString()) || false,
          postCount: postCountMap[post.author._id.toString()] || 0,
        } : null;

        const enrichedComments = (post.comments || []).map(comment => {
          const enrichedCommentAuthor = comment.author ? {
            ...comment.author.toObject(),
            isFollowing: comment.author.followers?.some(id => id.toString() === viewerId.toString()) || false,
            followsMe: comment.author.following?.some(id => id.toString() === viewerId.toString()) || false,
            postCount: postCountMap[comment.author._id.toString()] || 0,
          } : null;
          return { ...comment.toObject(), author: enrichedCommentAuthor };
        });

        return { ...post.toObject(), author: enrichedAuthor, comments: enrichedComments };
      });

      return res.json({
        success: true,
        count: enrichedPosts.length,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        data: enrichedPosts
      });
    }

    res.json({
      success: true,
      count: posts.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: posts
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/forum/:id
// @desc    Get a single forum post
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id)
      .populate('author', 'name role photo rollNumber batch semester followers following')
      .populate('room', 'name icon color isPopular')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name role photo rollNumber batch semester followers following'
        }
      });

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const viewerId = req.user?._id;
    if (viewerId) {
      const authorIds = new Set();
      if (post.author?._id) authorIds.add(post.author._id.toString());
      (post.comments || []).forEach(c => {
        if (c.author?._id) authorIds.add(c.author._id.toString());
      });

      const postCounts = await ForumPost.aggregate([
        { $match: { author: { $in: Array.from(authorIds).map(id => require('mongoose').Types.ObjectId(id)) } } },
        { $group: { _id: '$author', count: { $sum: 1 } } }
      ]);
      const postCountMap = {};
      postCounts.forEach(pc => { postCountMap[pc._id.toString()] = pc.count; });

      const enrichedAuthor = post.author ? {
        ...post.author.toObject(),
        isFollowing: post.author.followers?.some(id => id.toString() === viewerId.toString()) || false,
        followsMe: post.author.following?.some(id => id.toString() === viewerId.toString()) || false,
        postCount: postCountMap[post.author._id.toString()] || 0,
      } : null;

      const enrichedComments = (post.comments || []).map(comment => {
        const enrichedCommentAuthor = comment.author ? {
          ...comment.author.toObject(),
          isFollowing: comment.author.followers?.some(id => id.toString() === viewerId.toString()) || false,
          followsMe: comment.author.following?.some(id => id.toString() === viewerId.toString()) || false,
          postCount: postCountMap[comment.author._id.toString()] || 0,
        } : null;
        return { ...comment.toObject(), author: enrichedCommentAuthor };
      });

      return res.json({ success: true, data: { ...post.toObject(), author: enrichedAuthor, comments: enrichedComments } });
    }

    res.json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   POST /api/forum
// @desc    Create a new forum post
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    if (!req.body.room) {
      return res.status(400).json({ success: false, error: 'Room is required' });
    }

    req.body.author = req.user.id;

    if (req.body.postType === 'poll' && (!req.body.pollOptions || req.body.pollOptions.length < 2)) {
      return res.status(400).json({ success: false, error: 'Poll must have at least 2 options' });
    }

    if (req.body.postType === 'link' && !req.body.linkUrl) {
      return res.status(400).json({ success: false, error: 'Link URL is required for link posts' });
    }

    const post = await ForumPost.create(req.body);

    await createActivity(
      req.user.id,
      'forum_post',
      post.title,
      post.content?.substring(0, 100) || '',
      `/forum`
    );

    await CommunityRoom.findByIdAndUpdate(req.body.room, {
      $inc: { postCount: 1 },
      $set: { lastActivity: new Date() }
    });

    // Notify room members about new post
    const io = req.app.get('io')
    const room = await CommunityRoom.findById(req.body.room).select('name members')
    if (room?.members?.length > 0) {
      const actorName = req.user.name || 'Someone'
      const memberIds = room.members
        .filter(id => id.toString() !== req.user.id)
        .map(id => id.toString())
      if (memberIds.length > 0) {
        await createNotificationBulk({
          recipients: memberIds,
          actor: req.user.id,
          type: 'forum_comment',
          title: `New post in ${room.name}`,
          message: `${actorName}: ${post.title}`,
          link: '/forum',
          entityId: post._id,
          entityType: 'ForumPost',
          io,
        })
      }
    }

    res.status(201).json({ success: true, data: post });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// @route   PUT /api/forum/:id/upvote
// @desc    Upvote/downvote a forum post
// @access  Private
router.put('/:id/upvote', protect, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const upvoteIndex = post.upvotes.indexOf(req.user.id);
    if (upvoteIndex !== -1) {
      post.upvotes.splice(upvoteIndex, 1);
    } else {
      post.upvotes.push(req.user.id);
      const downvoteIndex = post.downvotes.indexOf(req.user.id);
      if (downvoteIndex !== -1) {
        post.downvotes.splice(downvoteIndex, 1);
      }
    }

    await post.save();

    // Notify post author about upvote (only when adding upvote, not removing)
    if (upvoteIndex === -1 && post.author.toString() !== req.user.id) {
      const io = req.app.get('io')
      await createNotification({
        recipient: post.author,
        actor: req.user.id,
        type: 'forum_upvote',
        title: `${req.user.name || 'Someone'} upvoted your post`,
        message: post.title,
        link: '/forum',
        entityId: post._id,
        entityType: 'ForumPost',
        io,
      })
    }

    res.json({ success: true, data: post.upvotes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   PUT /api/forum/:id/downvote
// @desc    Downvote a forum post
// @access  Private
router.put('/:id/downvote', protect, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const downvoteIndex = post.downvotes.indexOf(req.user.id);
    if (downvoteIndex !== -1) {
      post.downvotes.splice(downvoteIndex, 1);
    } else {
      post.downvotes.push(req.user.id);
      const upvoteIndex = post.upvotes.indexOf(req.user.id);
      if (upvoteIndex !== -1) {
        post.upvotes.splice(upvoteIndex, 1);
      }
    }

    await post.save();
    res.json({ success: true, data: post.downvotes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   POST /api/forum/:id/comments
// @desc    Add a comment to a post
// @access  Private
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    req.body.post = req.params.id;
    req.body.author = req.user.id;

    if (req.body.parent) {
      const parentComment = await ForumComment.findById(req.body.parent);
      if (!parentComment) {
        return res.status(404).json({ success: false, error: 'Parent comment not found' });
      }
    }

    const comment = await ForumComment.create(req.body);

    await CommunityRoom.findByIdAndUpdate(post.room, {
      $set: { lastActivity: new Date() }
    });

    // Create notifications for comment/reply
    const io = req.app.get('io')
    const actorName = req.user.name || 'Someone'

    // Notify parent comment author (reply notification)
    if (req.body.parent) {
      const parentComment = await ForumComment.findById(req.body.parent).select('author')
      if (parentComment && parentComment.author.toString() !== req.user.id) {
        await createNotification({
          recipient: parentComment.author,
          actor: req.user.id,
          type: 'forum_reply',
          title: `${actorName} replied to your comment`,
          message: comment.content?.substring(0, 80) || '',
          link: '/forum',
          entityId: post._id,
          entityType: 'ForumPost',
          io,
        })
      }
    }

    // Notify post author (comment notification)
    if (post.author.toString() !== req.user.id) {
      await createNotification({
        recipient: post.author,
        actor: req.user.id,
        type: 'forum_comment',
        title: `${actorName} commented on your post`,
        message: comment.content?.substring(0, 80) || '',
        link: '/forum',
        entityId: post._id,
        entityType: 'ForumPost',
        io,
      })
    }

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// @route   PUT /api/forum/comments/:id/upvote
// @desc    Upvote/downvote a comment
// @access  Private
router.put('/comments/:id/upvote', protect, async (req, res) => {
  try {
    const comment = await ForumComment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    const upvoteIndex = comment.upvotes.indexOf(req.user.id);
    if (upvoteIndex !== -1) {
      comment.upvotes.splice(upvoteIndex, 1);
    } else {
      comment.upvotes.push(req.user.id);
    }

    await comment.save();
    res.json({ success: true, data: comment.upvotes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
