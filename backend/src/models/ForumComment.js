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
    required: [true, 'Please provide comment content']
  },
  upvotes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  imageUrl: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ForumComment', forumCommentSchema);
