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

    // Class context attached by faculty when posting a class notice
    // (subject : date : time) — purely informational, shown alongside the notice
    subject: { type: String, default: '' },
    date:     { type: Date,   default: null },
    time:     { type: String, default: '' },

    // Batch isolation (required for BATCH visibility)
    batchId: { type: String, default: '' },

    // Visibility control: GLOBAL (all batches) or BATCH (only specific batchId)
    visibility: {
      type: String,
      enum: ['GLOBAL', 'BATCH'],
      default: 'BATCH',
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Notice', noticeSchema)
