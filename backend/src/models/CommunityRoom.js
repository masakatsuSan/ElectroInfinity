const mongoose = require('mongoose')

const communityRoomSchema = new mongoose.Schema(
  {
    name:         { type: String, required: [true, 'Room name is required'], unique: true, trim: true, maxlength: [50, 'Name cannot exceed 50 characters'] },
    description:  { type: String, trim: true, maxlength: [200, 'Description cannot exceed 200 characters'], default: '' },
    icon:         { type: String, default: 'Hash', trim: true },
    color:        { type: String, default: '#5865F2', trim: true, match: [/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, 'Invalid hex color'] },
    isPopular:    { type: Boolean, default: false },
    isActive:     { type: Boolean, default: true },
    createdBy:    { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    members:      [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
    postCount:    { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now }
  },
  { timestamps: true }
)

module.exports = mongoose.model('CommunityRoom', communityRoomSchema)
