import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import BackButton from '../components/BackButton'
import {
  getPosts, createPost, upvotePost, downvotePost,
  createComment, upvoteComment, getForumRooms
} from '../api/forum'
import {
  Hash, Home, TrendingUp, Plus, ArrowBigUp, ArrowBigDown,
  MessageCircle, Share2, ChevronDown, ChevronRight, X,
  Image, BarChart3, Link2, FileText, Pin, PinOff,
  Search, Filter, MoreHorizontal, Power
} from 'lucide-react'

const POST_TYPES = [
  { key: 'text', label: 'Text', icon: FileText },
  { key: 'image', label: 'Image', icon: Image },
  { key: 'poll', label: 'Poll', icon: BarChart3 },
  { key: 'link', label: 'Link', icon: Link2 },
]

const SORT_OPTIONS = [
  { key: 'latest', label: 'Latest' },
  { key: 'popular', label: 'Popular' },
]

export default function Forum() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [sort, setSort] = useState('latest')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [showCreate, setShowCreate] = useState(false)
  const [createRoom, setCreateRoom] = useState('')
  const [createType, setCreateType] = useState('text')
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    links: '',
    linkUrl: '',
    pollOptions: ['', '']
  })

  const [openComments, setOpenComments] = useState({})
  const [commentDrafts, setCommentDrafts] = useState({})
  const [replyingTo, setReplyingTo] = useState(null)

  useEffect(() => {
    fetchRooms()
  }, [])

  useEffect(() => {
    setPage(1)
    fetchPosts(1)
  }, [selectedRoom, sort])

  const fetchRooms = async () => {
    try {
      const res = await getForumRooms()
      setRooms(res.data.data)
      if (res.data.data.length > 0 && !selectedRoom) {
        setSelectedRoom(res.data.data[0]._id)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchPosts = async (pageNum = 1) => {
    try {
      setLoading(true)
      const params = { sort, page: pageNum, limit: 20 }
      if (selectedRoom) params.room = selectedRoom
      const res = await getPosts(params)
      setPosts(res.data.data)
      setTotalPages(res.data.totalPages || 1)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!createRoom) return

    try {
      const payload = {
        room: createRoom,
        postType: createType,
        title: formData.title.trim() || 'Untitled Discussion',
        content: formData.content.trim(),
        links: formData.links ? formData.links.split(',').map(l => l.trim()).filter(l => l) : []
      }

      if (createType === 'link') {
        payload.linkUrl = formData.linkUrl.trim()
      }
      if (createType === 'poll') {
        payload.pollOptions = formData.pollOptions.filter(o => o.trim()).map(text => ({ text: text.trim(), votes: 0 }))
      }

      await createPost(payload)
      setFormData({ title: '', content: '', links: '', linkUrl: '', pollOptions: ['', ''] })
      setShowCreate(false)
      setCreateType('text')
      fetchPosts(page)
    } catch (err) {
      console.error(err)
    }
  }

  const handleUpvote = async (id) => {
    try {
      const res = await upvotePost(id)
      setPosts(posts.map(p => p._id === id ? { ...p, upvotes: res.data.data } : p))
    } catch (err) {
      console.error(err)
    }
  }

  const handleDownvote = async (id) => {
    try {
      const res = await downvotePost(id)
      setPosts(posts.map(p => p._id === id ? { ...p, downvotes: res.data.data } : p))
    } catch (err) {
      console.error(err)
    }
  }

  const handleCommentSubmit = async (e, postId) => {
    e.preventDefault()
    const draft = commentDrafts[postId]
    if (!draft?.content?.trim()) return

    try {
      await createComment(postId, {
        content: draft.content.trim(),
        parent: replyingTo || null
      })
      setCommentDrafts({ ...commentDrafts, [postId]: '' })
      setReplyingTo(null)
      fetchPosts(page)
    } catch (err) {
      console.error(err)
    }
  }

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now - date) / 1000)
    let interval = seconds / 31536000
    if (interval > 1) return Math.floor(interval) + ' years ago'
    interval = seconds / 2592000
    if (interval > 1) return Math.floor(interval) + ' months ago'
    interval = seconds / 86400
    if (interval > 1) return Math.floor(interval) + ' days ago'
    interval = seconds / 3600
    if (interval > 1) return Math.floor(interval) + ' hours ago'
    interval = seconds / 60
    if (interval > 1) return Math.floor(interval) + ' mins ago'
    return Math.floor(seconds) + ' secs ago'
  }

  const selectedRoomData = rooms.find(r => r._id === selectedRoom)

  const userVote = (post) => {
    if (post.upvotes?.includes(user?._id)) return 'up'
    if (post.downvotes?.includes(user?._id)) return 'down'
    return null
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BackButton />
            <h1 className="font-display font-bold text-[24px] text-ink">Discussion Forum</h1>
          </div>
          {user && (
            <button
              onClick={() => {
                localStorage.removeItem('ei_token')
                localStorage.removeItem('ei_user')
                window.location.href = '/login'
              }}
              className="flex items-center gap-2 px-4 py-2 text-[13px] font-sans font-medium text-error hover:bg-red-50 rounded-full transition-colors"
            >
              <Power size={14} /> Sign Out
            </button>
          )}
        </div>
        <div className="flex gap-6">
          
          {/* Left Sidebar — Rooms */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              <div>
                <h2 className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate mb-3 px-3">Rooms</h2>
                <nav className="space-y-1">
                  <button
                    onClick={() => setSelectedRoom(null)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[14px] font-medium transition-colors ${
                      !selectedRoom ? 'bg-soft-stone text-ink font-semibold' : 'text-body-muted hover:text-ink hover:bg-soft-stone/60'
                    }`}
                  >
                    <Home size={18} strokeWidth={1.75} />
                    All Posts
                  </button>
                  {rooms.map(room => (
                    <button
                      key={room._id}
                      onClick={() => setSelectedRoom(room._id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[14px] font-medium transition-colors ${
                        selectedRoom === room._id ? 'bg-soft-stone text-ink font-semibold' : 'text-body-muted hover:text-ink hover:bg-soft-stone/60'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: room.color }}>
                        {room.icon === 'Hash' ? <Hash size={12} /> : room.icon?.charAt(0)?.toUpperCase() || '#'}
                      </span>
                      <span className="truncate">{room.name}</span>
                      {room.isPopular && (
                        <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-coral">Hot</span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </aside>

          {/* Center Column — Feed */}
          <main className="flex-1 min-w-0 max-w-[680px]">
            
            {/* Mobile Room Selector */}
            <div className="md:hidden mb-4">
              <select
                value={selectedRoom || ''}
                onChange={(e) => setSelectedRoom(e.target.value || null)}
                className="w-full bg-canvas border border-hairline rounded-xl px-4 py-2.5 text-[14px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="">All Rooms</option>
                {rooms.map(room => (
                  <option key={room._id} value={room._id}>{room.name}</option>
                ))}
              </select>
            </div>

            {/* Create Post Bar */}
            <div className="mb-4">
              {!showCreate ? (
                <button
                  onClick={() => setShowCreate(true)}
                  className="w-full bg-canvas border border-hairline rounded-xl p-3 flex items-center gap-3 hover:border-slate/30 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="text-body-muted text-[14px]">Create a post...</span>
                </button>
              ) : (
                <form onSubmit={handleCreate} className="bg-canvas border border-hairline rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-[16px] text-ink">Create Post</h3>
                    <button type="button" onClick={() => setShowCreate(false)} className="p-1 text-body-muted hover:text-ink rounded-lg hover:bg-soft-stone transition-colors">
                      <X size={18} />
                    </button>
                  </div>

                  {/* Room Selector */}
                  <select
                    value={createRoom}
                    onChange={(e) => setCreateRoom(e.target.value)}
                    className="w-full bg-soft-stone border border-hairline rounded-lg px-3 py-2 text-[14px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select a room</option>
                    {rooms.map(room => (
                      <option key={room._id} value={room._id}>{room.name}</option>
                    ))}
                  </select>

                  {/* Post Type Tabs */}
                  <div className="flex gap-1 bg-soft-stone rounded-lg p-1">
                    {POST_TYPES.map(pt => {
                      const Icon = pt.icon
                      return (
                        <button
                          key={pt.key}
                          type="button"
                          onClick={() => setCreateType(pt.key)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                            createType === pt.key ? 'bg-canvas text-ink shadow-sm' : 'text-body-muted hover:text-ink'
                          }`}
                        >
                          <Icon size={14} strokeWidth={1.75} />
                          {pt.label}
                        </button>
                      )
                    })}
                  </div>

                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Title"
                    className="w-full bg-soft-stone border border-hairline rounded-lg px-3 py-2 text-[15px] font-bold text-ink placeholder:text-body-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />

                  {createType === 'text' && (
                    <textarea
                      rows={4}
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="What's on your mind?"
                      className="w-full bg-soft-stone border border-hairline rounded-lg px-3 py-2 text-[14px] text-ink placeholder:text-body-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                    />
                  )}

                  {createType === 'link' && (
                    <input
                      type="url"
                      value={formData.linkUrl}
                      onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                      placeholder="https://example.com"
                      className="w-full bg-soft-stone border border-hairline rounded-lg px-3 py-2 text-[14px] text-ink placeholder:text-body-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  )}

                  {createType === 'poll' && (
                    <div className="space-y-2">
                      {formData.pollOptions.map((opt, i) => (
                        <input
                          key={i}
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...formData.pollOptions]
                            newOpts[i] = e.target.value
                            setFormData({ ...formData, pollOptions: newOpts })
                          }}
                          placeholder={`Option ${i + 1}`}
                          className="w-full bg-soft-stone border border-hairline rounded-lg px-3 py-2 text-[14px] text-ink placeholder:text-body-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      ))}
                      {formData.pollOptions.length < 6 && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, pollOptions: [...formData.pollOptions, ''] })}
                          className="text-[13px] font-medium text-primary hover:underline"
                        >
                          + Add option
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-[14px] font-medium text-body-muted hover:text-ink transition-colors">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!createRoom || !formData.title.trim()}
                      className="px-5 py-2 bg-primary text-white rounded-full text-[14px] font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Post
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Sort Bar */}
            <div className="flex items-center justify-between mb-4">
              <h1 className="font-display font-bold text-[20px] text-ink">
                {selectedRoomData ? selectedRoomData.name : 'All Posts'}
              </h1>
              <div className="flex items-center gap-1 bg-soft-stone rounded-lg p-0.5">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setSort(opt.key)}
                    className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                      sort === opt.key ? 'bg-canvas text-ink shadow-sm' : 'text-body-muted hover:text-ink'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Posts Feed */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20 bg-canvas border border-hairline rounded-xl">
                <div className="inline-flex w-12 h-12 bg-soft-stone rounded-full items-center justify-center mb-3">
                  <MessageCircle size={24} className="text-body-muted" />
                </div>
                <p className="text-body-muted text-[14px]">No posts yet. Start the conversation!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map(post => (
                  <PostCard
                    key={post._id}
                    post={post}
                    user={user}
                    userVote={userVote(post)}
                    onUpvote={handleUpvote}
                    onDownvote={handleDownvote}
                    onToggleComments={() => setOpenComments({ ...openComments, [post._id]: !openComments[post._id] })}
                    openComments={openComments[post._id]}
                    commentDrafts={commentDrafts}
                    setCommentDrafts={setCommentDrafts}
                    onCommentSubmit={handleCommentSubmit}
                    replyingTo={replyingTo}
                    setReplyingTo={setReplyingTo}
                    formatTimeAgo={formatTimeAgo}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => { setPage(p => p - 1); fetchPosts(page - 1) }}
                  disabled={page === 1}
                  className="px-4 py-2 bg-canvas border border-hairline rounded-lg text-[13px] font-medium text-ink hover:bg-soft-stone transition-colors disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-[13px] text-body-muted">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => { setPage(p => p + 1); fetchPosts(page + 1) }}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-canvas border border-hairline rounded-lg text-[13px] font-medium text-ink hover:bg-soft-stone transition-colors disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </main>

          {/* Right Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              {selectedRoomData && (
                <div className="bg-canvas border border-hairline rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: selectedRoomData.color }}>
                      {selectedRoomData.icon === 'Hash' ? <Hash size={16} /> : selectedRoomData.icon?.charAt(0)?.toUpperCase() || '#'}
                    </span>
                    <div>
                      <h3 className="font-display font-bold text-[16px] text-ink">{selectedRoomData.name}</h3>
                      <p className="text-[12px] text-body-muted">{selectedRoomData.postCount || 0} posts</p>
                    </div>
                  </div>
                  <p className="text-[13px] text-body-muted leading-relaxed">
                    {selectedRoomData.description || 'No description'}
                  </p>
                </div>
              )}

              <div className="bg-canvas border border-hairline rounded-xl p-5">
                <h3 className="font-display font-bold text-[16px] text-ink mb-3">Community Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-body-muted">Total Rooms</span>
                    <span className="font-bold text-ink">{rooms.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-body-muted">Total Posts</span>
                    <span className="font-bold text-ink">{posts.length > 0 ? '—' : '0'}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-hairline">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[13px] font-medium text-body-muted">Community active</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function PostCard({
  post, user, userVote, onUpvote, onDownvote,
  onToggleComments, openComments, commentDrafts, setCommentDrafts,
  onCommentSubmit, replyingTo, setReplyingTo, formatTimeAgo
}) {
  const [localDraft, setLocalDraft] = useState('')
  const [replyDraft, setReplyDraft] = useState('')

  const handleCommentDraft = (postId, value) => {
    setCommentDrafts({ ...commentDrafts, [postId]: value })
  }

  const handleReplyDraft = (value) => {
    setReplyDraft(value)
  }

  const handleLocalSubmit = (e) => {
    e.preventDefault()
    onCommentSubmit(e, post._id)
    setLocalDraft('')
  }

  const handleReplySubmit = (e, parentId) => {
    e.preventDefault()
    onCommentSubmit(e, post._id)
    setReplyDraft('')
    setReplyingTo(null)
  }

  const topLevelComments = post.comments?.filter(c => !c.parent) || []
  const replyMap = useMemo(() => {
    const map = {}
    post.comments?.forEach(c => {
      if (c.parent) {
        if (!map[c.parent]) map[c.parent] = []
        map[c.parent].push(c)
      }
    })
    return map
  }, [post.comments])

  return (
    <div className="bg-canvas border border-hairline rounded-xl p-4 hover:border-slate/30 transition-colors">
      {/* Author & Meta */}
      <div className="flex items-center gap-2 mb-2 text-[13px] text-body-muted">
        <div className="w-6 h-6 rounded-full bg-soft-stone flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
          {post.author?.name?.charAt(0)?.toUpperCase()}
        </div>
        <span className="font-bold text-ink hover:underline cursor-pointer">
          {post.author?.name}
        </span>
        <span className="text-slate">·</span>
        <span>{formatTimeAgo(post.createdAt)}</span>
        {post.isPinned && (
          <span className="flex items-center gap-1 text-[11px] font-bold text-coral uppercase tracking-wide">
            <Pin size={12} /> Pinned
          </span>
        )}
      </div>

      {/* Post Type Badge */}
      {post.postType && post.postType !== 'text' && (
        <div className="flex items-center gap-1.5 mb-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-body-muted bg-soft-stone px-2 py-0.5 rounded-md">
            {post.postType === 'image' && <Image size={12} />}
            {post.postType === 'poll' && <BarChart3 size={12} />}
            {post.postType === 'link' && <Link2 size={12} />}
            {post.postType}
          </span>
          {post.room && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-body-muted bg-soft-stone px-2 py-0.5 rounded-md">
              <Hash size={12} />
              {post.room.name}
            </span>
          )}
        </div>
      )}

      {/* Post Body */}
      <h2 className="text-[16px] font-bold text-ink mb-1 leading-snug">
        {post.title}
      </h2>
      <div className="text-[14px] text-body-muted leading-relaxed mb-3 whitespace-pre-wrap break-words">
        {post.content}
      </div>

      {/* Link Preview */}
      {post.postType === 'link' && post.linkUrl && (
        <a
          href={post.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[13px] font-medium text-primary hover:underline mb-3"
          onClick={(e) => e.stopPropagation()}
        >
          <Link2 size={14} />
          {post.linkUrl}
        </a>
      )}

      {/* Poll */}
      {post.postType === 'poll' && post.pollOptions?.length > 0 && (
        <div className="space-y-2 mb-3">
          {post.pollOptions.map((opt, i) => (
            <button
              key={i}
              onClick={async () => {
                try {
                  await createComment(post._id, {
                    content: `poll:${i}`,
                    parent: null
                  })
                  fetchPosts(page)
                } catch (err) {
                  console.error(err)
                }
              }}
              className="w-full text-left bg-soft-stone border border-hairline rounded-lg px-3 py-2 text-[14px] text-ink hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span>{opt.text}</span>
                <span className="text-[12px] font-bold text-body-muted">{opt.votes || 0} votes</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center gap-1">
        {/* Vote Pill */}
        <div className="flex items-center bg-soft-stone rounded-full overflow-hidden border border-hairline">
          <button
            onClick={() => onUpvote(post._id)}
            className={`p-1.5 px-2 transition-colors ${userVote === 'up' ? 'text-orange-500 bg-orange-500/10' : 'text-body-muted hover:text-orange-500'}`}
            aria-label="Upvote"
          >
            <ArrowBigUp size={18} strokeWidth={1.75} />
          </button>
          <span className={`px-1 text-[13px] font-bold min-w-[24px] text-center ${userVote ? 'text-ink' : 'text-body-muted'}`}>
            {(post.upvotes?.length || 0) - (post.downvotes?.length || 0)}
          </span>
          <button
            onClick={() => onDownvote(post._id)}
            className={`p-1.5 px-2 transition-colors ${userVote === 'down' ? 'text-blue-500 bg-blue-500/10' : 'text-body-muted hover:text-blue-500'}`}
            aria-label="Downvote"
          >
            <ArrowBigDown size={18} strokeWidth={1.75} />
          </button>
        </div>

        {/* Comments */}
        <button
          onClick={onToggleComments}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors border border-hairline ${
            openComments ? 'bg-soft-stone text-ink' : 'text-body-muted hover:text-ink hover:bg-soft-stone/60'
          }`}
        >
          <MessageCircle size={16} strokeWidth={1.75} />
          {post.comments?.length || 0}
        </button>

        {/* Share */}
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium text-body-muted hover:text-ink hover:bg-soft-stone/60 transition-colors border border-hairline"
          aria-label="Share"
        >
          <Share2 size={16} strokeWidth={1.75} />
          Share
        </button>
      </div>

      {/* Comments Section */}
      {openComments && (
        <div className="mt-4 pt-4 border-t border-hairline space-y-4">
          {/* Comment Input */}
          <form onSubmit={(e) => handleLocalSubmit(e)} className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={localDraft}
                onChange={(e) => { setLocalDraft(e.target.value); handleCommentDraft(post._id, e.target.value) }}
                placeholder="Add a comment..."
                className="flex-1 bg-soft-stone border border-hairline rounded-lg px-3 py-2 text-[14px] text-ink placeholder:text-body-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={!localDraft.trim()}
                className="px-4 py-2 bg-primary text-white rounded-lg text-[13px] font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Comment
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-4 pl-2">
            {topLevelComments.length === 0 && (
              <p className="text-[13px] text-body-muted italic">No comments yet.</p>
            )}
            {topLevelComments.map(comment => (
              <div key={comment._id} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-soft-stone flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                  {comment.author?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-[13px] text-ink">{comment.author?.name}</span>
                    <span className="text-[11px] text-body-muted">{formatTimeAgo(comment.createdAt)}</span>
                  </div>
                  <p className="text-[14px] text-body-muted break-words">{comment.content}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <button
                      onClick={() => onUpvote(comment._id)}
                      className="flex items-center gap-1 text-[12px] text-body-muted hover:text-orange-500 transition-colors"
                    >
                      <ArrowBigUp size={14} strokeWidth={1.75} />
                      {comment.upvotes?.length || 0}
                    </button>
                    <button
                      onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                      className="text-[12px] font-medium text-body-muted hover:text-ink transition-colors"
                    >
                      Reply
                    </button>
                  </div>

                  {/* Reply Input */}
                  {replyingTo === comment._id && (
                    <form onSubmit={(e) => handleReplySubmit(e, comment._id)} className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={replyDraft}
                        onChange={(e) => handleReplyDraft(e.target.value)}
                        placeholder="Reply..."
                        className="flex-1 bg-soft-stone border border-hairline rounded-lg px-3 py-1.5 text-[13px] text-ink placeholder:text-body-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={!replyDraft.trim()}
                        className="px-3 py-1.5 bg-primary text-white rounded-lg text-[12px] font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        Reply
                      </button>
                    </form>
                  )}

                  {/* Nested Replies */}
                  {replyMap[comment._id]?.length > 0 && (
                    <div className="mt-3 pl-4 border-l-2 border-hairline space-y-3">
                      {replyMap[comment._id].map(reply => (
                        <div key={reply._id} className="flex gap-2">
                          <div className="w-6 h-6 rounded-full bg-soft-stone flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                            {reply.author?.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-semibold text-[12px] text-ink">{reply.author?.name}</span>
                              <span className="text-[10px] text-body-muted">{formatTimeAgo(reply.createdAt)}</span>
                            </div>
                            <p className="text-[13px] text-body-muted break-words">{reply.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
