const mongoose = require('mongoose')

const careerOpeningSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 300 },
    company: { type: String, required: true, trim: true, maxlength: 200 },
    type: {
      type: String,
      enum: ['job', 'internship', 'training'],
      required: true,
      default: 'job',
    },
    location: { type: String, required: true, trim: true, maxlength: 200 },
    mode: {
      type: String,
      enum: ['onsite', 'remote', 'hybrid'],
      required: true,
    },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    applyUrl: { type: String, required: true, trim: true },
    deadline: { type: Date, required: true },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
    published: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

careerOpeningSchema.index({ published: 1, status: 1, deadline: 1 })

module.exports = mongoose.model('CareerOpening', careerOpeningSchema)
