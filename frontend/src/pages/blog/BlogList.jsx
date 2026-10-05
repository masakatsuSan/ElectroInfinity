import React, { useState, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPublishedPosts } from '../../api/posts'
import { Skeleton, SkeletonCard } from '../../components/Skeleton'
import BlogCard, { BlogToolbar } from '../../components/blog/BlogCard'
import { useAuth } from '../../context/AuthContext'
import { PenLine, Search } from 'lucide-react'

export default function BlogList() {
  const { isAdmin } = useAuth()
  const [params, setParams] = useSearchParams()
  const page = parseInt(params.get('page') || '1')
  const tag = params.get('tag') || ''
  const topic = params.get('topic') || ''
  const search = params.get('q') || ''

  const { data, isLoading, error } = useQuery({
    queryKey: ['posts', 'published', { page, tag, topic, search }],
    queryFn: () => getPublishedPosts({ page, tag, topic, search }).then((r) => r.data),
    keepPreviousData: true,
  })

  const posts = data?.data || []
  const totalPages = data?.totalPages || 1
  const total = data?.total || 0

  const featured = useMemo(() => {
    if (!posts.length) return null
    return posts.reduce((a, b) => ((b.clapCount || 0) > (a.clapCount || 0) ? b : a), posts[0])
  }, [posts])

  const allTags = useMemo(() => {
    const tagSet = new Set()
    posts.forEach((p) => (p.tags || []).forEach((t) => tagSet.add(t)))
    return Array.from(tagSet).sort()
  }, [posts])

  const allTopics = useMemo(() => {
    const topicSet = new Set()
    posts.forEach((p) => {
      if (p.topic) topicSet.add(p.topic)
    })
    return Array.from(topicSet).sort()
  }, [posts])

  const handleTag = (t) => {
    const newParams = new URLSearchParams(window.location.search)
    if (t) newParams.set('tag', t)
    else newParams.delete('tag')
    newParams.set('page', '1')
    setParams(newParams)
  }

  const handleTopic = (t) => {
    const newParams = new URLSearchParams(window.location.search)
    if (t) newParams.set('topic', t)
    else newParams.delete('topic')
    newParams.set('page', '1')
    setParams(newParams)
  }

  const handleSearch = (e) => {
    const newParams = new URLSearchParams(window.location.search)
    const q = e.target.value
    if (q.trim()) newParams.set('q', q.trim())
    else newParams.delete('q')
    newParams.set('page', '1')
    setParams(newParams)
  }

  const clearFilters = () => {
    setParams({})
  }

  const goToPage = (p) => {
    const newParams = new URLSearchParams(window.location.search)
    newParams.set('page', String(p))
    setParams(newParams)
  }

  const restPosts = featured ? posts.filter((p) => p._id !== featured._id) : posts

  return (
    <div className="min-h-screen pb-24 bg-canvas pt-24">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        <div className="max-w-2xl mb-12">
          <span className="font-sans text-[13px] font-medium text-signature-coral uppercase tracking-[0.16px] mb-3 block">
            From the Blog
          </span>
          <h1 className="font-display font-normal text-display-lg text-ink mb-4 tracking-[0]">
            College Connect Blog
          </h1>
          <p className="font-sans text-[14px] text-body leading-[1.25] max-w-xl">
            Stories, tutorials, and updates from the electrical engineering department.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-md w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="Search posts..."
              className="text-input w-full pl-10"
            />
          </div>
          {isAdmin && (
            <Link
              to="/admin/posts/new"
              className="button-primary !py-2 !px-4 text-[13px] flex items-center gap-2"
            >
              <PenLine size={14} />
              Write
            </Link>
          )}
        </div>

        {allTags.length > 0 && (
          <BlogToolbar
            tags={allTags}
            selectedTag={tag}
            search={search}
            onTag={handleTag}
            onSearch={handleSearch}
            onClearTag={clearFilters}
          />
        )}

        {allTopics.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => handleTopic('')}
              className={`font-sans text-[13px] font-medium px-3 py-1.5 rounded-full border transition-colors ${
                !topic
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-canvas text-ink border-hairline hover:bg-surface-soft'
              }`}
            >
              All topics
            </button>
            {allTopics.map((t) => (
              <button
                key={t}
                onClick={() => handleTopic(t)}
                className={`font-sans text-[13px] font-medium px-3 py-1.5 rounded-full border transition-colors capitalize ${
                  topic === t
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-canvas text-ink border-hairline hover:bg-surface-soft'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <p className="font-sans text-[14px] text-muted">Could not load posts. Try again later.</p>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-sans text-[14px] text-muted mb-4">No posts found.</p>
            {search || tag || topic ? (
              <button onClick={clearFilters} className="button-secondary">
                Clear filters
              </button>
            ) : null}
          </div>
        ) : (
          <>
            {featured && (
              <div className="mb-12">
                <span className="font-sans text-[11px] font-medium uppercase tracking-[0.16px] text-signature-coral mb-3 block">
                  Featured
                </span>
                <Link
                  to={`/blog/${featured.slug}`}
                  className="group block bg-canvas border border-hairline rounded-lg shadow-card hover:shadow-card-hover transition-shadow duration-200 overflow-hidden"
                >
                  {featured.cover ? (
                    <div className="aspect-[16/9] overflow-hidden bg-surface-soft">
                      <img src={featured.cover} alt={featured.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" loading="lazy" />
                    </div>
                  ) : (
                    <div className="aspect-[16/9] bg-surface-soft flex items-center justify-center">
                      <span className="font-mono text-[20px] font-medium text-muted">
                        {(featured.author?.name || 'S').split(' ').map((n) => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {(featured.tags || []).slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="font-sans text-[11px] font-medium uppercase tracking-[0.16px] px-2.5 py-1 rounded-full bg-surface-soft text-ink border border-hairline"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <h3 className="font-display text-display-md text-ink mb-2 leading-[1.3] group-hover:text-link transition-colors">
                      {featured.title}
                    </h3>
                    {featured.excerpt && (
                      <p className="font-sans text-[14px] text-body leading-[1.25] mb-4 line-clamp-3">
                        {featured.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-soft flex-shrink-0 flex items-center justify-center">
                        {featured.author?.photo ? (
                          <img src={featured.author.photo} alt={featured.author?.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-sans text-[10px] font-medium text-muted">
                            {(featured.author?.name || 'S').split(' ').map((n) => n[0]).join('').toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-sans text-[13px] font-medium text-ink">{featured.author?.name || 'Unknown'}</p>
                        <p className="font-sans text-[12px] text-muted">
                          {featured.publishedAt
                            ? new Date(featured.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : new Date(featured.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {featured.readTime ? ` · ${featured.readTime} min read` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {restPosts.map((post) => (
                <BlogCard key={post._id} post={post} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-12 pt-8 border-t border-hairline">
                <p className="font-sans text-[13px] text-muted">
                  Page {page} of {totalPages} · {total} posts
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1}
                    className="button-secondary !px-4 !py-2 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages}
                    className="button-secondary !px-4 !py-2 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {isAdmin && (
          <Link
            to="/admin/posts/new"
            className="fixed bottom-6 right-6 z-50 flex items-center justify-center bg-primary text-on-primary rounded-full w-14 h-14 shadow-lg hover:bg-primary-active transition-colors"
            title="New post"
          >
            <PenLine size={22} />
          </Link>
        )}
      </div>
    </div>
  )
}
