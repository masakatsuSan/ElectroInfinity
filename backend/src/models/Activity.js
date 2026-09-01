const mongoose = require('mongoose')

const activitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['project_shared', 'resource_uploaded', 'forum_post', 'badge_earned', 'achievement_completed', 'profile_updated'],
      default: 'profile_updated',
    },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    link: { type: String, default: '' },
    icon: { type: String, default: 'activity' },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Activity', activitySchema)
