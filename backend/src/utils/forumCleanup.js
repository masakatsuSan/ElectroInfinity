const ForumPost = require('../models/ForumPost')
const ForumComment = require('../models/ForumComment')

/**
 * Remove the forum content owned by a user before their account is deleted.
 *
 * Without this, ForumPost.author / ForumComment.author keep pointing at a user
 * document that no longer exists. `.populate()` then resolves them to `null`,
 * which produced posts rendering with a blank byline and, where the frontend
 * dereferenced `comment.author._id` directly, a hard render crash.
 */
async function purgeUserForumContent(userId) {
  if (!userId) return { posts: 0, comments: 0 }

  const [posts, comments] = await Promise.all([
    ForumPost.deleteMany({ author: userId }),
    ForumComment.deleteMany({ author: userId }),
  ])

  // Drop dangling references out of other users' posts. A reply whose author
  // was deleted keeps the parent thread intact but loses the author link.
  await ForumPost.updateMany(
    { 'comments.author': userId },
    { $pull: { comments: { author: userId } } }
  )

  return { posts: posts.deletedCount || 0, comments: comments.deletedCount || 0 }
}

module.exports = { purgeUserForumContent }
