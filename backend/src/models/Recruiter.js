const mongoose = require('mongoose')

const recruiterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    logoUrl: { type: String, required: true, trim: true },
    website: { type: String, trim: true, default: '' },
    type: {
      type: String,
      enum: ['placement', 'internship', 'both'],
      default: 'both',
    },
    order: { type: Number, default: 0, index: true },
    published: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

recruiterSchema.index({ published: 1, order: 1 })

module.exports = mongoose.model('Recruiter', recruiterSchema)
