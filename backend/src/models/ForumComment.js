const mongoose = require('mongoose');

const forumCommentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.ObjectId,
    ref: 'ForumPost',
    required: true
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    trim: true,
    default: ''
  },
  upvotes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  mentions: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  imageUrl: {
    type: String
  },
  parent: {
    type: mongoose.Schema.ObjectId,
    ref: 'ForumComment',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ForumComment', forumCommentSchema);
