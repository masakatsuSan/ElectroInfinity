const mongoose = require('mongoose')

const badgeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    icon: { type: String, default: '' },
    color: { type: String, default: '#1863dc' },
    criteria: { type: String, default: '' },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Badge', badgeSchema)
