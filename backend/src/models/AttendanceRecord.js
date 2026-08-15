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
    flagged:          { type: Boolean, default: false },
  },
  { timestamps: true }
)

attendanceRecordSchema.index({ session: 1, student: 1, checkpointNumber: 1 }, { unique: true })

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema)
