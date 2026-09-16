const mongoose = require('mongoose')

const folderItemSchema = new mongoose.Schema(
  {
    ref: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    type: {
      type: String,
      enum: ['resource', 'lecture'],
      required: true,
    },
    title: { type: String, default: '' },
    thumbnail: { type: String, default: '' },
  },
  { _id: false }
)

const folderSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Folder title is required'],
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    description: { type: String, default: '' },

    semester: {
      type: Number,
      min: 1,
      max: 8,
      default: null,
    },

    subject: { type: String, default: '' },

    batchId: { type: String, default: '' },

    visibility: {
      type: String,
      enum: ['GLOBAL', 'BATCH'],
      default: 'BATCH',
    },

    items: [folderItemSchema],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
)

folderSchema.index({ slug: 1, batchId: 1 }, { unique: true })

module.exports = mongoose.model('Folder', folderSchema)
