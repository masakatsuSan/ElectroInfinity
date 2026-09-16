const mongoose = require('mongoose')

const friendRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
)

friendRequestSchema.index({ sender: 1, recipient: 1 }, { unique: true })
friendRequestSchema.index({ recipient: 1, status: 1, createdAt: -1 })

module.exports = mongoose.model('FriendRequest', friendRequestSchema)
