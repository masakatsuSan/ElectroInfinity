const mongoose = require('mongoose')
const Notification = require('../models/Notification')

const DEFAULT_ICONS = {
  follow: 'user-plus',
  follow_back: 'user-check',
  friend_request: 'user-plus',
  friend_accepted: 'user-check',
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
  chat_message: 'message-circle',
  chat_mention: 'at-sign',
  chat_reply: 'reply',
  attendance_session: 'clipboard-check',
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
      io.to(`user:${String(recipient)}`).emit('notification:new', {
        notification: populated,
        unreadCount: await getUnreadCount(recipient),
      })
    }

    return populated
  } catch (err) {
    console.error(`[Notification] createNotification failed (type=${type}, recipient=${recipient}, actor=${actor}):`, err)
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
      const counts = await getUnreadCounts(uniqueRecipients)
      for (const recipientId of uniqueRecipients) {
        io.to(`user:${String(recipientId)}`).emit('notification:new', {
          notification: { type, title, message, link, entityId, entityType },
          unreadCount: counts.get(recipientId) || 0,
        })
      }
    }

    return notifications.length
  } catch (err) {
    console.error(`[Notification] createNotificationBulk failed (type=${type}):`, err)
    return 0
  }
}

async function getUnreadCount(userId) {
  try {
    return await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    })
  } catch (err) {
    console.error(`[Notification] getUnreadCount failed (user=${userId}):`, err)
    return 0
  }
}

/**
 * Unread counts for many recipients in ONE query.
 *
 * createNotificationBulk previously called getUnreadCount() inside a sequential
 * loop — ~170 round-trips to MongoDB Atlas for a single upload, which was slow
 * enough to blow the client's request timeout. One $group by recipient replaces
 * the lot.
 */
async function getUnreadCounts(userIds) {
  const ids = [...new Set((userIds || []).map(String))].filter(Boolean)
  if (!ids.length) return new Map()

  try {
    // aggregate() does NOT cast like a normal query does, so the ids must be
    // turned into ObjectIds explicitly — passing the raw strings matches
    // nothing and silently reports every recipient as having 0 unread.
    const objectIds = ids
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id))

    if (!objectIds.length) return new Map(ids.map((id) => [id, 0]))

    const rows = await Notification.aggregate([
      { $match: { recipient: { $in: objectIds }, isRead: false } },
      { $group: { _id: '$recipient', count: { $sum: 1 } } },
    ])

    const counts = new Map(ids.map((id) => [id, 0]))
    rows.forEach((row) => counts.set(String(row._id), row.count))
    return counts
  } catch (err) {
    console.error('[Notification] getUnreadCounts failed:', err)
    return new Map(ids.map((id) => [id, 0]))
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
    console.error(`[Notification] markAsRead failed (id=${notificationId}, user=${userId}):`, err)
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
    console.error(`[Notification] markAllAsRead failed (user=${userId}):`, err)
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

const DEDUP_TYPES = new Set(['friend_request', 'friend_accepted'])

async function createAndEmitNotification({
  recipientId,
  senderId,
  type,
  title,
  message = '',
  link = '',
  meta = {},
}) {
  const { io, entityId = null, entityType = '', ...rest } = meta

  try {
    if (DEDUP_TYPES.has(type)) {
      const existing = await Notification.findOne({
        recipient: recipientId,
        actor: senderId,
        type,
        entityId: entityId || null,
        isRead: false,
      }).sort({ createdAt: -1 })
      if (existing) return existing
    }

    const notification = await Notification.create({
      recipient: recipientId,
      actor: senderId,
      type,
      title,
      message,
      link,
      entityId: entityId || null,
      entityType,
      metadata: {
        ...rest,
        icon: rest.icon || DEFAULT_ICONS[type] || 'bell',
      },
    })

    const populated = await notification.populate('actor', 'name photo rollNumber')

    if (io) {
      io.to(`user:${String(recipientId)}`).emit('notification:new', {
        notification: populated,
        unreadCount: await getUnreadCount(recipientId),
      })
    }

    return populated
  } catch (err) {
    console.error(`[Notification] createAndEmitNotification failed (type=${type}, recipient=${recipientId}, sender=${senderId}):`, err)
    return null
  }
}

module.exports = {
  createNotification,
  createNotificationBulk,
  createAndEmitNotification,
  getUnreadCount,
  getUnreadCounts,
  markAsRead,
  markAllAsRead,
  formatTimeAgo,
  DEFAULT_ICONS,
}
