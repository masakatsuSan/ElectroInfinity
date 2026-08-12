const mongoose = require('mongoose')

const deadlineSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  subject: { type: String, required: true },
  type: { type: String, enum: ['CA', 'PCA', 'LA'], required: true },
  driveLink: { type: String, required: true },
  deadline: { type: Date, required: true },
  batch: { type: String, required: true },
  section: { type: String, default: '' },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  submittedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true })

module.exports = mongoose.model('Deadline', deadlineSchema)
