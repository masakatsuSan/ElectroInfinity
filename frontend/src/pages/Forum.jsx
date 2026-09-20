import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
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
import { SkeletonPost } from '../components/Skeleton'
import UserPopover from '../components/UserPopover'
import MentionInput, { normalizeHandle } from '../components/MentionInput'

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

const EDITORIAL_FONT = {
  fontFamily: '"Haas Groot Disp", Haas, Inter, system-ui, sans-serif',
}

const EDITORIAL_DISPLAY_FONT = {
  ...EDITORIAL_FONT,
  fontWeight: 400,
}

function buildMentionMap(mentions = []) {
  const map = new Map()
  mentions.forEach((user) => {
    const handle = normalizeHandle(user?.rollNumber || user?.name)
    if (handle && user?._id) map.set(handle, user)
  })
  return map
}

function MentionText({ text = '', mentions = [], onViewProfile }) {
  const mentionMap = useMemo(() => buildMentionMap(mentions), [mentions])
  const parts = String(text || '').split(/(@[A-Za-z0-9_]{1,64})/g)

  return (
    <span>
      {parts.map((part, index) => {
        const match = part.match(/^@([A-Za-z0-9_]{1,64})$/)
        const handle = match ? normalizeHandle(match[1]) : ''
        const user = handle ? mentionMap.get(handle) : null

        if (!user) return part

        return (
          <button
            key={`${part}-${index}`}
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onViewProfile?.(user._id)
            }}
            className="text-[#1b61c9] font-medium hover:None"
          >
            {part}
          </button>
        )
      })}
    </span>
  )
}

export default function Forum() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
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
  const [createError, setCreateError] = useState('')
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

  const [activePopover, setActivePopover] = useState(null)

  useEffect(() => {
    fetchRooms()
  }, [])

  useEffect(() => {
    setPage(1)
    fetchPosts(1)
  }, [selectedRoom, sort])

  useEffect(() => {
    if (selectedRoom) {
      setCreateRoom(selectedRoom)
    }
  }, [selectedRoom])

  const fetchRooms = async () => {
    try {
      const res = await getForumRooms()
      setRooms(res.data.data)
      if (res.data.data.length > 0) {
        setSelectedRoom((current) => current || res.data.data[0]._id)
        setCreateRoom((current) => current || res.data.data[0]._id)
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
    setCreateError('')

    if (!createRoom) {
      setCreateError('Select a room before posting.')
      return
    }

    if (createType === 'text' && !formData.content.trim()) {
      setCreateError('Add post content before posting.')
      return
    }

    if (createType === 'link' && !formData.linkUrl.trim()) {
      setCreateError('Add a link URL before posting.')
      return
    }

    if (createType === 'poll' && formData.pollOptions.filter(option => option.trim()).length < 2) {
      setCreateError('Add at least two poll options before posting.')
      return
    }

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
      setPage(1)
      fetchPosts(1)
      showToast('Post created successfully!')
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Unable to create post. Please try again.')
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

  const handleCommentSubmit = async (e, postId, content = commentDrafts[postId]?.content) => {
    e.preventDefault()
    if (!content?.trim()) return

    try {
      await createComment(postId, {
        content: content.trim(),
        parent: replyingTo || null
      })
      setCommentDrafts((current) => ({ ...current, [postId]: '' }))
      setReplyingTo(null)
      setPage(1)
      fetchPosts(1)
      showToast('Comment added!')
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

  const handleUserClick = (author, event) => {
    if (!author?._id) return
    const rect = event.currentTarget.getBoundingClientRect()
    setActivePopover({ userId: author._id, rect })
  }

  const handlePopoverClose = () => {
    setActivePopover(null)
  }

  const handleFollowUpdate = (updates) => {
    if (!activePopover?.userId) return
    const targetUserId = activePopover.userId
    setPosts(prev => prev.map(post => {
      if (post.author?._id === targetUserId) {
        const enrichedAuthor = post.author ? {
          ...post.author,
          friendStatus: updates.friendStatus ?? post.author.friendStatus,
        } : null
        return { ...post, author: enrichedAuthor }
      }
      return post
    }))
  }

  const handleViewProfile = (userId) => {
    setActivePopover(null)
    navigate(`/profile/${userId}`)
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activePopover) {
        const popover = document.querySelector('[data-user-popover]')
        if (popover && !popover.contains(e.target)) {
          handlePopoverClose()
        }
      }
    }
    const handleEscape = (e) => {
      if (e.key === 'Escape' && activePopover) {
        handlePopoverClose()
      }
    }

    if (activePopover) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [activePopover])

  const selectedRoomData = rooms.find(r => r._id === selectedRoom)

  const userVote = (post) => {
    if (post.upvotes?.includes(user?._id)) return 'up'
    if (post.downvotes?.includes(user?._id)) return 'down'
    return null
  }

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#181d26]" style={EDITORIAL_FONT}>
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8 xl:px-12 py-12 md:py-24">
        <div className="mb-10 md:mb-16 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <BackButton className="text-[#41454d]" />
            <h1 className="text-[32px] leading-[1.2] md:text-[40px] text-[#181d26]" style={EDITORIAL_DISPLAY_FONT}>Discussion Forum</h1>
          </div>
          {user && (
            <button
              onClick={() => {
                localStorage.removeItem('ei_token')
                localStorage.removeItem('ei_user')
                window.location.href = '/login'
              }}
              className="inline-flex flex-shrink-0 items-center gap-2 rounded-lg border border-[#dddddd] bg-[#ffffff] px-4 py-2 text-[13px] font-medium text-[#333840] transition-colors hover:bg-[#f8fafc]"
            >
              <Power size={14} /> Sign Out
            </button>
          )}
        </div>
        <div className="flex gap-6 lg:gap-8 xl:gap-12">
          
          {/* Left Sidebar — Rooms */}
          <aside className="hidden md:block w-[224px] flex-shrink-0 xl:w-[240px]">
            <div className="sticky top-24 space-y-8">
              <div className="rounded-lg border border-[#dddddd] bg-[#ffffff] p-4">
                <h2 className="mb-4 px-2 text-[11px] font-medium uppercase tracking-[0.16px] text-[#41454d]">Rooms</h2>
                <nav className="space-y-1">
                  <button
                    onClick={() => setSelectedRoom(null)}
                    className={`w-full flex items-center gap-3 rounded-sm px-3 py-2 text-left text-[14px] font-normal transition-colors ${
                      !selectedRoom ? 'bg-[#f8fafc] text-[#181d26]' : 'text-[#41454d] hover:bg-[#f8fafc] hover:text-[#181d26]'
                    }`}
                  >
                    <Home size={18} strokeWidth={1.75} />
                    All Posts
                  </button>
                  {rooms.map(room => (
                    <button
                      key={room._id}
                      onClick={() => setSelectedRoom(room._id)}
                      className={`w-full flex items-center gap-3 rounded-sm px-3 py-2 text-left text-[14px] font-normal transition-colors ${
                        selectedRoom === room._id ? 'bg-[#f8fafc] text-[#181d26]' : 'text-[#41454d] hover:bg-[#f8fafc] hover:text-[#181d26]'
                      }`}
                    >
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-sm text-[10px] font-medium text-white" style={{ backgroundColor: room.color }}>
                        {room.icon === 'Hash' ? <Hash size={12} /> : room.icon?.charAt(0)?.toUpperCase() || '#'}
                      </span>
                      <span className="truncate">{room.name}</span>
                      {room.isPopular && (
                        <span className="ml-auto text-[10px] font-medium uppercase tracking-[0.16px] text-[#aa2d00]">Hot</span>
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
            <div className="mb-6 md:hidden">
              <select
                value={selectedRoom || ''}
                onChange={(e) => setSelectedRoom(e.target.value || null)}
                className="h-11 w-full rounded-sm border border-[#dddddd] bg-[#ffffff] px-4 text-[14px] font-normal text-[#181d26] outline-none focus:border-[#458fff] focus:ring-2 focus:ring-[#458fff]/20"
              >
                <option value="">All Rooms</option>
                {rooms.map(room => (
                  <option key={room._id} value={room._id}>{room.name}</option>
                ))}
              </select>
            </div>

            {/* Create Post Bar */}
            <div className="mb-8">
              {!showCreate ? (
                <button
                  onClick={() => setShowCreate(true)}
                   className="flex w-full items-center gap-3 rounded-md border border-[#dddddd] bg-[#ffffff] p-4 text-left transition-colors hover:border-[#9297a0]"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#181d26] text-[14px] font-medium text-white">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="text-[14px] font-normal text-[#333840]">Create a post...</span>
                </button>
              ) : (
                <form onSubmit={handleCreate} className="rounded-lg border border-[#dddddd] bg-[#ffffff] p-5 space-y-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[20px] leading-[1.5] text-[#181d26]" style={EDITORIAL_DISPLAY_FONT}>Create Post</h3>
                    <button type="button" onClick={() => setShowCreate(false)} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dddddd] bg-[#ffffff] text-[#41454d] transition-colors hover:border-[#9297a0]">
                      <X size={18} />
                    </button>
                  </div>

                  {/* Room Selector */}
                  <select
                    value={createRoom}
                    onChange={(e) => setCreateRoom(e.target.value)}
                    className="h-11 w-full rounded-sm border border-[#dddddd] bg-[#ffffff] px-4 text-[14px] font-normal text-[#181d26] outline-none focus:border-[#458fff] focus:ring-2 focus:ring-[#458fff]/20"
                  >
                    <option value="">Select a room</option>
                    {rooms.map(room => (
                      <option key={room._id} value={room._id}>{room.name}</option>
                    ))}
                  </select>
                  {createError && (
                    <p role="alert" className="text-[12px] font-medium text-[#aa2d00]">
                      {createError}
                    </p>
                  )}
                  {rooms.length === 0 && (
                    <p className="text-[12px] font-medium text-[#41454d]">
                      No rooms are available. Ask an administrator to create a forum room.
                    </p>
                  )}

                  {/* Post Type Tabs */}
                  <div className="flex gap-1 rounded-sm bg-[#f8fafc] p-1">
                    {POST_TYPES.map(pt => {
                      const Icon = pt.icon
                      return (
                        <button
                          key={pt.key}
                          type="button"
                          onClick={() => setCreateType(pt.key)}
                          className={`flex-1 flex items-center justify-center gap-1.5 rounded-sm py-2 text-[13px] font-medium transition-colors ${
                            createType === pt.key ? 'border border-[#dddddd] bg-[#ffffff] text-[#181d26]' : 'text-[#41454d] hover:text-[#181d26]'
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
                    className="h-11 w-full rounded-sm border border-[#dddddd] bg-[#ffffff] px-4 text-[16px] font-normal text-[#181d26] placeholder:text-[#41454d] outline-none focus:border-[#458fff] focus:ring-2 focus:ring-[#458fff]/20"
                  />

                  {createType === 'text' && (
                    <MentionInput
                      multiline
                      value={formData.content}
                      onChange={(value) => setFormData({ ...formData, content: value })}
                      placeholder="What's on your mind? Type @ to mention someone"
                      excludeUserId={user?._id}
                    />
                  )}

                  {createType === 'link' && (
                    <input
                      type="url"
                      value={formData.linkUrl}
                      onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                      placeholder="https://example.com"
                      className="h-11 w-full rounded-sm border border-[#dddddd] bg-[#ffffff] px-4 text-[14px] font-normal text-[#181d26] placeholder:text-[#41454d] outline-none focus:border-[#458fff] focus:ring-2 focus:ring-[#458fff]/20"
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
                          className="h-11 w-full rounded-sm border border-[#dddddd] bg-[#ffffff] px-4 text-[14px] font-normal text-[#181d26] placeholder:text-[#41454d] outline-none focus:border-[#458fff] focus:ring-2 focus:ring-[#458fff]/20"
                        />
                      ))}
                      {formData.pollOptions.length < 6 && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, pollOptions: [...formData.pollOptions, ''] })}
                          className="text-[14px] font-medium text-[#1b61c9] hover:None"
                        >
                          + Add option
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg border border-[#dddddd] bg-[#ffffff] px-4 py-2 text-[14px] font-medium text-[#333840] transition-colors hover:bg-[#f8fafc]">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!createRoom || !formData.title.trim()}
                      className="rounded-lg bg-[#181d26] px-5 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#0d1218] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Post
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Sort Bar */}
            <div className="mb-6 flex items-end justify-between gap-4 border-b border-[#dddddd] pb-4">
              <h1 className="text-[24px] leading-[1.35] text-[#181d26]" style={EDITORIAL_DISPLAY_FONT}>
                {selectedRoomData ? selectedRoomData.name : 'All Posts'}
              </h1>
              <div className="flex items-center gap-1 rounded-sm border border-[#dddddd] bg-[#ffffff] p-1">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setSort(opt.key)}
                    className={`rounded-sm px-3 py-1.5 text-[13px] font-medium transition-colors ${
                      sort === opt.key ? 'bg-[#181d26] text-white' : 'text-[#41454d] hover:text-[#181d26]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Posts Feed */}
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-lg border border-[#dddddd] bg-[#ffffff] p-5 skeleton-shimmer">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-[#e0e2e6]" />
                      <div className="h-3 w-24 rounded bg-[#e0e2e6]" />
                      <div className="h-3 w-16 rounded bg-[#e0e2e6]" />
                    </div>
                    <div className="mb-2 h-5 w-full rounded bg-[#e0e2e6]" />
                    <div className="mb-1.5 h-4 w-full rounded bg-[#e0e2e6]" />
                    <div className="mb-4 h-4 w-3/4 rounded bg-[#e0e2e6]" />
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-20 rounded-sm bg-[#e0e2e6]" />
                      <div className="h-9 w-24 rounded-sm bg-[#e0e2e6]" />
                      <div className="h-9 w-16 rounded-sm bg-[#e0e2e6]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="rounded-lg border border-[#dddddd] bg-[#f8fafc] py-16 px-6 text-center">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#e0e2e6]">
                  <MessageCircle size={24} className="text-[#41454d]" />
                </div>
                <p className="text-[14px] font-normal text-[#41454d]">No posts yet. Start the conversation!</p>
              </div>
            ) : (
              <div className="space-y-4">
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
                    onUserClick={handleUserClick}
                    onViewProfile={handleViewProfile}
                    onUpvoteComment={upvoteComment}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => { setPage(p => p - 1); fetchPosts(page - 1) }}
                disabled={page === 1}
                className="h-10 rounded-sm border border-[#dddddd] bg-[#ffffff] px-4 text-[13px] font-medium text-[#181d26] transition-colors hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-[13px] font-normal text-[#41454d]">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => { setPage(p => p + 1); fetchPosts(page + 1) }}
                disabled={page === totalPages}
                className="h-10 rounded-sm border border-[#dddddd] bg-[#ffffff] px-4 text-[13px] font-medium text-[#181d26] transition-colors hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
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
                <div className="rounded-lg bg-[#181d26] p-5 text-white md:p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-md text-white text-[16px] font-medium" style={{ backgroundColor: selectedRoomData.color }}>
                      {selectedRoomData.icon === 'Hash' ? <Hash size={16} /> : selectedRoomData.icon?.charAt(0)?.toUpperCase() || '#'}
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-[18px] leading-[1.4] text-white" style={EDITORIAL_DISPLAY_FONT}>{selectedRoomData.name}</h3>
                      <p className="text-[12px] font-normal text-[#f8fafc]/80">{selectedRoomData.postCount || 0} posts</p>
                    </div>
                  </div>
                  <p className="text-[14px] leading-[1.5] text-[#f8fafc]/80">
                    {selectedRoomData.description || 'No description'}
                  </p>
                </div>
              )}

              <div className="rounded-lg border border-[#dddddd] bg-[#ffffff] p-5 md:p-6">
                <h3 className="mb-4 text-[16px] leading-[1.4] text-[#181d26]" style={EDITORIAL_DISPLAY_FONT}>Community Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[13px] font-normal">
                    <span className="text-[#41454d]">Total Rooms</span>
                    <span className="font-medium text-[#181d26]">{rooms.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px] font-normal">
                    <span className="text-[#41454d]">Total Posts</span>
                    <span className="font-medium text-[#181d26]">{posts.length > 0 ? '—' : '0'}</span>
                  </div>
                  <div className="flex items-center gap-2 border-t border-[#dddddd] pt-3">
                    <span className="h-2 w-2 rounded-full bg-[#0a2e0e]"></span>
                    <span className="text-[13px] font-normal text-[#41454d]">Community active</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* User Popover */}
      {activePopover && (() => {
        const activeUser = posts.flatMap(p => [p.author, ...(p.comments || []).map(c => c.author)]).find(u => u?._id === activePopover.userId)
        return (
          <UserPopover
            user={activeUser}
            rect={activePopover.rect}
            onClose={handlePopoverClose}
            onFollow={handleFollowUpdate}
            onViewProfile={handleViewProfile}
          />
        )
      })()}
    </div>
  )
}

function PostCard({
  post, user, userVote, onUpvote, onDownvote,
  onToggleComments, openComments, commentDrafts, setCommentDrafts,
  onCommentSubmit, replyingTo, setReplyingTo, formatTimeAgo,
  onUserClick, onViewProfile, onUpvoteComment
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
    onCommentSubmit(e, post._id, localDraft)
    setLocalDraft('')
  }

  const handleReplySubmit = (e, parentId) => {
    e.preventDefault()
    onCommentSubmit(e, post._id, replyDraft)
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
    <div className="rounded-md border border-[#dddddd] bg-[#ffffff] p-5 shadow-[0_1px_2px_rgba(24,29,38,0.04)] transition-colors hover:border-[#9297a0] md:p-6">
      {/* Author & Meta */}
      <div className="mb-3 flex items-center gap-2 text-[13px] font-normal text-[#41454d]">
        <button
          onClick={(e) => onUserClick?.(post.author, e)}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#dddddd] bg-[#f8fafc] text-[11px] font-medium text-[#41454d] transition-colors hover:border-[#9297a0]"
        >
          {post.author?.photo ? (
            <img src={post.author.photo} alt={post.author.name} className="h-full w-full object-cover" />
          ) : (
            post.author?.name?.charAt(0)?.toUpperCase()
          )}
        </button>
        <button
          onClick={(e) => onUserClick?.(post.author, e)}
          className="font-medium text-[#181d26] hover:None"
        >
          {post.author?.name}
        </button>
        <span className="text-[#dddddd]">·</span>
        <span>{formatTimeAgo(post.createdAt)}</span>
        {post.isPinned && (
          <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.16px] text-[#aa2d00]">
            <Pin size={12} /> Pinned
          </span>
        )}
      </div>

      {/* Post Type Badge */}
      {post.postType && post.postType !== 'text' && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-sm bg-[#f8fafc] px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16px] text-[#41454d]">
            {post.postType === 'image' && <Image size={12} />}
            {post.postType === 'poll' && <BarChart3 size={12} />}
            {post.postType === 'link' && <Link2 size={12} />}
            {post.postType}
          </span>
          {post.room && (
            <span className="inline-flex items-center gap-1 rounded-sm bg-[#f8fafc] px-2.5 py-1 text-[11px] font-medium text-[#41454d]">
              <Hash size={12} />
              {post.room.name}
            </span>
          )}
        </div>
      )}

      {/* Post Body */}
      <h2 className="mb-1 text-[18px] font-medium leading-[1.4] text-[#181d26]" style={EDITORIAL_DISPLAY_FONT}>
        <MentionText text={post.title} mentions={post.mentions} onViewProfile={onViewProfile} />
      </h2>
      <div className="mb-4 text-[14px] font-normal leading-[1.5] text-[#333840] whitespace-pre-wrap break-words">
        <MentionText text={post.content} mentions={post.mentions} onViewProfile={onViewProfile} />
      </div>

      {/* Link Preview */}
      {post.postType === 'link' && post.linkUrl && (
        <a
          href={post.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-3 inline-flex items-center gap-2 text-[13px] font-medium text-[#1b61c9] hover:None"
          onClick={(e) => e.stopPropagation()}
        >
          <Link2 size={14} />
          {post.linkUrl}
        </a>
      )}

      {/* Poll */}
      {post.postType === 'poll' && post.pollOptions?.length > 0 && (
        <div className="mb-4 space-y-2">
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
              className="w-full rounded-sm border border-[#dddddd] bg-[#ffffff] px-3 py-2 text-left text-[14px] font-normal text-[#181d26] transition-colors hover:border-[#9297a0]"
            >
              <div className="flex items-center justify-between">
                <span>{opt.text}</span>
                <span className="text-[12px] font-medium text-[#41454d]">{opt.votes || 0} votes</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Action Bar */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {/* Vote Pill */}
        <div className="flex items-center overflow-hidden rounded-sm border border-[#dddddd] bg-[#f8fafc]">
          <button
            onClick={() => onUpvote(post._id)}
            className={`px-2.5 py-1.5 transition-colors ${userVote === 'up' ? 'bg-[#aa2d00]/10 text-[#aa2d00]' : 'text-[#41454d] hover:text-[#aa2d00]'}`}
            aria-label="Upvote"
          >
            <ArrowBigUp size={18} strokeWidth={1.75} />
          </button>
          <span className={`min-w-[24px] px-1 text-center text-[13px] font-medium ${userVote ? 'text-[#181d26]' : 'text-[#41454d]'}`}>
            {(post.upvotes?.length || 0) - (post.downvotes?.length || 0)}
          </span>
          <button
            onClick={() => onDownvote(post._id)}
            className={`px-2.5 py-1.5 transition-colors ${userVote === 'down' ? 'bg-[#0a2e0e]/10 text-[#0a2e0e]' : 'text-[#41454d] hover:text-[#0a2e0e]'}`}
            aria-label="Downvote"
          >
            <ArrowBigDown size={18} strokeWidth={1.75} />
          </button>
        </div>

        {/* Comments */}
        <button
          onClick={onToggleComments}
          className={`flex items-center gap-1.5 rounded-sm border border-[#dddddd] px-3 py-1.5 text-[13px] font-medium transition-colors ${
            openComments ? 'border-[#9297a0] bg-[#f8fafc] text-[#181d26]' : 'bg-[#ffffff] text-[#41454d] hover:bg-[#f8fafc] hover:text-[#181d26]'
          }`}
        >
          <MessageCircle size={16} strokeWidth={1.75} />
          {post.comments?.length || 0}
        </button>

        {/* Share */}
        <button
          className="flex items-center gap-1.5 rounded-sm border border-[#dddddd] bg-[#ffffff] px-3 py-1.5 text-[13px] font-medium text-[#41454d] transition-colors hover:bg-[#f8fafc] hover:text-[#181d26]"
          aria-label="Share"
        >
          <Share2 size={16} strokeWidth={1.75} />
          Share
        </button>
      </div>

      {/* Comments Section */}
      {openComments && (
        <div className="mt-5 space-y-5 border-t border-[#dddddd] pt-5">
          {/* Comment Input */}
          <form onSubmit={(e) => handleLocalSubmit(e)} className="flex gap-3">
            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#181d26] text-[12px] font-medium text-white">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex flex-1 gap-2">
              <MentionInput
                value={localDraft}
                onChange={(value) => { setLocalDraft(value); handleCommentDraft(post._id, value) }}
                placeholder="Add a comment... Type @ to mention someone"
                excludeUserId={user?._id}
                className="h-11 flex-1"
              />
              <button
                type="submit"
                disabled={!localDraft.trim()}
                className="h-11 rounded-lg bg-[#181d26] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#0d1218] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Comment
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-5 pl-1">
            {topLevelComments.length === 0 && (
              <p className="text-[13px] font-normal italic text-[#41454d]">No comments yet.</p>
            )}
            {topLevelComments.map(comment => (
              <div key={comment._id} className="flex gap-3">
                <button
                  onClick={(e) => onUserClick?.(comment.author, e)}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#dddddd] bg-[#f8fafc] text-[11px] font-medium text-[#41454d] transition-colors hover:border-[#9297a0]"
                >
                  {comment.author?.photo ? (
                    <img src={comment.author.photo} alt={comment.author.name} className="h-full w-full object-cover" />
                  ) : (
                    comment.author?.name?.charAt(0)?.toUpperCase()
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-center gap-2">
                    <button
                      onClick={(e) => onUserClick?.(comment.author, e)}
                      className="text-[13px] font-medium text-[#181d26] hover:None"
                    >
                      {comment.author?.name}
                    </button>
                    <span className="text-[11px] font-normal text-[#41454d]">{formatTimeAgo(comment.createdAt)}</span>
                  </div>
                  <MentionText text={comment.content} mentions={comment.mentions} onViewProfile={onViewProfile} />
                  <div className="mt-1.5 flex items-center gap-3">
                    <button
                      onClick={() => onUpvoteComment(comment._id)}
                      className="flex items-center gap-1 text-[12px] font-normal text-[#41454d] transition-colors hover:text-[#aa2d00]"
                    >
                      <ArrowBigUp size={14} strokeWidth={1.75} />
                      {comment.upvotes?.length || 0}
                    </button>
                    <button
                      onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                      className="text-[12px] font-medium text-[#41454d] transition-colors hover:text-[#181d26]"
                    >
                      Reply
                    </button>
                  </div>

                  {/* Reply Input */}
                  {replyingTo === comment._id && (
                    <form onSubmit={(e) => handleReplySubmit(e, comment._id)} className="mt-2 flex gap-2">
                      <MentionInput
                        value={replyDraft}
                        onChange={handleReplyDraft}
                        placeholder="Reply... Type @ to mention someone"
                        excludeUserId={user?._id}
                        className="h-10 flex-1"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={!replyDraft.trim()}
                        className="h-10 rounded-lg bg-[#181d26] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#0d1218] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Reply
                      </button>
                    </form>
                  )}

                  {/* Nested Replies */}
                  {replyMap[comment._id]?.length > 0 && (
                    <div className="mt-3 space-y-3 border-l border-[#dddddd] pl-4">
                      {replyMap[comment._id].map(reply => (
                        <div key={reply._id} className="flex gap-2">
                          <button
                            onClick={(e) => onUserClick?.(reply.author, e)}
                            className="flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#dddddd] bg-[#f8fafc] text-[10px] font-medium text-[#41454d] transition-colors hover:border-[#9297a0]"
                          >
                            {reply.author?.photo ? (
                              <img src={reply.author.photo} alt={reply.author.name} className="h-full w-full object-cover" />
                            ) : (
                              reply.author?.name?.charAt(0)?.toUpperCase()
                            )}
                          </button>
                          <div className="min-w-0 flex-1">
                            <div className="mb-0.5 flex items-center gap-2">
                              <button
                                onClick={(e) => onUserClick?.(reply.author, e)}
                                className="text-[12px] font-medium text-[#181d26] hover:None"
                              >
                                {reply.author?.name}
                              </button>
                              <span className="text-[10px] font-normal text-[#41454d]">{formatTimeAgo(reply.createdAt)}</span>
                            </div>
                            <MentionText text={reply.content} mentions={reply.mentions} onViewProfile={onViewProfile} />
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
