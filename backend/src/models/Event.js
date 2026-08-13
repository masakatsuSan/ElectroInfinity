const mongoose = require('mongoose')

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },

    type: {
      type: String,
      enum: ['workshop', 'seminar', 'fest', 'activity', 'other'],
      default: 'workshop',
    },

    description: { type: String, default: '' },

    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },

    venue: { type: String, default: '' },

    // Optional banner image from Cloudinary
    bannerUrl:       { type: String, default: '' },
    bannerPublicId:  { type: String, default: '' },

    // External registration link
    registrationLink: { type: String, default: '' },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Batch isolation (required for BATCH visibility)
    batchId: { type: String, default: '' },

    // Visibility control: GLOBAL (all batches) or BATCH (only specific batchId)
    visibility: {
      type: String,
      enum: ['GLOBAL', 'BATCH'],
      default: 'BATCH',
    },
  },
  { timestamps: true }
)

// Virtual field — is this event upcoming or past?
eventSchema.virtual('isUpcoming').get(function () {
  return this.date > new Date()
})

// Include virtuals when converting to JSON
eventSchema.set('toJSON', { virtuals: true })

module.exports = mongoose.model('Event', eventSchema)
