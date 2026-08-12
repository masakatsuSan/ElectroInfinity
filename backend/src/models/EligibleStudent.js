const mongoose = require('mongoose')

const eligibleStudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  collegeEmail: { type: String, required: true, unique: true },
  rollNumber: { type: String, required: true },
  regNumber: { type: String, required: true },
  batch: { type: String, required: true },
  section: { type: String, default: '' },
  used: { type: Boolean, default: false } // has this record been claimed during registration
}, { timestamps: true })

module.exports = mongoose.model('EligibleStudent', eligibleStudentSchema)
