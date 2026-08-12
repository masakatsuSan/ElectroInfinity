const mongoose = require('mongoose')

const gallerySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true },
    category: { type: String, enum: ['lab', 'event', 'campus', 'other'], default: 'campus' },
    date: { type: Date, default: Date.now }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Gallery', gallerySchema)
