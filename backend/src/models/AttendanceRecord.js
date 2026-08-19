const mongoose = require('mongoose')

const attendanceRecordSchema = new mongoose.Schema(
  {
    session:          { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    student:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    checkpointNumber: { type: Number, default: 0 },
    timestamp:        { type: Date, default: Date.now },
    locationVerified: { type: Boolean, default: false },
    distanceInMeters: { type: Number, default: 0 },
    latitude:         { type: Number },
    longitude:        { type: Number },
    accuracy:         { type: Number, default: null }, // student GPS accuracy in meters
    manualOverride:   { type: Boolean, default: false }, // faculty tapped "Mark Present"
    flagged:          { type: Boolean, default: false },
  },
  { timestamps: true }
)

attendanceRecordSchema.index({ session: 1, student: 1, checkpointNumber: 1 }, { unique: true })

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema)
