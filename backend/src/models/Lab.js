const mongoose = require('mongoose')

const labSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    icon: { type: String, trim: true, default: '🧪' },
    desc: { type: String, required: true, trim: true },
    equip: [{ type: String, trim: true }]
  },
  { timestamps: true }
)

module.exports = mongoose.model('Lab', labSchema)
