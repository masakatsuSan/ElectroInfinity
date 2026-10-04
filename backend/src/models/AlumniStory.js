const mongoose = require('mongoose')

const alumniStorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    batchYear: { type: String, required: true, trim: true, maxlength: 50 },
    currentRole: { type: String, required: true, trim: true, maxlength: 200 },
    company: { type: String, required: true, trim: true, maxlength: 200 },
    quote: { type: String, required: true, trim: true, maxlength: 2000 },
    photoUrl: { type: String, trim: true, default: '' },
    linkedinUrl: { type: String, trim: true, default: '' },
    order: { type: Number, default: 0, index: true },
    published: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

alumniStorySchema.index({ published: 1, order: 1 })

module.exports = mongoose.model('AlumniStory', alumniStorySchema)
