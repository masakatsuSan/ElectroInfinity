const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    type: {
      type: String,
      enum: [
        'follow',
        'follow_back',
        'friend_request',
        'friend_accepted',
        'project_like',
        'project_approved',
        'project_rejected',
        'project_submitted',
        'announcement',
        'deadline',
        'assignment',
        'calendar_event',
        'gallery_photo',
        'resource_uploaded',
        'achievement',
        'chat_message',
        'chat_mention',
        'chat_reply',
        'attendance_session',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      default: '',
      trim: true,
    },
    link: {
      type: String,
      default: '',
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    entityType: {
      type: String,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

notificationSchema.index({ recipient: 1, createdAt: -1 })
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 })
notificationSchema.index({ recipient: 1, type: 1, entityId: 1, createdAt: -1 })

module.exports = mongoose.model('Notification', notificationSchema)
