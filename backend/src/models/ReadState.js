const mongoose = require('mongoose');

const readStateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    channelId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Channel',
      required: true,
      index: true,
    },
    lastReadAt: {
      type: Date,
      default: Date.now,
    },
    lastReadMessageId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Message',
      default: null,
    },
  },
  { timestamps: true }
);

readStateSchema.index({ userId: 1, channelId: 1 }, { unique: true });

module.exports = mongoose.model('ReadState', readStateSchema);