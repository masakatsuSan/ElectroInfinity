const mongoose = require('mongoose')

const gallerySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true },

    imagePublicId: { type: String, default: '' },

    category: { type: String, enum: ['lab', 'event', 'campus', 'other'], default: 'campus' },
    date: { type: Date, default: Date.now },

    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isApproved: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Gallery', gallerySchema)