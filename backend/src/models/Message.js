const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    channelId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Channel',
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    replyTo: {
      type: mongoose.Schema.ObjectId,
      ref: 'Message',
      default: null,
    },
    mentions: [{
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    }],
    reactions: [{
      emoji: { type: String, required: true },
      userIds: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
    }],
    deletedAt: {
      type: Date,
      default: null,
    },
    editedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

messageSchema.index({ channelId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ replyTo: 1 });
messageSchema.index({ 'reactions.emoji': 1 });

module.exports = mongoose.model('Message', messageSchema);