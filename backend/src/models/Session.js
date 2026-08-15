const mongoose = require('mongoose')

const checkpointSchema = new mongoose.Schema(
  {
    number:      { type: Number, required: true },
    triggeredAt: { type: Date },
    expiresAt:   { type: Date },
  },
  { _id: false }
)

const sessionSchema = new mongoose.Schema(
  {
    subject:          { type: String, required: true, trim: true },
    course:           { type: String, trim: true, default: '' }, // alias for backward-compatibility
    batch:            { type: String, required: true, trim: true },
    section:          { type: String, default: '', trim: true },
    faculty:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    centerLat:        { type: Number, required: true }, // Faculty GPS Latitude anchor
    centerLng:        { type: Number, required: true }, // Faculty GPS Longitude anchor
    room:             { type: mongoose.Schema.Types.ObjectId, ref: 'Room' }, // Optional legacy room ref
    startTime:        { type: Date, default: Date.now },
    endTime:          { type: Date },
    durationMinutes:  { type: Number, default: 60 },
    status:           { type: String, enum: ['active', 'ended'], default: 'active' },
    active:           { type: Boolean, default: true },
    currentQrToken:   { type: String, default: '' },
    qrExpiresAt:      { type: Date },
    activeCheckpoint: { type: Number, default: 0 },
    checkpoints:      [checkpointSchema],
  },
  { timestamps: true }
)

// Synchronize active boolean with status
sessionSchema.pre('save', function (next) {
  if (this.course && !this.subject) {
    this.subject = this.course
  }
  if (this.subject && !this.course) {
    this.course = this.subject
  }
  this.active = this.status === 'active'
  next()
})

module.exports = mongoose.model('Session', sessionSchema)
