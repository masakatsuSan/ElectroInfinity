const mongoose = require('mongoose')

const placedStudentSchema = new mongoose.Schema(
  {
    studentName: { type: String, required: true, trim: true, maxlength: 200 },
    branch: { type: String, required: true, trim: true, maxlength: 200 },
    batchYear: { type: String, required: true, trim: true, maxlength: 50 },
    company: { type: String, required: true, trim: true, maxlength: 200 },
    role: { type: String, required: true, trim: true, maxlength: 200 },
    package: { type: String, trim: true, default: '' },
    photoUrl: { type: String, trim: true, default: '' },
    type: {
      type: String,
      enum: ['placement', 'internship'],
      required: true,
      default: 'placement',
    },
    published: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

placedStudentSchema.index({ published: 1, batchYear: 1, type: 1 })

module.exports = mongoose.model('PlacedStudent', placedStudentSchema)
