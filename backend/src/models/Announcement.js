const mongoose = require('mongoose')

const announcementSchema = new mongoose.Schema(
  {
    title:          { type: String, required: [true, 'Title is required'], trim: true, maxlength: [200, 'Title cannot exceed 200 characters'] },
    content:        { type: String, required: [true, 'Content is required'], trim: true, maxlength: [2000, 'Content cannot exceed 2000 characters'] },
    category:       { type: String, enum: ['exam', 'lab', 'event', 'academic', 'placement', 'general', 'urgent'], default: 'general' },
    postedBy:       { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    isPinned:       { type: Boolean, default: false },
    attachmentUrl:  { type: String, default: '' },
    targetAudience: { type: String, enum: ['all', 'batch', 'section'], default: 'all' },
    batchId:        { type: String, default: '' },
    section:        { type: String, default: '' },
    expiresAt:      { type: Date, default: null },
    readBy:         [{ type: mongoose.Schema.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
)

announcementSchema.index({ createdAt: -1 })
announcementSchema.index({ targetAudience: 1, batchId: 1, section: 1 })

module.exports = mongoose.model('Announcement', announcementSchema)
