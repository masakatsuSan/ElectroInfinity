import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMyStories, deletePost, archivePost, unpublishPost } from '../../api/posts'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { PenLine, Trash2, Eye, Archive, Send, FileText, Heart, MessageSquare, Bookmark } from 'lucide-react'
import { SkeletonCard } from '../../components/Skeleton'

const TABS = [
  { value: 'draft', label: 'Drafts' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
]

export default function BlogMe() {
  const [tab, setTab] = useState('draft')
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { isAdmin } = useAuth()
  const qc = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['my-stories', tab],
    queryFn: () => getMyStories({ status: tab }).then((r) => r.data),
  })

  const posts = data?.data || []

  const deleteMut = useMutation({
    mutationFn: (id) => deletePost(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-stories'] })
      qc.invalidateQueries({ queryKey: ['admin-posts'] })
      showToast('Post deleted')
    },
    onError: (err) => showToast(err.response?.data?.error || 'Delete failed', 'error'),
  })

  const archiveMut = useMutation({
    mutationFn: (id) => archivePost(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-stories'] })
      qc.invalidateQueries({ queryKey: ['admin-posts'] })
      showToast('Post archived')
    },
    onError: (err) => showToast(err.response?.data?.error || 'Archive failed', 'error'),
  })

  const unpublishMut = useMutation({
    mutationFn: (id) => unpublishPost(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-stories'] })
      qc.invalidateQueries({ queryKey: ['admin-posts'] })
      showToast('Post unpublished')
    },
    onError: (err) => showToast(err.response?.data?.error || 'Unpublish failed', 'error'),
  })

  const handleDelete = (id) => {
    if (window.confirm('Delete this post? This cannot be undone.')) {
      deleteMut.mutate(id)
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen pb-24 bg-canvas pt-24">
        <div className="max-w-[700px] mx-auto px-6 md:px-12 text-center">
          <p className="font-sans text-[14px] text-muted">You don't have access to this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 bg-canvas pt-24">
      <div className="max-w-[900px] mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-normal text-display-lg text-ink mb-2">Your Stories</h1>
            <p className="font-sans text-[14px] text-body">Manage your drafts, published posts, and archived stories.</p>
          </div>
          <Link
            to="/admin/posts/new"
            className="button-primary !py-2 !px-4 text-[13px] flex items-center gap-2"
          >
            <PenLine size={14} />
            Write
          </Link>
        </div>

        <div className="flex gap-2 mb-8 border-b border-hairline">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`font-sans text-[13px] font-medium px-4 py-2 border-b-2 transition-colors ${
                tab === t.value
                  ? 'border-primary text-primary'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <p className="font-sans text-[14px] text-muted">Could not load stories. Try again later.</p>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={32} className="text-ink-muted mx-auto mb-4" />
            <p className="font-sans text-[14px] text-muted mb-4">
              {tab === 'draft' ? 'No drafts yet.' : tab === 'published' ? 'No published posts yet.' : 'No archived posts yet.'}
            </p>
            <Link to="/admin/posts/new" className="button-primary">
              <PenLine size={16} />
              Write your first story
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post._id}
                className="border border-divider-soft rounded-xl bg-canvas p-5 hover:shadow-card transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {(post.tags || []).slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="font-sans text-[10px] font-medium uppercase tracking-[0.16px] px-2 py-0.5 rounded-full bg-surface-soft text-ink border border-hairline"
                        >
                          {t}
                        </span>
                      ))}
                      {post.topic && (
                        <span className="font-sans text-[10px] font-medium uppercase tracking-[0.16px] px-2 py-0.5 rounded-full bg-surface-soft text-ink border border-hairline capitalize">
                          {post.topic}
                        </span>
                      )}
                    </div>
                    <Link
                      to={`/admin/posts/${post._id}/edit`}
                      className="font-display text-card-heading text-ink hover:text-link transition-colors line-clamp-1"
                    >
                      {post.title || 'Untitled'}
                    </Link>
                    {post.subtitle && (
                      <p className="font-sans text-[13px] text-ink-muted mt-1 line-clamp-1">{post.subtitle}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 mt-3">
                      <span className="font-sans text-[12px] text-muted">
                        {post.updatedAt
                          ? new Date(post.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {post.readTime ? (
                        <span className="font-sans text-[12px] text-muted">{post.readTime} min read</span>
                      ) : null}
                      <span className="font-sans text-[12px] text-muted flex items-center gap-1">
                        <Eye size={12} />
                        {post.viewCount || 0}
                      </span>
                      <span className="font-sans text-[12px] text-muted flex items-center gap-1">
                        <Heart size={12} />
                        {post.clapCount || 0}
                      </span>
                      <span className="font-sans text-[12px] text-muted flex items-center gap-1">
                        <MessageSquare size={12} />
                        {post.commentCount || 0}
                      </span>
                      <span className="font-sans text-[12px] text-muted flex items-center gap-1">
                        <Bookmark size={12} />
                        {post.bookmarkCount || 0}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {post.status === 'published' && (
                      <Link
                        to={`/blog/${post.slug}`}
                        className="p-2 rounded-md text-ink-muted hover:text-ink hover:bg-surface-soft transition-colors"
                        title="View"
                      >
                        <Eye size={16} />
                      </Link>
                    )}
                    <Link
                      to={`/admin/posts/${post._id}/edit`}
                      className="p-2 rounded-md text-ink-muted hover:text-ink hover:bg-surface-soft transition-colors"
                      title="Edit"
                    >
                      <PenLine size={16} />
                    </Link>
                    {post.status === 'published' && (
                      <button
                        onClick={() => unpublishMut.mutate(post._id)}
                        disabled={unpublishMut.isPending}
                        className="p-2 rounded-md text-ink-muted hover:text-ink hover:bg-surface-soft transition-colors"
                        title="Unpublish"
                      >
                        <Send size={16} />
                      </button>
                    )}
                    {post.status !== 'archived' && (
                      <button
                        onClick={() => archiveMut.mutate(post._id)}
                        disabled={archiveMut.isPending}
                        className="p-2 rounded-md text-ink-muted hover:text-ink hover:bg-surface-soft transition-colors"
                        title="Archive"
                      >
                        <Archive size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(post._id)}
                      disabled={deleteMut.isPending}
                      className="p-2 rounded-md text-ink-muted hover:text-error hover:bg-surface-soft transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
