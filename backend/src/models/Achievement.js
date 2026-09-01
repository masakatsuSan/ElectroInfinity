const mongoose = require('mongoose')

const achievementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    image: { type: String, default: '' },
    imagePublicId: { type: String, default: '' },
    certificatePdf: { type: String, default: '' },
    certificatePdfPublicId: { type: String, default: '' },
    category: { type: String, enum: ['student', 'faculty', 'awards'], default: 'student' },
    students: [{ type: String, trim: true }],
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isApproved: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    rejectionReason: { type: String, default: '' },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Achievement', achievementSchema)
