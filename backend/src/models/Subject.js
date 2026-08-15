const mongoose = require('mongoose')

const subjectSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    code:     { type: String, required: true, trim: true, uppercase: true },
    batch:    { type: String, required: true, trim: true },
    section:  { type: String, default: '' }, // e.g. "A", "B", or "" for all sections
    semester: { type: Number, default: 1 },
  },
  { timestamps: true }
)

subjectSchema.index({ code: 1, batch: 1, section: 1 }, { unique: true })

module.exports = mongoose.model('Subject', subjectSchema)
