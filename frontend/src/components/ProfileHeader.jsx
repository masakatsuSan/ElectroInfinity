import { useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Share2, Edit3, X, QrCode, MessageCircle, Star, Activity, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { uploadCoverPhoto, uploadProfilePhoto, getProfileQr } from '../api/profile'
import FriendActionButton from './FriendActionButton'
import { QRCodeSVG } from 'qrcode.react'
import { EASE, DURATION } from '../utils/motion'

function timeAgo(date) {
  if (!date) return ''
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function ProfileHeader({
  profile,
  isOwn,
  onUpdate,
  stats = {},
  onShare,
}) {
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const coverRef = useRef(null)
  const photoRef = useRef(null)
  const [coverLoading, setCoverLoading] = useState(false)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const [qrData, setQrData] = useState(null)
  const [qrLoading, setQrLoading] = useState(false)

  const mutualCount = useMemo(() => {
    if (!currentUser?._id || !profile?.friends?.length) return 0
    return profile.friends.filter(fid => currentUser.friends?.some(cid => cid.toString() === fid.toString())).length
  }, [profile?.friends, currentUser?.friends])

  const isActiveNow = useMemo(() => {
    if (!profile?.lastActive) return false
    return Date.now() - new Date(profile.lastActive).getTime() < 5 * 60 * 1000
  }, [profile?.lastActive])

  const connectionLabel = useMemo(() => {
    if (!currentUser?._id) return null
    if (profile?.friendStatus === 'friends') return 'Friends'
    if (profile?.friendStatus === 'pending_sent') return 'Requested'
    if (profile?.friendStatus === 'pending_received') return 'Wants to connect'
    if (mutualCount > 0) return `${mutualCount} mutual friend${mutualCount !== 1 ? 's' : ''}`
    return null
  }, [profile?.friendStatus, mutualCount, currentUser?._id])

  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverLoading(true)
    try {
      const fd = new FormData()
      fd.append('cover', file)
      const res = await uploadCoverPhoto(fd)
      onUpdate?.({ ...profile, coverPhoto: res.data.data.coverPhoto })
    } catch (err) {
      console.error(err)
    } finally {
      setCoverLoading(false)
    }
  }

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoLoading(true)
    try {
      const fd = new FormData()
      fd.append('photo', file)
      const res = await uploadProfilePhoto(fd)
      onUpdate?.({ ...profile, photo: res.data.data.photo })
    } catch (err) {
      console.error(err)
    } finally {
      setPhotoLoading(false)
    }
  }

  const displayUsername = profile.rollNumber
    ? `@${profile.rollNumber.toLowerCase()}`
    : `@${profile.name.toLowerCase().replace(/\s+/g, '')}`

  const openQr = async () => {
    setQrLoading(true)
    setQrOpen(true)
    try {
      const res = await getProfileQr(profile._id)
      setQrData(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setQrLoading(false)
    }
  }

  const handleCopyLink = async () => {
    const url = window.location.href
    await navigator.clipboard.writeText(url)
    alert('Profile link copied to clipboard!')
  }

  const totalPosts = (profile?.projects || 0) + (profile?.forumPosts || 0) + (profile?.resourcesUploaded || 0)

  return (
    <div className="relative w-full bg-white border-b border-hairline">
      <div className="relative w-full h-[170px] sm:h-[200px]">
        {profile.coverPhoto ? (
          <img src={profile.coverPhoto} alt="Cover" className="object-cover w-full h-full" />
        ) : (
          <div className="w-full h-full bg-cover bg-center" style={{
            backgroundImage: 'linear-gradient(135deg, #181d26 0%, #0d1218 50%, #181d26 100%)'
          }} />
        )}

        {isOwn && (
          <button
            onClick={() => coverRef.current?.click()}
            disabled={coverLoading}
            className="absolute top-4 right-4 w-9 h-9 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors disabled:opacity-50"
          >
            <Camera size={18} />
          </button>
        )}
        <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
      </div>

      <div className="max-w-[1280px] mx-auto px-4 md:px-12">
        <div className="relative flex flex-col md:flex-row md:items-end md:gap-6 -mt-12 md:-mt-14">
          <div className="relative flex-shrink-0 mb-[-2px]">
            <div className={`relative w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-white bg-white p-0.5 overflow-hidden ${isOwn ? 'cursor-pointer group' : ''}`}>
              {profile.photo ? (
                <img src={profile.photo} alt={profile.name} className="object-cover w-full h-full rounded-full" />
              ) : (
                <div className="w-full h-full rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-4xl font-bold text-gray-600 font-display">
                    {profile.name?.charAt(0)}
                  </span>
                </div>
              )}
              {isOwn && (
                <div className="absolute inset-0 flex items-center justify-center transition-opacity rounded-full opacity-0 bg-black/30 group-hover:opacity-100">
                  <Camera size={22} className="text-white" />
                </div>
              )}
            </div>
            {isOwn && (
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            )}

            {isActiveNow && !isOwn && (
              <span className="absolute -bottom-1 -right-1 z-10 flex items-center gap-0.5 bg-white border-2 border-white text-emerald-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0 pt-2 md:pt-0">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between md:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display text-[24px] md:text-[28px] font-bold text-gray-900 leading-tight">
                    {profile.name}
                  </h1>
                  {profile.badges?.length > 0 && profile.badges.map((badge) => (
                    <span key={badge} className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-100 text-[11px] font-medium text-gray-700">
                      <Star size={10} className="mr-0.5" />
                      {badge}
                    </span>
                  ))}
                </div>

                <p className="font-mono text-[13px] text-gray-500 mt-0.5">
                  {displayUsername}
                </p>

                {connectionLabel && (
                  <p className="font-sans text-[12px] text-gray-500 mt-0.5 font-medium">
                    {connectionLabel}
                  </p>
                )}

                {profile.bio && (
                  <p className="font-sans text-[14px] text-gray-600 mt-2 leading-relaxed max-w-2xl">
                    {profile.bio}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 mt-2">
                  {profile.department && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-[13px] font-medium text-gray-700">
                      {profile.department}
                    </span>
                  )}
                  {profile.semester && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-[13px] font-medium text-gray-700">
                      Semester {profile.semester}
                    </span>
                  )}
                  {profile.location && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-[13px] font-medium text-gray-700">
                      {profile.location}
                    </span>
                  )}
                  {profile.batch && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-[13px] font-medium text-gray-700">
                      Batch {profile.batch}
                    </span>
                  )}
                  {!isOwn && profile?.lastActive && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-[12px] font-medium text-gray-600">
                      <Activity size={10} className={isActiveNow ? 'text-emerald-500' : 'text-gray-400'} />
                      Active {timeAgo(profile.lastActive)}
                    </span>
                  )}
                </div>

                {profile.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {profile.skills.slice(0, 8).map((skill) => (
                      <span key={skill} className="font-mono text-[12px] font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                        {skill}
                      </span>
                    ))}
                    {profile.skills.length > 8 && (
                      <span className="font-mono text-[12px] font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                        +{profile.skills.length - 8}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-3 md:mt-0 shrink-0">
                {isOwn ? (
                  <button
                    onClick={() => navigate('/profile/edit')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-ink text-white rounded-full text-[14px] font-semibold hover:bg-primary-active transition-colors"
                  >
                    <Edit3 size={16} />
                    Edit Profile
                  </button>
                ) : (
                  <FriendActionButton
                    userId={profile._id}
                    friendStatus={profile.friendStatus}
                    onUpdate={(updates) => onUpdate?.({ ...profile, ...updates })}
                  />
                )}

                {!isOwn && (
                  <button
                    onClick={() => alert('Messages coming soon!')}
                    className="w-10 h-10 inline-flex items-center justify-center bg-gray-100 text-gray-700 rounded-full text-[14px] font-semibold hover:bg-gray-200 transition-colors"
                  >
                    <MessageCircle size={18} />
                  </button>
                )}

                <div className="relative group">
                  <button
                    className="w-10 h-10 inline-flex items-center justify-center bg-gray-100 text-gray-700 rounded-full text-[14px] font-semibold hover:bg-gray-200 transition-colors"
                  >
                    <Share2 size={18} />
                  </button>
                  <div className="absolute right-0 z-20 invisible w-40 mt-2 overflow-hidden transition-all border shadow-lg opacity-0 top-full bg-white border-hairline rounded-xl group-hover:opacity-100 group-hover:visible">
                    <button
                      onClick={handleCopyLink}
                      className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Copy Link
                    </button>
                    <button
                      onClick={openQr}
                      className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <QrCode size={14} /> Share QR Code
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 mt-4 text-[13px] text-gray-500">
              <div className="flex flex-col items-center">
                <span className="font-display font-bold text-[20px] text-gray-900">{totalPosts}</span>
                <span className="font-mono text-[10px] uppercase tracking-wider">Posts</span>
              </div>
              <div className="w-px h-6 bg-gray-300" />
              <div className="flex flex-col items-center">
                <span className="font-display font-bold text-[20px] text-gray-900">{profile.friends || 0}</span>
                <span className="font-mono text-[10px] uppercase tracking-wider">Friends</span>
              </div>
              <div className="w-px h-6 bg-gray-300" />
              <div className="flex flex-col items-center">
                <span className="font-display font-bold text-[20px] text-gray-900">{profile.photosCount || 0}</span>
                <span className="font-mono text-[10px] uppercase tracking-wider">Photos</span>
              </div>
              <div className="w-px h-6 bg-gray-300" />
              <div className="flex flex-col items-center">
                <span className="font-display font-bold text-[20px] text-gray-900">{profile.likesReceived || 0}</span>
                <span className="font-mono text-[10px] uppercase tracking-wider">Likes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {qrOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setQrOpen(false)}>
          <div className="w-full max-w-md overflow-hidden border shadow-2xl bg-white border-hairline rounded-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-hairline">
              <div>
                <h3 className="font-display text-[20px] font-bold text-gray-900">Share Profile</h3>
                <p className="font-sans text-[13px] text-gray-500">
                  Scan this QR code to open {profile?.name}'s profile.
                </p>
              </div>
              <button onClick={() => setQrOpen(false)} className="flex items-center justify-center w-8 h-8 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col items-center p-8">
              {qrLoading ? (
                <div className="w-[260px] h-[260px] flex items-center justify-center">
                  <div className="w-10 h-10 border-b-2 rounded-full animate-spin border-gray-500"></div>
                </div>
              ) : qrData ? (
                <div className="p-4 bg-white border shadow-sm rounded-xl border-hairline">
                  <QRCodeSVG
                    value={qrData.profileUrl}
                    size={240}
                    level="M"
                    includeMargin
                  />
                </div>
              ) : (
                <p className="text-gray-400 text-[14px]">Failed to load QR code.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
