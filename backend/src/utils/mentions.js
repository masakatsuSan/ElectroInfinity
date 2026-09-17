const User = require('../models/User')

const MAX_MENTIONS = 10

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeHandle(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9_]/g, '')
}

function getUserHandle(user) {
  const value = user?.rollNumber || user?.name
  if (!value) return ''
  return `@${normalizeHandle(value)}`
}

function extractMentionHandles(text) {
  const handles = []
  const seen = new Set()
  const pattern = /(^|[\s([{<"'`])@([A-Za-z0-9_]{1,64})/g

  for (const match of String(text || '').matchAll(pattern)) {
    const handle = match[2].toLowerCase()
    if (!seen.has(handle)) {
      seen.add(handle)
      handles.push(handle)
    }
  }

  return handles
}

function buildNamePattern(handle) {
  return handle.split('').map((character) => `${escapeRegExp(character)}\\W*`).join('')
}

function mentionScore(user, handle) {
  const rollNumber = normalizeHandle(user.rollNumber)
  const name = normalizeHandle(user.name)

  if (rollNumber === handle) return 0
  if (name === handle) return 1
  if (rollNumber.startsWith(handle)) return 2
  if (name.startsWith(handle)) return 3
  return 4
}

async function findMentionCandidates(handles, findUsers = User.find.bind(User)) {
  if (!handles.length) return []

  const rollNumberQueries = handles.map((handle) => ({
    rollNumber: { $regex: `^${escapeRegExp(handle)}`, $options: 'i' },
  }))
  const nameQueries = handles.map((handle) => ({
    name: { $regex: buildNamePattern(handle), $options: 'i' },
  }))

  const query = findUsers({
    isActive: true,
    $or: [...rollNumberQueries, ...nameQueries],
  })

  if (!query || typeof query.select !== 'function') return query || []

  return query.select('_id name rollNumber').limit(100)
}

async function resolveMentions(text, options = {}) {
  const {
    actorId,
    maxMentions = MAX_MENTIONS,
    findUsers,
  } = options
  const normalizedText = String(text || '')
  const handles = extractMentionHandles(normalizedText).slice(0, maxMentions)

  if (!handles.length) {
    return { text: normalizedText, mentions: [] }
  }

  let users = []
  try {
    users = await findMentionCandidates(handles, findUsers)
  } catch {
    return { text: normalizedText, mentions: [] }
  }

  const mentions = []
  const seenUsers = new Set()

  for (const handle of handles) {
    const candidates = users
      .filter((user) => mentionScore(user, handle) < 4)
      .sort((a, b) => {
        const scoreDifference = mentionScore(a, handle) - mentionScore(b, handle)
        if (scoreDifference) return scoreDifference
        return normalizeHandle(a.name).length - normalizeHandle(b.name).length
      })
    const exactCandidates = candidates.filter((candidate) => mentionScore(candidate, handle) <= 1)
    const prefixCandidates = candidates.filter((candidate) => mentionScore(candidate, handle) === 2)
    const selected = exactCandidates.length === 1
      ? exactCandidates[0]
      : prefixCandidates.length === 1
        ? prefixCandidates[0]
        : null
    const userId = selected?._id?.toString()

    if (userId && userId !== String(actorId) && !seenUsers.has(userId)) {
      seenUsers.add(userId)
      mentions.push(selected._id)
    }
  }

  return { text: normalizedText, mentions }
}

module.exports = {
  MAX_MENTIONS,
  extractMentionHandles,
  findMentionCandidates,
  getUserHandle,
  resolveMentions,
}
