const mongoose = require('mongoose')

const academicCalendarSchema = new mongoose.Schema(
  {
    title:       { type: String, required: [true, 'Title is required'], trim: true, maxlength: [200, 'Title cannot exceed 200 characters'] },
    date:        { type: Date, required: [true, 'Date is required'] },
    type:        { type: String, enum: ['exam', 'holiday', 'registration', 'deadline', 'event', 'other'], default: 'other' },
    description: { type: String, trim: true, maxlength: [500, 'Description cannot exceed 500 characters'], default: '' },
    batch:       { type: String, default: '' },
    createdBy:   { type: mongoose.Schema.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
)

academicCalendarSchema.index({ date: 1 })
academicCalendarSchema.index({ batch: 1, date: 1 })

module.exports = mongoose.model('AcademicCalendar', academicCalendarSchema)
