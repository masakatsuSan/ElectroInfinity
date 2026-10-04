const mongoose = require('mongoose')

const placementStatSchema = new mongoose.Schema(
  {
    academicYear: { type: String, required: true, trim: true },
    totalStudents: { type: Number, required: true, min: 0 },
    placed: { type: Number, required: true, min: 0 },
    highestPackage: { type: String, required: true, trim: true },
    averagePackage: { type: String, required: true, trim: true },
    medianPackage: { type: String, trim: true, default: '' },
    order: { type: Number, default: 0, index: true },
    published: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type:mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

placementStatSchema.index({ published: 1, order: 1, academicYear: 1 })

module.exports = mongoose.model('PlacementStat', placementStatSchema)
