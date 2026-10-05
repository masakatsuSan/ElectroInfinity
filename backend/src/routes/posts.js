const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { isAdmin } = require('../middleware/isAdmin')
const { uploadSingle } = require('../utils/upload')
const { writeLimiter, uploadLimiter } = require('../middleware/rateLimit')
const ctrl = require('../controllers/posts')

// ── Public routes ─────────────────────────────────────────────────────────

// GET /api/posts — published posts, paginated, filter by tag / search by title
router.get('/', ctrl.listPublished)

// GET /api/posts/:slug — published post by slug (admins can fetch drafts via /:id below)
router.get('/p/:slug', ctrl.getPublishedBySlug)

// ── Admin-only routes ─────────────────────────────────────────────────────

// GET /api/posts/admin/all — all drafts + published for the dashboard
router.get('/admin/all', protect, isAdmin, writeLimiter, ctrl.getAll)

// POST /api/posts — create a new draft
router.post('/', protect, isAdmin, writeLimiter, ctrl.create)

// GET /api/posts/:id — fetch any post by id or slug (admin preview of drafts)
router.get('/:id', protect, isAdmin, ctrl.getById)

// PUT /api/posts/:id — update (autosave) — accepts full replacement
router.put('/:id', protect, isAdmin, writeLimiter, ctrl.update)

// PATCH /api/posts/:id/publish & /unpublish
router.patch('/:id/publish', protect, isAdmin, writeLimiter, ctrl.publish)
router.patch('/:id/unpublish', protect, isAdmin, writeLimiter, ctrl.unpublish)
router.patch('/:id/archive', protect, isAdmin, writeLimiter, ctrl.archive)

// DELETE /api/posts/:id
router.delete('/:id', protect, isAdmin, writeLimiter, ctrl.remove)

// POST /api/posts/:id/clap
router.post('/:id/clap', protect, writeLimiter, ctrl.clap)

// POST /api/posts/:id/bookmark
router.post('/:id/bookmark', protect, writeLimiter, ctrl.bookmark)

// POST /api/posts/:id/view
router.post('/:id/view', ctrl.recordView)

// GET /api/posts/:id/stats
router.get('/:id/stats', ctrl.getStats)

// GET /api/posts/me
router.get('/me', protect, isAdmin, ctrl.getMyStories)

// GET /api/posts/feed
router.get('/feed', ctrl.listPublished)

// POST /api/uploads/image — Cloudinary image upload (admin)
router.post('/uploads/image', protect, isAdmin, uploadLimiter, uploadSingle('image'), ctrl.uploadImage)

module.exports = router
