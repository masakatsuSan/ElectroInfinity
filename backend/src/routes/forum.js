const express = require('express');
const router = express.Router();
const ForumPost = require('../models/ForumPost');
const ForumComment = require('../models/ForumComment');
const { protect } = require('../middleware/auth');

// @route   GET /api/forum
// @desc    Get all forum posts
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const posts = await ForumPost.find()
      .sort({ createdAt: -1 })
      .populate('author', 'name role graduation_year')
      .populate('comments');
    res.json({ success: true, count: posts.length, data: posts });
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
      .populate('author', 'name role graduation_year')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name role graduation_year'
        }
      });
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
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
    req.body.author = req.user.id;
    const post = await ForumPost.create(req.body);
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
    
    // Check if already upvoted
    const upvoteIndex = post.upvotes.indexOf(req.user.id);
    if (upvoteIndex !== -1) {
      // Remove upvote
      post.upvotes.splice(upvoteIndex, 1);
    } else {
      // Add upvote
      post.upvotes.push(req.user.id);
    }
    
    await post.save();
    res.json({ success: true, data: post.upvotes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   POST /api/forum/:id/comments
// @desc    Add a comment to a post
// @access  Private
router.post('/:id/comments', protect, async (req, res) => {
  try {
    req.body.post = req.params.id;
    req.body.author = req.user.id;
    
    const comment = await ForumComment.create(req.body);
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
