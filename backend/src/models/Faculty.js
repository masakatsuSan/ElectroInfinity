const mongoose = require('mongoose')

const facultySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    qualification: { type: String, required: true, trim: true },
    specialization: { type: String, trim: true },
    email: { type: String, trim: true },
    photo: { type: String, default: '' },
    isHOD: { type: Boolean, default: false }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Faculty', facultySchema)
