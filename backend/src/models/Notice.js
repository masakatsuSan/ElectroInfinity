const mongoose = require('mongoose')

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Notice title is required'],
      trim: true,
    },

    body: {
      type: String,
      default: '',
    },

    category: {
      type: String,
      enum: ['exam', 'lab', 'event', 'academic', 'placement', 'general'],
      default: 'general',
    },

    // Who posted this notice — ref to User model
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Pinned notices show at the top
    isPinned: {
      type: Boolean,
      default: false,
    },

    // Optional PDF attachment uploaded to Cloudinary
    attachmentUrl:  { type: String, default: '' },
    attachmentName: { type: String, default: '' },

    // Optional expiry date — expired notices auto-hide
    expiresAt: {
      type: Date,
      default: null,
    },

    // Batch isolation
    batch: { type: String, default: '' },

    // Universal notice (visible to all batches)
    isUniversal: { type: Boolean, default: false },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Notice', noticeSchema)
