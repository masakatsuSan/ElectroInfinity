const Activity = require('../models/Activity')

async function createActivity(userId, type, title, description = '', link = '', metadata = {}) {
  try {
    const icons = {
      project_shared: 'code',
      resource_uploaded: 'upload',
      forum_post: 'message-square',
      badge_earned: 'award',
      achievement_completed: 'trophy',
      profile_updated: 'user',
    }

    await Activity.create({
      user: userId,
      type,
      title: title || getDefaultTitle(type),
      description,
      link,
      icon: icons[type] || 'activity',
      metadata,
    })
  } catch (err) {
    console.error('Activity creation error:', err.message)
  }
}

function getDefaultTitle(type) {
  const titles = {
    project_shared: 'Shared a new project',
    resource_uploaded: 'Uploaded a resource',
    forum_post: 'Posted in the forum',
    badge_earned: 'Earned a badge',
    achievement_completed: 'Completed an achievement',
    profile_updated: 'Updated profile',
  }
  return titles[type] || 'New activity'
}

module.exports = { createActivity, getDefaultTitle }
