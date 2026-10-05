import { Link } from 'react-router-dom'
import { Search, Filter } from 'lucide-react'

export default function BlogCard({ post }) {
  const authorName = post.author?.name || 'Unknown'
  const authorPhoto = post.author?.photo
  const initials = authorName
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'S'

  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group block bg-canvas border border-hairline rounded-lg shadow-card hover:shadow-card-hover transition-shadow duration-200 overflow-hidden"
    >
      {post.cover ? (
        <div className="aspect-[16/9] overflow-hidden bg-surface-soft">
          <img src={post.cover} alt={post.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" loading="lazy" />
        </div>
      ) : (
        <div className="aspect-[16/9] bg-surface-soft flex items-center justify-center">
          <span className="font-mono text-[20px] font-medium text-muted">{initials}</span>
        </div>
      )}
      <div className="p-6">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {(post.tags || []).slice(0, 3).map((t) => (
            <span
              key={t}
              className="font-sans text-[11px] font-medium uppercase tracking-[0.16px] px-2.5 py-1 rounded-full bg-surface-soft text-ink border border-hairline"
            >
              {t}
            </span>
          ))}
        </div>
        <h3 className="font-display text-card-heading text-ink mb-2 leading-[1.3] line-clamp-2 group-hover:text-link transition-colors">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="font-sans text-[14px] text-body leading-[1.25] mb-4 line-clamp-3">
            {post.excerpt}
          </p>
        )}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-soft flex-shrink-0 flex items-center justify-center">
            {authorPhoto ? (
              <img src={authorPhoto} alt={authorName} className="w-full h-full object-cover" />
            ) : (
              <span className="font-sans text-[10px] font-medium text-muted">{initials}</span>
            )}
          </div>
          <div>
            <p className="font-sans text-[13px] font-medium text-ink">{authorName}</p>
            <p className="font-sans text-[12px] text-muted">{date}</p>
          </div>
        </div>
      </div>
    </Link>
  )
}

export function BlogToolbar({ tags = [], selectedTag, search, onTag, onSearch, onClearTag }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
      <div className="relative flex-1 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={search}
          onChange={onSearch}
          placeholder="Search posts by title..."
          className="text-input w-full pl-10"
        />
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onClearTag}
            className={`font-sans text-[13px] font-medium px-3 py-1.5 rounded-full border transition-colors ${
              !selectedTag
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-canvas text-ink border-hairline hover:bg-surface-soft'
            }`}
          >
            All
          </button>
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => onTag(t)}
              className={`font-sans text-[13px] font-medium px-3 py-1.5 rounded-full border transition-colors ${
                selectedTag === t
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-canvas text-ink border-hairline hover:bg-surface-soft'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
