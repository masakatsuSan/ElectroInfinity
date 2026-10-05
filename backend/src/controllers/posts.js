const Post = require('../models/Post')
const { slugify, uniqueSlug } = require('../utils/slug')
const { sanitizeString, sanitizeUrl, sanitizeBlocks } = require('../utils/sanitize')
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/upload')

function pickErrors(err) {
  if (err.name === 'ValidationError') {
    return Object.values(err.errors).map((e) => e.message).join(', ')
  }
  if (err.code === 11000) return 'A post with that slug already exists'
  console.error('[posts] controller error:', err?.message, err?.stack)
  return 'An internal server error occurred'
}

function extractTextFromBlocks(blocks) {
  const parts = []
  const walk = (nodes) => {
    if (!Array.isArray(nodes)) return
    for (const node of nodes) {
      if (!node) continue
      if (node.type === 'text') {
        const text = String(node.text || '').trim()
        if (text) parts.push(text)
      } else if (Array.isArray(node.content)) {
        walk(node.content)
      }
    }
  }
  walk(blocks)
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

function computeReadTimeFromBlocks(blocks) {
  const text = extractTextFromBlocks(blocks)
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0
  return Math.max(1, Math.round(words / 200))
}

async function collectImagePublicIds(doc) {
  const ids = []
  if (doc.cover && doc.coverPublicId) ids.push({ id: doc.coverPublicId, type: 'image' })
  if (Array.isArray(doc.blocks)) {
    for (const b of doc.blocks) {
      if (b.type === 'image' && b.publicId) ids.push({ id: b.publicId, type: 'image' })
    }
  }
  return ids
}

exports.listPublished = async (req, res) => {
  try {
    const { tag, search, page = 1, limit = 12 } = req.query
    const q = { status: 'published' }
    if (tag) q.tags = tag
    if (search && search.trim()) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      q.title = regex
    }
    const skip = (Math.max(parseInt(page) || 1, 1) - 1) * Math.max(parseInt(limit) || 12, 1)
    const lim = Math.max(parseInt(limit) || 12, 1)
    const [items, total] = await Promise.all([
      Post.find(q)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(lim)
        .populate('author', 'name role photo')
        .lean(),
      Post.countDocuments(q),
    ])
    const payload = items.map((p) => ({
      _id: p._id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      cover: p.cover,
      tags: p.tags,
      topic: p.topic,
      author: p.author,
      publishedAt: p.publishedAt,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      readTime: p.readTime,
      clapCount: p.clapCount,
      commentCount: p.commentCount,
      viewCount: p.viewCount,
    }))
    res.json({
      success: true,
      data: payload,
      total,
      page: Math.max(parseInt(page) || 1, 1),
      totalPages: Math.ceil(total / lim),
    })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
}

exports.getPublishedBySlug = async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug, status: 'published' })
      .populate('author', 'name role photo')
      .lean()
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' })
    res.json({ success: true, data: post })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
}

exports.getById = async (req, res) => {
  try {
    const isId = /^[0-9a-fA-F]{24}$/.test(req.params.id)
    const query = isId ? { _id: req.params.id } : { slug: req.params.id }
    const post = await Post.findOne(query).populate('author', 'name role photo').lean()
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' })
    res.json({ success: true, data: post })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
}

exports.getAll = async (req, res) => {
  try {
    const { status, tag, search, page = 1, limit = 20 } = req.query
    const q = {}
    if (status && ['draft', 'published'].includes(status)) q.status = status
    if (tag) q.tags = tag
    if (search && search.trim()) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      q.title = regex
    }
    const skip = (Math.max(parseInt(page) || 1, 1) - 1) * Math.max(parseInt(limit) || 20, 1)
    const lim = Math.max(parseInt(limit) || 20, 1)
    const [items, total] = await Promise.all([
      Post.find(q)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(lim)
        .populate('author', 'name role photo'),
      Post.countDocuments(q),
    ])
    res.json({
      success: true,
      data: items,
      total,
      page: Math.max(parseInt(page) || 1, 1),
      totalPages: Math.ceil(total / lim),
    })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
}

exports.create = async (req, res) => {
  try {
    const title = sanitizeString(req.body.title || '')
    if (!title) return res.status(400).json({ success: false, error: 'Title is required' })

    const tags = Array.isArray(req.body.tags)
      ? req.body.tags.map((t) => sanitizeString(t)).filter(Boolean).slice(0, 20)
      : []
    const blocks = sanitizeBlocks(req.body.blocks || [])
    const contentText = extractTextFromBlocks(blocks)
    const readTime = computeReadTimeFromBlocks(blocks)

    const used = await Post.find({ slug: new RegExp(`^${slugify(title)}($|-.+)$`, 'i') }).select('slug')
    const slug = uniqueSlug(slugify(title), used.map((d) => d.slug))

    const post = await Post.create({
      title,
      slug,
      excerpt: sanitizeString(req.body.excerpt || '').slice(0, 500),
      cover: sanitizeUrl(req.body.cover) || '',
      coverPublicId: req.body.coverPublicId || '',
      tags,
      blocks,
      author: req.user._id,
      status: 'draft',
      subtitle: sanitizeString(req.body.subtitle || '').slice(0, 200),
      topic: sanitizeString(req.body.topic || '').toLowerCase(),
      allowResponses: req.body.allowResponses !== false,
      contentText,
      readTime,
    })

    res.status(201).json({ success: true, data: post })
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ success: false, error: pickErrors(err) })
    if (err.code === 11000) return res.status(409).json({ success: false, error: pickErrors(err) })
    res.status(500).json({ success: false, error: pickErrors(err) })
  }
}

exports.update = async (req, res) => {
  try {
    const isId = /^[0-9a-fA-F]{24}$/.test(req.params.id)
    const query = isId ? { _id: req.params.id } : { slug: req.params.id }
    const post = await Post.findOne(query)
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' })

    if (req.body.title !== undefined) post.title = sanitizeString(req.body.title)
    if (req.body.subtitle !== undefined) post.subtitle = sanitizeString(req.body.subtitle || '').slice(0, 200)
    if (req.body.excerpt !== undefined) post.excerpt = sanitizeString(req.body.excerpt || '').slice(0, 500)
    if (req.body.cover !== undefined) {
      const url = sanitizeUrl(req.body.cover)
      post.cover = url || ''
    }
    if (req.body.coverPublicId !== undefined) post.coverPublicId = sanitizeString(req.body.coverPublicId || '')
    if (req.body.tags !== undefined) {
      post.tags = Array.isArray(req.body.tags)
        ? req.body.tags.map((t) => sanitizeString(t)).filter(Boolean).slice(0, 20)
        : []
    }
    if (req.body.topic !== undefined) post.topic = sanitizeString(req.body.topic || '').toLowerCase()
    if (req.body.allowResponses !== undefined) post.allowResponses = !!req.body.allowResponses
    if (req.body.blocks !== undefined) {
      post.blocks = sanitizeBlocks(req.body.blocks)
      post.contentText = extractTextFromBlocks(post.blocks)
      post.readTime = computeReadTimeFromBlocks(post.blocks)
    }
    if (req.body.status !== undefined && ['draft', 'published', 'archived'].includes(req.body.status)) post.status = req.body.status

    if (post.isModified('title') || post.isModified('slug')) {
      if (post.title && !post.slug) {
        const used = await Post.find({ slug: new RegExp(`^${slugify(post.title)}($|-.+)$`, 'i'), _id: { $ne: post._id } }).select('slug')
        post.slug = uniqueSlug(slugify(post.title), used.map((d) => d.slug))
      }
    }

    await post.save()
    res.json({ success: true, data: post })
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ success: false, error: pickErrors(err) })
    if (err.code === 11000) return res.status(409).json({ success: false, error: pickErrors(err) })
    res.status(500).json({ success: false, error: pickErrors(err) })
  }
}

exports.publish = async (req, res) => {
  try {
    const isId = /^[0-9a-fA-F]{24}$/.test(req.params.id)
    const query = isId ? { _id: req.params.id } : { slug: req.params.id }
    const post = await Post.findOne(query)
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' })

    post.blocks = sanitizeBlocks(post.blocks)
    post.blocks = post.blocks.filter((b) => {
      if (b.type === 'divider') return true
      if (b.type === 'image') return b.src && b.src.trim().length > 0
      const text = (b.text || []).map((s) => s.t || '').join('')
      const items = (b.items || []).map((i) => (i.spans || i || []).map((s) => s.t || '').join('')).join('')
      return text.trim().length > 0 || items.trim().length > 0
    })
    if (post.blocks.length === 0) {
      return res.status(400).json({ success: false, error: 'Cannot publish an empty post' })
    }

    post.contentText = extractTextFromBlocks(post.blocks)
    post.readTime = computeReadTimeFromBlocks(post.blocks)
    post.status = 'published'
    post.publishedAt = post.publishedAt || new Date()
    post.archivedAt = null
    await post.save()
    res.json({ success: true, data: post })
  } catch (err) {
    res.status(500).json({ success: false, error: pickErrors(err) })
  }
}

exports.unpublish = async (req, res) => {
  try {
    const isId = /^[0-9a-fA-F]{24}$/.test(req.params.id)
    const query = isId ? { _id: req.params.id } : { slug: req.params.id }
    const post = await Post.findOne(query)
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' })
    post.status = 'draft'
    post.publishedAt = null
    await post.save()
    res.json({ success: true, data: post })
  } catch (err) {
    res.status(500).json({ success: false, error: pickErrors(err) })
  }
}

exports.archive = async (req, res) => {
  try {
    const isId = /^[0-9a-fA-F]{24}$/.test(req.params.id)
    const query = isId ? { _id: req.params.id } : { slug: req.params.id }
    const post = await Post.findOne(query)
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' })
    post.status = 'archived'
    post.archivedAt = new Date()
    post.publishedAt = null
    await post.save()
    res.json({ success: true, data: post })
  } catch (err) {
    res.status(500).json({ success: false, error: pickErrors(err) })
  }
}

exports.clap = async (req, res) => {
  try {
    const isId = /^[0-9a-fA-F]{24}$/.test(req.params.id)
    const query = isId ? { _id: req.params.id } : { slug: req.params.id }
    const post = await Post.findOne(query)
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' })
    if (post.status !== 'published') return res.status(400).json({ success: false, error: 'Cannot clap unpublished post' })

    const userId = req.user?._id
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const existing = post.claps?.find((c) => String(c.user) === String(userId) && c.date >= today)
    if (existing) {
      existing.count = Math.min(50, (existing.count || 0) + 1)
    } else {
      post.claps = post.claps || []
      post.claps.push({ user: userId, count: 1, date: today })
    }

    post.clapCount = (post.claps || []).reduce((sum, c) => sum + (c.count || 0), 0)
    await post.save()
    res.json({ success: true, data: { clapCount: post.clapCount, userClaps: existing ? existing.count : 1 } })
  } catch (err) {
    res.status(500).json({ success: false, error: pickErrors(err) })
  }
}

exports.bookmark = async (req, res) => {
  try {
    const isId = /^[0-9a-fA-F]{24}$/.test(req.params.id)
    const query = isId ? { _id: req.params.id } : { slug: req.params.id }
    const post = await Post.findOne(query)
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' })

    const userId = req.user?._id
    const existing = post.bookmarks?.find((b) => String(b.user) === String(userId))
    if (existing) {
      post.bookmarks = post.bookmarks.filter((b) => String(b.user) !== String(userId))
    } else {
      post.bookmarks = post.bookmarks || []
      post.bookmarks.push({ user: userId })
    }
    post.bookmarkCount = (post.bookmarks || []).length
    await post.save()
    res.json({ success: true, data: { bookmarked: !existing, bookmarkCount: post.bookmarkCount } })
  } catch (err) {
    res.status(500).json({ success: false, error: pickErrors(err) })
  }
}

exports.recordView = async (req, res) => {
  try {
    const isId = /^[0-9a-fA-F]{24}$/.test(req.params.id)
    const query = isId ? { _id: req.params.id } : { slug: req.params.id }
    const post = await Post.findOne(query)
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' })

    const userId = req.user?._id
    const sessionId = req.body?.sessionId
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const viewKey = userId ? `user_${userId}` : `session_${sessionId || 'anon'}`
    const existing = post.views?.find((v) => v.key === viewKey && v.date >= today)
    if (!existing) {
      post.views = post.views || []
      post.views.push({ key: viewKey, date: today })
      post.viewCount = (post.views || []).length
    }
    await post.save()
    res.json({ success: true, data: { viewCount: post.viewCount } })
  } catch (err) {
    res.status(500).json({ success: false, error: pickErrors(err) })
  }
}

exports.getStats = async (req, res) => {
  try {
    const isId = /^[0-9a-fA-F]{24}$/.test(req.params.id)
    const query = isId ? { _id: req.params.id } : { slug: req.params.id }
    const post = await Post.findOne(query).select('viewCount clapCount commentCount bookmarkCount').lean()
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' })
    res.json({ success: true, data: { viewCount: post.viewCount, clapCount: post.clapCount, commentCount: post.commentCount, bookmarkCount: post.bookmarkCount } })
  } catch (err) {
    res.status(500).json({ success: false, error: pickErrors(err) })
  }
}

exports.getMyStories = async (req, res) => {
  try {
    const userId = req.user?._id
    const { status, page = 1, limit = 20 } = req.query
    const q = { author: userId }
    if (status && ['draft', 'published', 'archived'].includes(status)) q.status = status
    const skip = (Math.max(parseInt(page) || 1, 1) - 1) * Math.max(parseInt(limit) || 20, 1)
    const lim = Math.max(parseInt(limit) || 20, 1)
    const [items, total] = await Promise.all([
      Post.find(q)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(lim)
        .populate('author', 'name role photo'),
      Post.countDocuments(q),
    ])
    res.json({ success: true, data: items, total, page: Math.max(parseInt(page) || 1, 1), totalPages: Math.ceil(total / lim) })
  } catch (err) {
    res.status(500).json({ success: false, error: pickErrors(err) })
  }
}

exports.remove = async (req, res) => {
  try {
    const isId = /^[0-9a-fA-F]{24}$/.test(req.params.id)
    const query = isId ? { _id: req.params.id } : { slug: req.params.id }
    const post = await Post.findOne(query)
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' })

    const assets = await collectImagePublicIds(post)
    const result = await post.deleteOne()

    setImmediate(async () => {
      for (const asset of assets) {
        try {
          await deleteFromCloudinary(asset.id, asset.type)
        } catch {}
      }
    })

    res.json({ success: true, message: 'Post deleted', data: { id: result._id || req.params.id } })
  } catch (err) {
    res.status(500).json({ success: false, error: pickErrors(err) })
  }
}

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No image file provided' })

    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(req.file.mimetype)) {
      return res.status(400).json({ success: false, error: 'Only JPG, PNG and WebP images are allowed (max 5MB)' })
    }
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(413).json({ success: false, error: 'Image must be smaller than 5MB' })
    }

    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'electro-infinity/blog',
      resource_type: 'image',
    })

    res.status(201).json({ success: true, data: { url: result.url, publicId: result.publicId } })
  } catch (err) {
    res.status(502).json({ success: false, error: err?.message || 'Image upload failed' })
  }
}
