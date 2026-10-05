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
      author: p.author,
      publishedAt: p.publishedAt,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
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
    if (req.body.blocks !== undefined) post.blocks = sanitizeBlocks(req.body.blocks)
    if (req.body.status !== undefined && ['draft', 'published'].includes(req.body.status)) post.status = req.body.status

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

    post.status = 'published'
    post.publishedAt = post.publishedAt || new Date()
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
