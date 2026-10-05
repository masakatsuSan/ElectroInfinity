import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { adminGetAllPosts, deletePost, publishPost, unpublishPost } from '../../api/posts'
import { useToast } from '../../context/ToastContext'
import { Edit2, Trash2, Eye, EyeOff, Plus } from 'lucide-react'

const TABS = [
  { value: 'all', label: 'All Posts' },
  { value: 'draft', label: 'Drafts' },
  { value: 'published', label: 'Published' },
]

export default function AdminPosts() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { showToast } = useToast()
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-posts', tab, search],
    queryFn: () =>
      adminGetAllPosts({ status: tab === 'all' ? undefined : tab, search: search || undefined }).then(
        (r) => r.data,
      ),
  })

  const posts = data?.data || []

  const deleteMut = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-posts'] })
      showToast('Post deleted')
    },
    onError: (err) => showToast(err.response?.data?.error || 'Delete failed', 'error'),
  })

  const publishMut = useMutation({
    mutationFn: publishPost,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-posts'] })
      showToast('Post published')
    },
    onError: (err) => showToast(err.response?.data?.error || 'Publish failed', 'error'),
  })

  const unpublishMut = useMutation({
    mutationFn: unpublishPost,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-posts'] })
      showToast('Post unpublished')
    },
    onError: (err) => showToast(err.response?.data?.error || 'Unpublish failed', 'error'),
  })

  const handleDelete = (post) => {
    if (window.confirm(`Delete "${post.title}"? This cannot be undone.`)) {
      deleteMut.mutate(post._id)
    }
  }

  const handleTogglePublish = (post) => {
    if (post.status === 'published') {
      unpublishMut.mutate(post._id)
    } else {
      publishMut.mutate(post._id)
    }
  }

  const filtered = posts.filter((p) => {
    if (tab === 'draft') return p.status !== 'published'
    if (tab === 'published') return p.status === 'published'
    return true
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="font-[Inter,system-ui,sans-serif] font-semibold text-[28px] tracking-tight text-ink">
          Blog Posts
        </h1>
        <Link
          to="/admin/posts/new"
          className="button-primary !px-5 !py-2.5 flex items-center gap-2"
        >
          <Plus size={16} />
          New Post
        </Link>
      </div>

      <div className="flex gap-1 mb-6 bg-surface-soft rounded-lg p-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-2 text-[14px] font-medium rounded-md transition-all whitespace-nowrap ${
              tab === t.value
                ? 'bg-canvas text-ink shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search posts by title..."
          className="text-input w-full max-w-md"
        />
      </div>

      {isLoading ? (
        <p className="font-[Inter,system-ui,sans-serif] text-ink-muted-80 text-[15px]">Loading posts…</p>
      ) : error ? (
        <p className="font-[Inter,system-ui,sans-serif] text-red-500 text-[14px]">Failed to load posts</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-[Inter,system-ui,sans-serif] text-ink-muted-80 text-[15px] mb-4">
            No posts in this category yet.
          </p>
          <Link to="/admin/posts/new" className="button-secondary">
            Create your first post
          </Link>
        </div>
      ) : (
        <div className="border border-divider_soft bg-canvas rounded-xl overflow-hidden shadow-sm">
          {filtered.map((post) => (
            <PostRow
              key={post._id}
              post={post}
              onTogglePublish={() => handleTogglePublish(post)}
              onDelete={() => handleDelete(post)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PostRow({ post, onTogglePublish, onDelete }) {
  const isPublished = post.status === 'published'
  const date = post.publishedAt || post.createdAt
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="flex items-center gap-4 px-4 sm:px-6 py-3 sm:py-4 border-b border-divider_soft last:border-b-0 hover:bg-[#fff]-parchment transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[15px] font-medium text-ink truncate">{post.title}</p>
          {isPublished ? (
            <span className="font-mono text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-deep-green/10 text-deep-green border border-deep-green/20 flex-shrink-0">
              Published
            </span>
          ) : (
            <span className="font-mono text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200 flex-shrink-0">
            </span>
          )}
        </div>
        <p className="font-[Inter,system-ui,sans-serif] text-[13px] text-ink-muted-80 mt-1 line-clamp-1">
          {post.excerpt || 'No excerpt'}
        </p>
        <p className="font-[Inter,system-ui,sans-serif] text-[12px] text-slate mt-1.5">
          {formattedDate} · {(post.blocks || []).length} blocks
        </p>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={onTogglePublish}
          title={isPublished ? 'Unpublish' : 'Publish'}
          className={`p-1.5 rounded-md transition-colors ${
            isPublished
              ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
              : 'text-deep-green hover:text-deep-green/80 hover:bg-deep-green/10'
          }`}
        >
          {isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
        <Link
          to={`/admin/posts/${post._id}/edit`}
          className="p-1.5 rounded-md text-ink-muted-80 hover:text-primary hover:bg-primary/10 transition-colors"
          title="Edit"
        >
          <Edit2 size={16} />
        </Link>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-md text-ink-muted-80 hover:text-red-500 hover:bg-red-500/10 transition-colors"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}
