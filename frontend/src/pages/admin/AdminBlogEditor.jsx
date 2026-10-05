import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPost, createPost, updatePost, publishPost, unpublishPost } from '../../api/posts'
import TipTapEditor from '../../components/blog/TipTapEditor'
import PostRenderer from '../../components/blog/PostRenderer'
import { useToast } from '../../context/ToastContext'
import { ArrowLeft, Save, Send, FileText, Tag, AlignLeft, Image } from 'lucide-react'
import { isExternalLink } from '../../utils/blogBlocks'

const BLANK_META = {
  title: '',
  slug: '',
  excerpt: '',
  tags: '',
  cover: '',
  coverAlt: '',
  status: 'draft',
}

export default function AdminBlogEditor() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { showToast } = useToast()
  const [meta, setMeta] = useState(BLANK_META)
  const [blocks, setBlocks] = useState([])
  const [isPreview, setIsPreview] = useState(false)
  const coverInputRef = useRef(null)

  const { data, isLoading } = useQuery({
    queryKey: ['post-edit', id],
    queryFn: () => getPost(id).then((r) => r.data),
    enabled: !!id,
    staleTime: 0,
  })

  useEffect(() => {
    if (data) {
      setMeta({
        title: data.title || '',
        slug: data.slug || '',
        excerpt: data.excerpt || '',
        tags: (data.tags || []).join(', '),
        cover: data.cover || '',
        coverAlt: data.coverAlt || data.title || '',
        status: data.status || 'draft',
      })
      setBlocks(data.blocks || [])
    }
  }, [data])

  const updateMut = useMutation({
    mutationFn: ({ id, ...d }) => updatePost(id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['post-edit', id] })
      qc.invalidateQueries({ queryKey: ['admin-posts'] })
      showToast('Draft saved')
    },
    onError: (err) => showToast(err.response?.data?.error || 'Save failed', 'error'),
  })

  const createMut = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-posts'] })
      navigate('/admin/posts')
      showToast('Post created')
    },
    onError: (err) => showToast(err.response?.data?.error || 'Create failed', 'error'),
  })

  const publishMut = useMutation({
    mutationFn: (postId) => publishPost(postId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-posts'] })
      qc.invalidateQueries({ queryKey: ['post-edit', id] })
      showToast('Post published')
    },
    onError: (err) => showToast(err.response?.data?.error || 'Publish failed', 'error'),
  })

  const unpublishMut = useMutation({
    mutationFn: (postId) => unpublishPost(postId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-posts'] })
      qc.invalidateQueries({ queryKey: ['post-edit', id] })
      showToast('Post unpublished')
    },
    onError: (err) => showToast(err.response?.data?.error || 'Unpublish failed', 'error'),
  })

  const handleSave = () => {
    if (!meta.title || !meta.slug) {
      showToast('Title and slug are required', 'error')
      return
    }
    const payload = buildPayload()
    if (isNew) {
      createMut.mutate(payload)
    } else {
      updateMut.mutate({ id, ...payload })
    }
  }

  const handlePublish = () => {
    if (!meta.title || !meta.slug) {
      showToast('Title and slug are required', 'error')
      return
    }
    const payload = buildPayload({ status: 'published' })
    if (isNew) {
      createMut.mutate(payload)
    } else {
      updateMut.mutate({ id, ...payload })
    }
  }

  const handleTogglePublish = () => {
    if (!meta.title || !meta.slug) {
      showToast('Title and slug are required', 'error')
      return
    }

    if (meta.status === 'published') {
      unpublishMut.mutate(id)
    } else {
      if (!blocks.length) {
        showToast('Add some content before publishing', 'error')
        return
      }
      if (isNew) {
        handlePublish()
      } else {
        publishMut.mutate(id)
      }
    }
  }

  function buildPayload(overrides = {}) {
    return {
      title: meta.title,
      slug: meta.slug,
      excerpt: meta.excerpt,
      tags: meta.tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      cover: meta.cover,
      coverAlt: meta.coverAlt,
      blocks: blocks,
      status: overrides.status || meta.status || 'draft',
    }
  }

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setMeta((m) => ({ ...m, [field]: val }))
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="font-[Inter,system-ui,sans-serif] text-ink-muted-80">Loading post…</p>
      </div>
    )
  }

  const status = meta.status || 'draft'

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/admin/posts')}
          className="p-1.5 rounded-md text-ink-muted-80 hover:text-ink hover:bg-soft-stone transition-colors"
          title="Back to posts"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-[Inter,system-ui,sans-serif] font-semibold text-[24px] tracking-tight text-ink">
          {isNew ? 'New Post' : 'Edit Post'}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-inkmuted-80 mb-1">
              Title *
            </label>
            <input
              value={meta.title}
              onChange={set('title')}
              className="input w-full"
              placeholder="Post title"
            />
          </div>

          <div>
            <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">
              Slug *
            </label>
            <input
              value={meta.slug}
              onChange={set('slug')}
              className="input w-full"
              placeholder="post-url-slug"
              onBlur={() => {
                setMeta((m) => ({
                  ...m,
                  slug: (m.slug || m.title || '')
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, ''),
                }))
              }}
            />
            <p className="font-[Inter,system-ui,sans-serif] text-[12px] text-slate mt-1">
              Used in the URL: /blog/{meta.slug || 'your-slug'}
            </p>
          </div>

          <div>
            <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">
              Excerpt
            </label>
            <textarea
              value={meta.excerpt}
              onChange={set('excerpt')}
              className="input w-full resize-none"
              rows={3}
              placeholder="A short summary..."
              maxLength={500}
            />
          </div>

          <div>
            <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">
              Tags
            </label>
            <input
              value={meta.tags}
              onChange={set('tags')}
              className="input w-full"
              placeholder="comma, separated, tags"
            />
          </div>

          <div>
            <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">
              Cover Image URL
            </label>
            <div className="flex gap-2">
              <input
                value={meta.cover}
                onChange={set('cover')}
                className="input flex-1"
                placeholder="https://..."
              />
              {meta.cover && isExternalLink(meta.cover) && (
                <img
                  src={meta.cover}
                  alt={meta.coverAlt || 'cover'}
                  className="w-10 h-10 rounded object-cover border border-divider_soft"
                  loading="lazy"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">
              Body
            </label>
            <TipTapEditor
              content={blocks}
              onChange={setBlocks}
              placeholder="Write your story here…"
            />
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="border border-divider_soft rounded-lg bg-canvas p-4 space-y-3">
            <h3 className="font-[Inter,system-ui,sans-serif] font-semibold text-[15px] text-ink">Post Actions</h3>

            <button
              onClick={handleSave}
              disabled={!meta.title || !meta.slug || updateMut.isPending || createMut.isPending}
              className="button-secondary w-full flex items-center justify-center gap-2"
            >
              <Save size={16} />
              {updateMut.isPending || createMut.isPending ? 'Saving…' : isNew ? 'Create Draft' : 'Save Draft'}
            </button>

            {status === 'published' ? (
              <button
                onClick={handleTogglePublish}
                disabled={unpublishMut.isPending || updateMut.isPending || createMut.isPending}
                className="button-secondary w-full !bg-soft-stone !text-ink-muted flex items-center justify-center gap-2"
              >
                {unpublishMut.isPending ? '…' : 'Unpublish'}
              </button>
            ) : (
              <button
                onClick={handleTogglePublish}
                disabled={publishMut.isPending || updateMut.isPending || createMut.isPending || !meta.title || !meta.slug || !blocks.length}
                className="button-primary w-full flex items-center justify-center gap-2"
              >
                <Send size={16} />
                {publishMut.isPending ? 'Publishing…' : 'Publish'}
              </button>
            )}

            <button
              onClick={() => setIsPreview(!isPreview)}
              className="button-pill-outline w-full flex items-center justify-center gap-2"
            >
              <FileText size={16} />
              {isPreview ? 'Hide Preview' : 'Preview'}
            </button>
          </div>

          {isPreview && (
            <div className="border border-divider_soft rounded-lg bg-canvas p-4">
              <h3 className="font-[Inter,system-ui,sans-serif] font-semibold text-[15px] text-ink mb-4">Preview</h3>
              <div className="prose prose-sm max-w-none">
                {meta.cover && (
                  <img src={meta.cover} alt={meta.coverAlt} className="w-full rounded-lg mb-4" />
                )}
                <h2 className="font-display text-section-heading text-ink">{meta.title || 'Untitled'}</h2>
                {meta.excerpt && <p className="text-body text-body">{meta.excerpt}</p>}
                <PostRenderer blocks={blocks} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
