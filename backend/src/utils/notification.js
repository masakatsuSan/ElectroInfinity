const Notification = require('../models/Notification')

const DEFAULT_ICONS = {
  follow: 'user-plus',
  follow_back: 'user-check',
  forum_comment: 'message-circle',
  forum_reply: 'message-circle',
  forum_upvote: 'arrow-big-up',
  project_like: 'heart',
  project_approved: 'check-circle',
  project_rejected: 'x-circle',
  project_submitted: 'rocket',
  announcement: 'megaphone',
  deadline: 'clock',
  assignment: 'file-text',
  calendar_event: 'calendar',
  gallery_photo: 'image',
  resource_uploaded: 'upload',
  achievement: 'trophy',
  attendance_session: 'zap',
}

async function createNotification({
  recipient,
  actor = null,
  type,
  title,
  message = '',
  link = '',
  entityId = null,
  entityType = '',
  metadata = {},
  io = null,
}) {
  try {
    const notification = await Notification.create({
      recipient,
      actor,
      type,
      title,
      message,
      link,
      entityId,
      entityType,
      metadata: {
        ...metadata,
        icon: metadata.icon || DEFAULT_ICONS[type] || 'bell',
      },
    })

    const populated = await notification.populate('actor', 'name photo rollNumber')

    if (io) {
      io.to(`user:${recipient}`).emit('notification:new', {
        notification: populated,
        unreadCount: await getUnreadCount(recipient),
      })
    }

    return populated
  } catch (err) {
    console.error('Notification creation error:', err.message)
    return null
  }
}

async function createNotificationBulk({
  recipients,
  actor = null,
  type,
  title,
  message = '',
  link = '',
  entityId = null,
  entityType = '',
  metadata = {},
  io = null,
}) {
  try {
    const uniqueRecipients = [...new Set(recipients.map(String))]
    const notifications = uniqueRecipients.map((recipient) => ({
      recipient,
      actor,
      type,
      title,
      message,
      link,
      entityId,
      entityType,
      metadata: {
        ...metadata,
        icon: metadata.icon || DEFAULT_ICONS[type] || 'bell',
      },
    }))

    await Notification.insertMany(notifications)

    if (io) {
      for (const recipientId of uniqueRecipients) {
        io.to(`user:${recipientId}`).emit('notification:new', {
          notification: { type, title, message, link, entityId, entityType },
          unreadCount: await getUnreadCount(recipientId),
        })
      }
    }

    return notifications.length
  } catch (err) {
    console.error('Bulk notification creation error:', err.message)
    return 0
  }
}

async function getUnreadCount(userId) {
  try {
    return await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    })
  } catch {
    return 0
  }
}

async function markAsRead(notificationId, userId) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true },
      { new: true }
    )
    return notification
  } catch (err) {
    console.error('Mark notification read error:', err.message)
    return null
  }
}

async function markAllAsRead(userId) {
  try {
    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    )
  } catch (err) {
    console.error('Mark all notifications read error:', err.message)
  }
}

function formatTimeAgo(date) {
  const now = new Date()
  const diff = now - new Date(date)
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
}

module.exports = {
  createNotification,
  createNotificationBulk,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  formatTimeAgo,
  DEFAULT_ICONS,
}
