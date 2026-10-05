import React, { useState, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPublishedPosts } from '../../api/posts'
import { Skeleton, SkeletonCard } from '../../components/Skeleton'
import BlogCard, { BlogToolbar } from '../../components/blog/BlogCard'
import { useAuth } from '../../context/AuthContext'
import { PenLine } from 'lucide-react'

export default function BlogList() {
  const { isAdmin } = useAuth()
  const [params, setParams] = useSearchParams()
  const page = parseInt(params.get('page') || '1')
  const tag = params.get('tag') || ''
  const search = params.get('q') || ''

  const { data, isLoading, error } = useQuery({
    queryKey: ['posts', 'published', { page, tag, search }],
    queryFn: () => getPublishedPosts({ page, tag, search }).then((r) => r.data),
    keepPreviousData: true,
  })

  const posts = data?.data || []
  const totalPages = data?.totalPages || 1
  const total = data?.total || 0

  const allTags = useMemo(() => {
    const tagSet = new Set()
    posts.forEach((p) => (p.tags || []).forEach((t) => tagSet.add(t)))
    return Array.from(tagSet).sort()
  }, [posts])

  const handleTag = (t) => {
    const newParams = new URLSearchParams(window.location.search)
    if (t) newParams.set('tag', t)
    else newParams.delete('tag')
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
            {search || tag ? (
              <button onClick={clearFilters} className="button-secondary">
                Clear filters
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
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
