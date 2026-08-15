const mongoose = require('mongoose')

const roomSchema = new mongoose.Schema(
  {
    name:          { type: String, required: true, trim: true },
    latitude:      { type: Number, required: true },
    longitude:     { type: Number, required: true },
    radiusMeters:  { type: Number, required: true, default: 50 },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Room', roomSchema)
