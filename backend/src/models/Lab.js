const mongoose = require('mongoose')

const labSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    icon: { type: String, trim: true, default: '🧪' },
    desc: { type: String, required: true, trim: true },
    equip: [{ type: String, trim: true }],
    image: { type: String, default: '' },
    imagePublicId: { type: String, default: '' }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Lab', labSchema)
