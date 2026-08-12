const mongoose = require('mongoose');

const forumPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
    maxlength: [150, 'Title cannot be more than 150 characters']
  },
  content: {
    type: String,
    required: [true, 'Please provide post content']
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  upvotes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  links: [{
    type: String
  }],
  mediaUrls: [{
    type: String
  }],
  tags: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Reverse populate with comments
forumPostSchema.virtual('comments', {
  ref: 'ForumComment',
  localField: '_id',
  foreignField: 'post',
  justOne: false
});

module.exports = mongoose.model('ForumPost', forumPostSchema);
