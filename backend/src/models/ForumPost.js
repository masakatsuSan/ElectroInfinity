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
  room: {
    type: mongoose.Schema.ObjectId,
    ref: 'CommunityRoom',
    required: [true, 'Room is required'],
    index: true
  },
  postType: {
    type: String,
    enum: ['text', 'image', 'poll', 'link'],
    default: 'text'
  },
  upvotes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  downvotes: [{
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
  pollOptions: [{
    text: { type: String, required: true, trim: true },
    votes: { type: Number, default: 0 }
  }],
  linkUrl: {
    type: String,
    default: ''
  },
  isPinned: {
    type: Boolean,
    default: false
  },
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
