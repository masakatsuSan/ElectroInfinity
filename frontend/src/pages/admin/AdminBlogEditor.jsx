import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPost, createPost, updatePost, publishPost, unpublishPost, archivePost } from '../../api/posts'
import TipTapEditor from '../../components/blog/TipTapEditor'
import PostRenderer from '../../components/blog/PostRenderer'
import PublishModal from '../../components/blog/PublishModal'
import { useToast } from '../../context/ToastContext'
import { ArrowLeft, Save, Send, FileText, Tag, AlignLeft, Image, Settings, X } from 'lucide-react'
import { isExternalLink } from '../../utils/blogBlocks'

const BLANK_META = {
  title: '',
  subtitle: '',
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
  const [showSettings, setShowSettings] = useState(false)
  const [showPublish, setShowPublish] = useState(false)
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
        subtitle: data.subtitle || '',
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
    if (!meta.title) {
      showToast('Title is required', 'error')
      return
    }
    const payload = buildPayload()
    if (isNew) {
      createMut.mutate(payload)
    } else {
      updateMut.mutate({ id, ...payload })
    }
  }

  const handlePublishClick = () => {
    if (!meta.title) {
      showToast('Title is required', 'error')
      return
    }
    if (!blocks.length) {
      showToast('Add some content before publishing', 'error')
      return
    }
    setShowPublish(true)
  }

  const handlePublishConfirm = async ({ title, subtitle, excerpt, tags, topic, allowResponses, cover }) => {
    const payload = buildPayload({ status: 'published', title, subtitle, excerpt, tags, topic, allowResponses, cover })
    if (isNew) {
      createMut.mutate(payload)
    } else {
      updateMut.mutate({ id, ...payload })
    }
    setShowPublish(false)
  }

  const handleTogglePublish = () => {
    if (!meta.title) {
      showToast('Title is required', 'error')
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
        handlePublishClick()
      } else {
        publishMut.mutate(id)
      }
    }
  }

  function buildPayload(overrides = {}) {
    return {
      title: overrides.title || meta.title,
      subtitle: overrides.subtitle || meta.subtitle,
      slug: meta.slug,
      excerpt: overrides.excerpt || meta.excerpt,
      tags: overrides.tags || meta.tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      cover: overrides.cover || meta.cover,
      coverAlt: meta.coverAlt,
      blocks: blocks,
      status: overrides.status || meta.status || 'draft',
      topic: overrides.topic || meta.topic || '',
      allowResponses: overrides.allowResponses !== false,
    }
  }

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setMeta((m) => ({ ...m, [field]: val }))
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="font-sans text-ink-muted">Loading post…</p>
      </div>
    )
  }

  const status = meta.status || 'draft'

  return (
    <div className="min-h-screen bg-canvas">
      {/* Minimal top bar */}
      <div className="sticky top-0 z-30 bg-canvas/80 backdrop-blur-md border-b border-hairline">
        <div className="max-w-[900px] mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/posts')}
              className="p-2 -ml-2 rounded-md text-ink-muted hover:text-ink hover:bg-surface-soft transition-colors"
              title="Back to posts"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="font-sans text-[15px] font-semibold text-ink leading-tight">
                {isNew ? 'New Post' : 'Edit Post'}
              </h1>
              {!isNew && (
                <p className="font-sans text-[11px] text-ink-muted leading-tight">
                  {status === 'published' ? 'Published' : 'Draft'}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-md transition-colors ${showSettings ? 'text-primary bg-surface-soft' : 'text-ink-muted hover:text-ink hover:bg-surface-soft'}`}
              title="Post settings"
            >
              <Settings size={18} />
            </button>
            {status === 'published' ? (
              <button
                onClick={handleTogglePublish}
                disabled={unpublishMut.isPending || updateMut.isPending || createMut.isPending}
                className="button-secondary !py-2 !px-4 text-[13px]"
              >
                {unpublishMut.isPending ? '…' : 'Unpublish'}
              </button>
            ) : (
              <button
                onClick={handlePublishClick}
                disabled={publishMut.isPending || updateMut.isPending || createMut.isPending || !meta.title || !blocks.length}
                className="button-primary !py-2 !px-4 text-[13px]"
              >
                <Send size={14} />
                {publishMut.isPending ? 'Publishing…' : 'Publish'}
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!meta.title || updateMut.isPending || createMut.isPending}
              className="button-secondary !py-2 !px-4 text-[13px]"
            >
              <Save size={14} />
              {updateMut.isPending || createMut.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
          {/* Editor */}
          <div>
<TipTapEditor
                content={blocks}
                onChange={setBlocks}
                title={meta.title}
                subtitle={meta.subtitle}
                onTitleChange={(val) => setMeta((m) => ({ ...m, title: val }))}
                onSubtitleChange={(val) => setMeta((m) => ({ ...m, subtitle: val }))}
                placeholder="Write your story here…"
                onPublish={handlePublishClick}
                onBack={() => navigate('/admin/posts')}
              />
          </div>

          {/* Settings panel */}
          <div className={`lg:block ${showSettings ? 'block' : 'hidden'}`}>
            <div className="lg:sticky lg:top-24 space-y-6">
              <div className="border border-divider-soft rounded-xl bg-canvas p-5 space-y-4">
                <h3 className="font-sans text-[15px] font-semibold text-ink">Post Settings</h3>

                <div>
                  <label className="block font-sans text-[13px] font-medium text-ink-muted mb-1.5">
                    Slug
                  </label>
                  <input
                    value={meta.slug}
                    onChange={set('slug')}
                    className="input w-full text-[13px]"
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
                  <p className="font-sans text-[11px] text-ink-muted mt-1">
                    /blog/{meta.slug || 'your-slug'}
                  </p>
                </div>

                <div>
                  <label className="block font-sans text-[13px] font-medium text-ink-muted mb-1.5">
                    Excerpt
                  </label>
                  <textarea
                    value={meta.excerpt}
                    onChange={set('excerpt')}
                    className="input w-full resize-none text-[13px]"
                    rows={3}
                    placeholder="A short summary..."
                    maxLength={500}
                  />
                </div>

                <div>
                  <label className="block font-sans text-[13px] font-medium text-ink-muted mb-1.5">
                    Tags
                  </label>
                  <input
                    value={meta.tags}
                    onChange={set('tags')}
                    className="input w-full text-[13px]"
                    placeholder="comma, separated, tags"
                  />
                </div>

                <div>
                  <label className="block font-sans text-[13px] font-medium text-ink-muted mb-1.5">
                    Cover Image URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={meta.cover}
                      onChange={set('cover')}
                      className="input flex-1 text-[13px]"
                      placeholder="https://..."
                    />
                    {meta.cover && isExternalLink(meta.cover) && (
                      <img
                        src={meta.cover}
                        alt={meta.coverAlt || 'cover'}
                        className="w-10 h-10 rounded object-cover border border-divider-soft"
                        loading="lazy"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Preview */}
              {isPreview && (
                <div className="border border-divider-soft rounded-xl bg-canvas p-5">
                  <h3 className="font-sans text-[15px] font-semibold text-ink mb-4">Preview</h3>
                  <div className="prose prose-sm max-w-none">
                    {meta.cover && (
                      <img src={meta.cover} alt={meta.coverAlt} className="w-full rounded-lg mb-4" />
                    )}
                    <h2 className="font-display text-section-heading text-ink">{meta.title || 'Untitled'}</h2>
                    {meta.subtitle && (
                      <p className="font-display text-card-heading text-ink-muted">{meta.subtitle}</p>
                    )}
                    {meta.excerpt && <p className="text-body text-body">{meta.excerpt}</p>}
                    <PostRenderer blocks={blocks} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile preview toggle */}
        <div className="lg:hidden mt-6">
          <button
            onClick={() => setIsPreview(!isPreview)}
            className="button-pill-outline w-full flex items-center justify-center gap-2"
          >
            <FileText size={16} />
            {isPreview ? 'Hide Preview' : 'Preview'}
          </button>
        </div>
      </div>

      <PublishModal
        isOpen={showPublish}
        onClose={() => setShowPublish(false)}
        onPublish={handlePublishConfirm}
        post={{ title: meta.title, subtitle: meta.subtitle, excerpt: meta.excerpt, tags: meta.tags.split(',').map((t) => t.trim()).filter(Boolean), cover: meta.cover, topic: meta.topic, allowResponses: true }}
        loading={createMut.isPending || updateMut.isPending || publishMut.isPending}
      />
    </div>
  )
}
