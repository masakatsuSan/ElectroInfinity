const mongoose = require('mongoose')

const contactSchema = new mongoose.Schema(
  {
    name:    { type: String, required: true, trim: true },
    email:   { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, default: '' },
    message: { type: String, required: true },

    // Admin-side bookkeeping for the contact inbox
    status:    { type: String, enum: ['new', 'read', 'archived'], default: 'new' },
    isReplied: { type: Boolean, default: false },
    readBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Contact', contactSchema)