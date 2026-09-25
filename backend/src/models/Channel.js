const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Channel name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
      match: [/^[a-z0-9-_]+$/, 'Name can only contain lowercase letters, numbers, hyphens, and underscores'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
      default: '',
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: [30, 'Category cannot exceed 30 characters'],
    },
    type: {
      type: String,
      enum: ['chat', 'forum'],
      default: 'chat',
    },
    allowedRoles: [{
      type: String,
      enum: ['student', 'cr', 'admin', 'super_admin', 'faculty'],
      default: ['student', 'cr', 'admin', 'super_admin', 'faculty'],
    }],
    postRoles: [{
      type: String,
      enum: ['student', 'cr', 'admin', 'super_admin', 'faculty'],
      default: ['cr', 'admin', 'super_admin', 'faculty'],
    }],
    isReadOnly: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [{
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    }],
    messageCount: {
      type: Number,
      default: 0,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

channelSchema.index({ category: 1, order: 1, name: 1 });
channelSchema.index({ slug: 1 }, { unique: true });
channelSchema.index({ allowedRoles: 1 });
channelSchema.index({ postRoles: 1 });

module.exports = mongoose.model('Channel', channelSchema);