import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { Link, useNavigate } from 'react-router-dom'

export default function Forum() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showIntro, setShowIntro] = useState(true)
  
  // Track open comment threads
  const [openComments, setOpenComments] = useState({})
  // Track comment draft for each post
  const [commentDrafts, setCommentDrafts] = useState({})
  
  // Create post state
  const [showCreate, setShowCreate] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    links: ''
  })

  useEffect(() => {
    // Tu-Dum Intro timer
    const timer = setTimeout(() => {
      setShowIntro(false)
    }, 2800)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const res = await api.get('/forum')
      setPosts(res.data.data) // Default sorting from backend
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formData.content.trim() && !formData.title.trim()) return
    
    try {
      const linksArray = formData.links ? formData.links.split(',').map(l => l.trim()).filter(l => l) : []
      const payloadTitle = formData.title.trim() || 'Untitled Discussion'
      
      await api.post('/forum', { 
        title: payloadTitle, 
        content: formData.content, 
        links: linksArray 
      })
      setFormData({ title: '', content: '', links: '' })
      setShowCreate(false)
      fetchPosts()
    } catch (err) {
      console.error(err)
    }
  }

  const handleUpvote = async (id) => {
    try {
      const res = await api.put(`/forum/${id}/upvote`)
      setPosts(posts.map(p => p._id === id ? { ...p, upvotes: res.data.data } : p))
    } catch (err) {
      console.error(err)
    }
  }
  
  const handleCommentSubmit = async (e, postId) => {
    e.preventDefault()
    const draft = commentDrafts[postId]
    if (!draft?.content?.trim() && !draft?.imageUrl?.trim()) return

    try {
      await api.post(`/forum/${postId}/comments`, {
        content: draft.content || '',
        imageUrl: draft.imageUrl || ''
      })
      setCommentDrafts({ ...commentDrafts, [postId]: { content: '', imageUrl: '' } })
      fetchPosts()
    } catch (err) {
      console.error(err)
    }
  }

  // Formatting relative time like Reddit (e.g., "3 hours ago")
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " mins ago";
    return Math.floor(seconds) + " secs ago";
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-white">
        <div className="text-center p-8 bg-[#1e2124]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl max-w-md">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-gray-400 mb-6">You must be logged in to view the forum.</p>
          <Link to="/login" className="bg-[#5865F2] hover:bg-[#4752C4] px-6 py-2 rounded-xl font-medium transition-colors">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-[#06070a] overflow-hidden text-gray-200 font-sans selection:bg-[#5865F2]/30 relative">
      
      {/* ── Background Mesh Orbs (Subtle) ── */}
      <div className="absolute top-[-30%] left-[10%] w-[50%] h-[50%] bg-[#5865F2]/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#ab24a5]/10 blur-[150px] rounded-full pointer-events-none" />

      {/* ── Premium Gaming App Intro Overlay ── */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 z-[100] bg-[#050608] flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Ambient Background Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#00f2fe]/10 to-[#4facfe]/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#5865F2]/20 blur-[80px] rounded-full pointer-events-none" />
            
            <motion.div
              initial={{ scale: 0.85, opacity: 0, filter: 'blur(10px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              transition={{ 
                duration: 1.2, 
                ease: [0.16, 1, 0.3, 1]
              }}
              className="relative text-center flex flex-col items-center z-10"
            >
              {/* Icon/Symbol */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                className="mb-8 relative"
              >
                {/* Glow behind icon */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#00f2fe] to-[#5865F2] blur-[25px] opacity-40 rounded-full scale-150" />
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="relative z-10 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </motion.div>

              {/* Title */}
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                className="font-display font-black text-5xl md:text-7xl tracking-[0.15em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-[#e0e7ff] to-[#8c9eff] drop-shadow-[0_0_20px_rgba(140,158,255,0.4)] mb-2"
              >
                ELECTRO
              </motion.h1>
              
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                className="font-display font-black text-5xl md:text-7xl tracking-[0.15em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#00f2fe] to-[#4facfe] drop-shadow-[0_0_25px_rgba(0,242,254,0.5)] mb-6"
              >
                INFINITY
              </motion.h1>

              {/* Animated underline */}
              <motion.div 
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "100%", opacity: 1 }}
                transition={{ duration: 1.2, delay: 0.8, ease: "easeInOut" }}
                className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#5865F2] to-transparent"
              />
              
              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, letterSpacing: "0.1em" }}
                animate={{ opacity: 1, letterSpacing: "0.5em" }}
                transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
                className="text-[#8c9eff] text-sm mt-6 font-bold uppercase"
              >
                Open Forum
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex h-full w-full relative z-10">
        
        {/* ── Sidebar (Reddit Style Left Nav) ── */}
        <div className="w-[240px] bg-[#111216]/80 backdrop-blur-xl border-r border-white/5 flex-shrink-0 flex flex-col shadow-2xl z-20 hidden md:flex">
          <div className="h-[56px] border-b border-white/5 flex items-center px-4 flex-shrink-0">
            <h1 className="font-display text-lg font-bold text-white tracking-wide flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#5865F2] to-[#ab24a5] flex items-center justify-center text-xs">
                ⚡
              </div>
              Open Forum
            </h1>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <button 
              onClick={() => navigate('/')}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors group"
            >
              <svg className="text-gray-400 group-hover:text-white transition-colors" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              <span className="font-medium">Back to Home</span>
            </button>
            
            <div className="pt-4 pb-1">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-3 mb-1">Feeds</div>
              <div className="flex items-center gap-3 px-3 py-2 bg-white/10 text-white rounded-lg cursor-pointer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <span className="font-medium text-sm">Home</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-white/5 hover:text-white rounded-lg cursor-pointer transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
                <span className="font-medium text-sm">Popular</span>
              </div>
            </div>

            <div className="pt-4 pb-1">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-3 mb-1">Recent Topics</div>
              {/* Placeholders for recent topics to simulate Reddit's sidebar */}
              {['#circuit-theory', '#placements', '#projects'].map((topic, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-1.5 text-gray-400 hover:bg-white/5 hover:text-white rounded-lg cursor-pointer transition-colors">
                  <div className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-[10px]">
                    #
                  </div>
                  <span className="font-medium text-[13px]">{topic}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* User Card */}
          <div className="p-3 border-t border-white/5 flex-shrink-0">
            <div className="flex items-center gap-2.5 bg-black/20 p-2 rounded-lg border border-white/5 w-full hover:bg-white/5 cursor-pointer transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5865F2] to-[#ab24a5] flex items-center justify-center text-white text-sm font-bold flex-shrink-0 relative">
                {user.name.charAt(0).toUpperCase()}
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#23a559] border-2 border-[#111216] rounded-full"></div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-[13px] text-white truncate leading-none mb-0.5">{user.name}</span>
                <span className="text-[11px] text-gray-400 truncate leading-none capitalize">{user.role.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Feed Area ── */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent flex justify-center">
          
          {/* Center Column (Like Reddit's main feed) */}
          <div className="w-full max-w-[640px] py-6 px-4 md:px-0">
            
            {/* Create Post Bar (Reddit Horizontal Style) */}
            <div className="mb-4">
              {!showCreate ? (
                <div className="bg-[#1a1b1e]/80 backdrop-blur-xl border border-white/10 rounded-lg p-2.5 flex items-center gap-3 shadow-lg hover:border-white/20 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#5865F2] to-[#ab24a5] flex items-center justify-center text-white font-bold flex-shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <input 
                    type="text" 
                    placeholder="Create Post" 
                    onClick={() => setShowCreate(true)} 
                    className="flex-1 bg-[#27272a] hover:bg-[#2f2f33] border border-white/5 rounded-md px-4 py-2 text-[14px] text-gray-200 placeholder-gray-400 focus:outline-none focus:border-gray-500 transition-colors cursor-pointer" 
                    readOnly 
                  />
                  <button onClick={() => setShowCreate(true)} className="p-2 text-gray-400 hover:bg-white/10 rounded-md transition-colors tooltip" title="Create Media Post">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </button>
                  <button onClick={() => setShowCreate(true)} className="p-2 text-gray-400 hover:bg-white/10 rounded-md transition-colors" title="Attach Link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreate} className="bg-[#1a1b1e]/90 backdrop-blur-xl border border-white/20 rounded-lg p-4 shadow-2xl relative">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-display text-base font-bold text-white">Create a Post</h3>
                    <button type="button" onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                  
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Title"
                    className="w-full bg-[#27272a] border border-white/10 rounded-md p-2.5 mb-2 text-white placeholder-gray-400 focus:outline-none focus:border-white/30 transition-colors text-[15px] font-bold"
                  />
                  <textarea
                    required
                    rows="4"
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    placeholder="Text (optional)"
                    className="w-full bg-[#27272a] border border-white/10 rounded-md p-2.5 mb-2 text-gray-200 placeholder-gray-400 focus:outline-none focus:border-white/30 transition-colors resize-none text-[14px]"
                  />
                  <input
                    type="text"
                    value={formData.links}
                    onChange={(e) => setFormData({...formData, links: e.target.value})}
                    placeholder="Links (comma separated)"
                    className="w-full bg-[#27272a] border border-white/10 rounded-md p-2.5 mb-3 text-gray-200 placeholder-gray-400 focus:outline-none focus:border-white/30 transition-colors text-[13px]"
                  />
                  
                  <div className="flex justify-end pt-2 border-t border-white/10">
                    <button 
                      type="submit" 
                      className="bg-gray-100 hover:bg-white text-black font-bold py-1.5 px-5 rounded-full text-[14px] transition-colors"
                    >
                      Post
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Posts Feed */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-3 border-[#5865F2] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex w-16 h-16 bg-white/5 rounded-full items-center justify-center mb-4">
                  <svg className="text-gray-400" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                  </svg>
                </div>
                <p className="text-gray-400 text-sm">No posts yet. Be the first to start the conversation!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map(post => (
                  <div key={post._id} className="bg-[#1a1b1e]/80 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden shadow-md hover:border-white/20 transition-colors group/card cursor-pointer">
                    
                    <div className="px-4 pt-3 pb-1">
                      
                      {/* Top Bar (Author Info) */}
                      <div className="flex items-center gap-2 mb-2 text-xs text-gray-400">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                          {post.author?.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-gray-300 hover:underline cursor-pointer">u/{post.author?.name?.toLowerCase().replace(/\s+/g, '')}</span>
                        {post.author?.role === 'cr' && (
                          <span className="bg-[#5865F2]/20 text-[#8ea1ff] text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                            CR {post.author?.graduation_year}
                          </span>
                        )}
                        <span className="text-gray-500">•</span>
                        <span>{formatTimeAgo(post.createdAt)}</span>
                      </div>

                      {/* Post Body */}
                      <h2 className="text-[17px] font-bold text-gray-100 mb-1.5 leading-snug">
                        {post.title}
                      </h2>
                      <div className="text-gray-300 text-[14px] leading-relaxed mb-3 whitespace-pre-wrap break-words">
                        {post.content}
                      </div>

                      {/* Links */}
                      {post.links && post.links.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {post.links.map((link, i) => (
                            <a 
                              key={i} 
                              href={link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-medium text-[12px] text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-2.5 py-1 rounded-full transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                              </svg>
                              Link {i + 1}
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Action Bar (Horizontal at bottom) */}
                      <div className="flex items-center gap-2 mt-1 mb-2">
                        
                        {/* Upvote Pill */}
                        <div 
                          className="flex items-center bg-[#27272a] rounded-full overflow-hidden border border-transparent group-hover/card:border-white/5 transition-colors"
                          onClick={(e) => { e.stopPropagation(); handleUpvote(post._id); }}
                        >
                          <button className={`p-1.5 px-2 hover:bg-white/10 transition-colors ${post.upvotes.includes(user?._id) ? 'text-orange-500' : 'text-gray-400 hover:text-orange-500'}`}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill={post.upvotes.includes(user?._id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 19V5M5 12l7-7 7 7"/>
                            </svg>
                          </button>
                          <span className={`px-1 text-[13px] font-bold ${post.upvotes.includes(user?._id) ? 'text-orange-500' : 'text-gray-200'}`}>
                            {post.upvotes.length}
                          </span>
                          <button className="p-1.5 px-2 hover:bg-white/10 transition-colors text-gray-400 hover:text-[#5865F2]">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 5v14M19 12l-7 7-7-7"/>
                            </svg>
                          </button>
                        </div>
                        
                        {/* Comments Pill */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); setOpenComments({...openComments, [post._id]: !openComments[post._id]}) }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-bold transition-colors border border-transparent group-hover/card:border-white/5 ${
                            openComments[post._id] 
                              ? 'bg-white/10 text-white' 
                              : 'bg-[#27272a] text-gray-400 hover:bg-[#2f2f33]'
                          }`}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                          </svg>
                          {post.comments?.length || 0}
                        </button>
                        
                        {/* Share Pill */}
                        <button 
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#27272a] hover:bg-[#2f2f33] rounded-full text-gray-400 text-[13px] font-bold transition-colors border border-transparent group-hover/card:border-white/5"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                            <polyline points="16 6 12 2 8 6"></polyline>
                            <line x1="12" y1="2" x2="12" y2="15"></line>
                          </svg>
                          Share
                        </button>
                      </div>

                    </div>

                    {/* Nested Comments */}
                    {openComments[post._id] && (
                      <div className="bg-[#151619] border-t border-white/5 p-4 cursor-default" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-4 mb-4 pl-2">
                          {post.comments?.map(comment => (
                            <div key={comment._id} className="flex gap-3 relative before:absolute before:left-[-16px] before:top-8 before:bottom-0 before:w-[2px] before:bg-white/5">
                              <div className="w-7 h-7 rounded-full bg-[#27272a] flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 z-10 shadow-sm border border-white/10">
                                {comment.author?.name?.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-baseline gap-2 mb-0.5">
                                  <span className="font-semibold text-gray-200 text-[13px] hover:underline cursor-pointer">{comment.author?.name}</span>
                                  <span className="text-[11px] text-gray-500">{formatTimeAgo(comment.createdAt)}</span>
                                </div>
                                <div className="text-gray-300 text-[14px] leading-relaxed break-words">
                                  {comment.content}
                                </div>
                                {comment.imageUrl && (
                                  <img src={comment.imageUrl} alt="Attachment" className="mt-3 rounded-lg max-h-48 object-contain bg-black/40 border border-white/5" />
                                )}
                              </div>
                            </div>
                          ))}
                          {post.comments?.length === 0 && (
                            <div className="text-[13px] text-gray-500 italic">No comments yet.</div>
                          )}
                        </div>
                        
                        {/* Thread Reply Input */}
                        <form onSubmit={(e) => handleCommentSubmit(e, post._id)} className="flex items-start gap-3 mt-4 ml-1">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#5865F2] to-[#ab24a5] flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 mt-1 shadow-sm">
                            {user?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 flex flex-col gap-2 bg-[#27272a] border border-white/5 rounded-xl p-3">
                            <textarea
                              rows="2"
                              value={commentDrafts[post._id]?.content || ''}
                              onChange={(e) => setCommentDrafts({...commentDrafts, [post._id]: { ...commentDrafts[post._id], content: e.target.value }})}
                              placeholder="Add a comment"
                              className="w-full bg-transparent border-none text-[14px] text-gray-200 placeholder-gray-400 focus:outline-none resize-none"
                            />
                            <div className="flex items-center justify-between pt-1">
                              <input
                                type="url"
                                value={commentDrafts[post._id]?.imageUrl || ''}
                                onChange={(e) => setCommentDrafts({...commentDrafts, [post._id]: { ...commentDrafts[post._id], imageUrl: e.target.value }})}
                                placeholder="Image URL (optional)"
                                className="w-1/2 max-w-[200px] bg-[#1a1b1e] border border-white/5 rounded-lg px-2.5 py-1 text-[12px] text-gray-300 placeholder-gray-500 focus:outline-none focus:border-white/20 transition-colors"
                              />
                              <button 
                                type="submit" 
                                disabled={!commentDrafts[post._id]?.content && !commentDrafts[post._id]?.imageUrl} 
                                className="bg-gray-100 hover:bg-white text-black px-4 py-1.5 rounded-full text-[12px] font-bold transition-colors disabled:opacity-50"
                              >
                                Comment
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Right Sidebar (Optional placeholder for full Reddit feel) */}
          <div className="hidden lg:block w-[300px] py-6 px-4">
            <div className="bg-[#1a1b1e]/80 backdrop-blur-xl border border-white/5 rounded-lg p-4 sticky top-6">
              <h3 className="font-bold text-gray-200 mb-2 text-sm uppercase tracking-wide">About Open Forum</h3>
              <p className="text-gray-400 text-xs leading-relaxed mb-4">
                A community space for all batches of Electro Infinity to share resources, ask queries, and discuss everything electrical engineering.
              </p>
              <div className="border-t border-white/5 pt-4">
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-300">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <strong>{posts.length * 3 + 12}</strong> Online Now
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                  <strong>{posts.length}</strong> Total Posts
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}
