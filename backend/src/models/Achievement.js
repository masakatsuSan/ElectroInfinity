const mongoose = require('mongoose')

const achievementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    image: { type: String, default: '' },
    imagePublicId: { type: String, default: '' },
    category: { type: String, enum: ['student', 'faculty', 'awards'], default: 'student' },
    students: [{ type: String, trim: true }] // Names or roll numbers of students involved
  },
  { timestamps: true }
)

module.exports = mongoose.model('Achievement', achievementSchema)
