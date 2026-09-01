const mongoose = require('mongoose')

const ytLectureSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },

    lectureNumber: {
      type: Number,
      required: [true, 'Lecture number is required'],
      min: 1,
    },

    youtubeVideoId: {
      type: String,
      required: [true, 'YouTube video ID is required'],
      trim: true,
    },

    semester: {
      type: Number,
      min: 1,
      max: 8,
      default: null,
    },

    subject: { type: String, default: '' },

    thumbnail: { type: String, default: '' },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    batchId: { type: String, default: '' },

    visibility: {
      type: String,
      enum: ['GLOBAL', 'BATCH'],
      default: 'BATCH',
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('YTLecture', ytLectureSchema)
