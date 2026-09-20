const mongoose = require('mongoose')

const gallerySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true },

    imagePublicId: { type: String, default: '' },

    category: { type: String, enum: ['lab', 'event', 'campus', 'workshop', 'other'], default: 'campus' },
    date: { type: Date, default: Date.now },

    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isApproved: { type: Boolean, default: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: '' },
  },
  { timestamps: true }
)

// ── Indexes ────────────────────────────────────────────────────────────────
// Public list is sorted by date/createdAt (routes/gallery.js) and can be
// filtered by category or uploader; profile pages query by uploadedBy too.
gallerySchema.index({ date: -1, createdAt: -1 })
gallerySchema.index({ category: 1, date: -1 })
gallerySchema.index({ uploadedBy: 1, createdAt: -1 })

module.exports = mongoose.model('Gallery', gallerySchema)