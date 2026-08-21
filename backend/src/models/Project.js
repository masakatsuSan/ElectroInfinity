const mongoose = require('mongoose')

const projectSchema = new mongoose.Schema(
  {
    title:       { type: String, required: [true, 'Title is required'], trim: true, maxlength: [150, 'Title cannot exceed 150 characters'] },
    description: { type: String, required: [true, 'Description is required'], trim: true, maxlength: [2000, 'Description cannot exceed 2000 characters'] },
    techStack:   [{ type: String, trim: true }],
    githubLink:  { type: String, default: '' },
    demoLink:    { type: String, default: '' },
    author:      { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    images:      [{ type: String }],
    likes:       [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
    isApproved:  { type: Boolean, default: false },
    approvedBy:  { type: mongoose.Schema.ObjectId, ref: 'User', default: null },
    rejectionReason: { type: String, trim: true, maxlength: [500], default: '' }
  },
  { timestamps: true }
)

projectSchema.index({ isApproved: 1, createdAt: -1 })
projectSchema.index({ author: 1, createdAt: -1 })

module.exports = mongoose.model('Project', projectSchema)
