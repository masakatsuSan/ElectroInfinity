import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPublishedPost } from '../../api/posts'
import PostRenderer from '../../components/blog/PostRenderer'
import { formatReadingTime } from '../../utils/readingTime'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Share2, Calendar, Edit, Pencil } from 'lucide-react'
import { ArrowLeft } from 'lucide-react'

export default function BlogPost() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const { showToast } = useToast()

  const { data, isLoading, error } = useQuery({
    queryKey: ['post', slug],
    queryFn: () => getPublishedPost(slug).then((r) => r.data),
    enabled: !!slug,
  })

  const post = data?.data

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, text: post.excerpt || '', url })
        showToast('Shared!')
      } catch {
        await navigator.clipboard.writeText(url)
        showToast('Link copied!')
      }
    } else {
      await navigator.clipboard.writeText(url)
      showToast('Link copied!')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24 bg-canvas pt-24">
        <div className="max-w-[700px] mx-auto px-6 md:px-12">
          <div className="skeleton-shimmer h-10 w-3/4 bg-surface-soft rounded-sm mb-6" />
          <div className="skeleton-shimmer h-5 w-1/2 bg-surface-soft rounded-sm mb-2" />
          <div className="skeleton-shimmer h-4 w-1/3 bg-surface-soft rounded-sm mb-8" />
          <div className="skeleton-shimmer h-6 w-full bg-surface-soft rounded-sm mb-4" />
          <div className="skeleton-shimmer h-6 w-full bg-surface-soft rounded-sm mb-4" />
          <div className="skeleton-shimmer h-6 w-3/4 bg-surface-soft rounded-sm mb-4" />
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen pb-24 bg-canvas pt-24">
        <div className="max-w-[700px] mx-auto px-6 md:px-12 text-center">
          <p className="font-sans text-[14px] text-muted mb-6">Post not found or not published.</p>
          <Link to="/blog" className="button-secondary">
            ← Back to Blog
          </Link>
        </div>
      </div>
    )
  }

  const authorName = post.author?.name || 'Unknown'
  const date = post.publishedAt
    ? new Date(post.publishedAt)
    : new Date(post.createdAt)
  const formattedDate = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const readingTime = formatReadingTime(post.blocks)

  return (
    <div className="min-h-screen pb-24 bg-canvas pt-24">
      <article className="max-w-[700px] mx-auto px-6 md:px-12">
        <Link to="/blog" className="inline-flex items-center gap-2 text-link hover:text-link-active font-sans text-[13px] mb-8">
          <ArrowLeft size={14} />
          Back to Blog
        </Link>

        <header className="mb-10">
          {post.cover && (
            <img
              src={post.cover}
              alt={post.title}
              className="w-full h-auto rounded-lg border border-hairline mb-6"
              loading="eager"
            />
          )}
          <h1 className="font-display font-normal text-display-md text-ink mb-4 leading-[1.2] tracking-[0]">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-caption text-muted">
              <Calendar size={14} />
              <span>{formattedDate}</span>
            </div>
            <span className="font-sans text-[13px] text-muted">·</span>
            <span className="font-sans text-[13px] text-muted">{readingTime}</span>
            {post.tags && post.tags.length > 0 && (
              <>
                <span className="font-sans text-[13px] text-muted">·</span>
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.map((t) => (
                    <span
                      key={t}
                      className="font-sans text-[11px] font-medium uppercase tracking-[0.16px] px-2.5 py-1 rounded-full bg-surface-soft text-ink border border-hairline"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </header>

        <div className="mb-12">
          <PostRenderer blocks={post.blocks} />
        </div>

        <footer className="border-t border-hairline pt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-soft flex-shrink-0 flex items-center justify-center">
                {post.author?.photo ? (
                  <img src={post.author.photo} alt={authorName} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-sans text-[10px] font-medium text-muted">
                    {authorName.split(' ').map((n) => n[0]).join('').toUpperCase() || 'S'}
                  </span>
                )}
              </div>
              <div>
                <p className="font-sans text-[14px] font-medium text-ink">{authorName}</p>
                <p className="font-sans text-[12px] text-muted">Author</p>
              </div>
            </div>

            <button
              onClick={handleShare}
              className="flex items-center gap-2 font-sans text-[13px] font-medium text-ink hover:text-link transition-colors"
            >
              <Share2 size={16} />
              Share
            </button>
          </div>
        </footer>

        {isAdmin && (
          <div className="mt-8 flex gap-3">
            <Link to={`/admin/posts/${post._id}/edit`} className="button-secondary">
              <Edit size={16} />
              Edit post
            </Link>
          </div>
        )}
      </article>
    </div>
  )
}
