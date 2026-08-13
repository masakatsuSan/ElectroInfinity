const mongoose = require('mongoose')

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },

    type: {
      type: String,
      enum: ['notes', 'pyq', 'assignment', 'lab_manual', 'syllabus', 'other'],
      required: true,
    },

    // Which semester this belongs to (3–8)
    semester: {
      type: Number,
      min: 1,
      max: 8,
      default: null,
    },

    subject: { type: String, default: '' },

    // Cloudinary file URL and public ID (needed to delete later)
    fileUrl:    { type: String, required: true },
    filePublicId: { type: String, default: '' },
    fileName:   { type: String, default: '' },

    // How many students downloaded this
    downloadCount: { type: Number, default: 0 },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Assignment-specific: due date
    dueDate: { type: Date, default: null },

    // Batch isolation
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

module.exports = mongoose.model('Resource', resourceSchema)
