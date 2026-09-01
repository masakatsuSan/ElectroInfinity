import { useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Share2, Edit3, X, QrCode, MessageCircle, Star, Activity } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { uploadCoverPhoto, uploadProfilePhoto, toggleFollow, getProfileQr } from '../api/profile'
import FollowButton from './FollowButton'
import { QRCodeSVG } from 'qrcode.react'

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
    if (!currentUser?._id || !profile?.followers?.length) return 0
    return profile.followers.filter(fid => currentUser.following?.some(cid => cid.toString() === fid.toString())).length
  }, [profile?.followers, currentUser?.following])

  const isActiveNow = useMemo(() => {
    if (!profile?.lastActive) return false
    return Date.now() - new Date(profile.lastActive).getTime() < 5 * 60 * 1000
  }, [profile?.lastActive])

  const connectionLabel = useMemo(() => {
    if (!currentUser?._id) return null
    if (profile?.isFollowing) return 'Following'
    if (mutualCount > 0) return `${mutualCount} mutual`
    return null
  }, [profile?.isFollowing, mutualCount, currentUser?._id])

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

  return (
    <div className="relative w-full">
      {/* Cover */}
      <div className="relative w-full h-[220px] md:h-[280px] bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden">
        {profile.coverPhoto ? (
          <img src={profile.coverPhoto} alt="Cover" className="object-cover w-full h-full" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#1863dc]/10 via-[#4c6ee6]/10 to-[#9b60aa]/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        {isOwn && (
          <button
            onClick={() => coverRef.current?.click()}
            disabled={coverLoading}
            className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white rounded-full p-2.5 backdrop-blur-sm transition-colors disabled:opacity-50"
          >
            <Camera size={18} />
          </button>
        )}
        <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
      </div>

      {/* Profile Picture + Info */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-12">
        <div className="relative flex flex-col items-start gap-5 mb-6 -mt-12 md:-mt-16 md:flex-row md:items-end md:gap-8">
          {/* Avatar with activity ring */}
          <div className="relative flex-shrink-0">
            {isActiveNow && !isOwn && (
              <span className="absolute -top-1 -right-1 z-10 flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                Active
              </span>
            )}
            <div
              className={`relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 ${
                isActiveNow && !isOwn
                  ? 'border-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.2)]'
                  : 'border-canvas'
              } shadow-lg overflow-hidden bg-soft-stone ${isOwn ? 'cursor-pointer group' : ''}`}
            >
              {profile.photo ? (
                <img src={profile.photo} alt={profile.name} className="object-cover w-full h-full" />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-ink/5">
                  <span className="text-4xl font-bold md:text-5xl font-display text-ink-muted-48">
                    {profile.name?.charAt(0)}
                  </span>
                </div>
              )}
              {isOwn && (
                <div className="absolute inset-0 flex items-center justify-center transition-opacity rounded-full opacity-0 bg-black/30 group-hover:opacity-100">
                  <Camera size={24} className="text-white" />
                </div>
              )}
            </div>
            {profile.status?.text && !isOwn && (
              <div className="mt-2 px-3 py-1.5 bg-canvas border border-divider-soft rounded-full shadow-sm max-w-[200px]">
                <p className="text-[12px] font-sans text-ink-muted-80 truncate italic">"{profile.status.text}"</p>
              </div>
            )}
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>

          {/* Name + Actions */}
            <div className="flex-1 min-w-0 pt-1">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
              <div>
                <h1 className="font-display text-[28px] md:text-[36px] font-bold text-ink tracking-tight leading-tight drop-shadow-sm">
                  {profile.name}
                </h1>
                <p className="font-mono text-[13px] md:text-[14px] text-slate mt-1 drop-shadow-sm">
                  {displayUsername}
                </p>
                {connectionLabel && (
                  <p className="font-sans text-[12px] text-ink-muted-80 mt-1 drop-shadow-sm">
                    {connectionLabel}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {isOwn ? (
                  <button
                    onClick={() => navigate('/profile/edit')}
                    className="inline-flex items-center gap-2 bg-ink text-canvas px-4 py-2 rounded-full text-[13px] font-semibold hover:bg-ink/90 transition-colors shadow-sm"
                  >
                    <Edit3 size={14} /> Edit Profile
                  </button>
                ) : (
                  <FollowButton
                    userId={profile._id}
                    isFollowing={profile.isFollowing}
                    followsMe={profile.followsMe}
                    onUpdate={(updates) => onUpdate?.({ ...profile, ...updates })}
                  />
                )}
                {!isOwn && (
                  <button
                    onClick={() => alert('Messages coming soon!')}
                    className="inline-flex items-center gap-2 bg-white border border-hairline text-ink px-4 py-2 rounded-full text-[13px] font-semibold hover:bg-soft-stone/50 transition-colors shadow-sm"
                  >
                    <MessageCircle size={14} /> Message
                  </button>
                )}
                <div className="relative group">
                  <button
                    className="inline-flex items-center gap-2 bg-white border border-hairline text-ink px-4 py-2 rounded-full text-[13px] font-semibold hover:bg-soft-stone/50 transition-colors shadow-sm"
                  >
                    <Share2 size={14} /> Share
                  </button>
                  <div className="absolute left-0 z-20 invisible w-48 mt-2 overflow-hidden transition-all border shadow-lg opacity-0 top-full bg-canvas border-divider-soft rounded-xl group-hover:opacity-100 group-hover:visible">
                    <button
                      onClick={handleCopyLink}
                      className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-ink hover:bg-soft-stone transition-colors"
                    >
                      Copy Link
                    </button>
                    <button
                      onClick={openQr}
                      className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-ink hover:bg-soft-stone transition-colors flex items-center gap-2"
                    >
                      <QrCode size={14} /> Share QR Code
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-[14px] text-ink-muted-80">
              {profile.department && (
                <span className="font-medium">{profile.department}</span>
              )}
              {profile.department && profile.semester && <span className="opacity-40">·</span>}
              {profile.semester && (
                <span>Semester {profile.semester}</span>
              )}
              {profile.location && (
                <>
                  <span className="opacity-40">·</span>
                  <span>{profile.location}</span>
                </>
              )}
              {!isOwn && profile?.lastActive && (
                <>
                  <span className="opacity-40">·</span>
                  <span className="flex items-center gap-1 text-[12px]">
                    <Activity size={12} className={isActiveNow ? 'text-emerald-500' : 'text-slate'} />
                    Active {timeAgo(profile.lastActive)}
                  </span>
                </>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="font-sans text-[15px] text-ink-muted-80 mt-3 leading-relaxed max-w-2xl">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

      </div>

      {/* QR Modal */}
      {qrOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setQrOpen(false)}>
          <div className="w-full max-w-md overflow-hidden border shadow-2xl bg-canvas border-divider-soft rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-divider-soft">
              <div>
                <h3 className="font-display text-[22px] font-bold">Share Profile</h3>
                <p className="font-sans text-[13px] text-body-muted">
                  Scan this QR code to open {profile?.name}'s profile.
                </p>
              </div>
              <button onClick={() => setQrOpen(false)} className="flex items-center justify-center w-8 h-8 transition-colors border rounded-full bg-soft-stone border-hairline hover:bg-soft-stone/80">
                <X size={14} />
              </button>
            </div>
            <div className="flex flex-col items-center p-8">
              {qrLoading ? (
                <div className="w-[260px] h-[260px] flex items-center justify-center">
                  <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-ink"></div>
                </div>
              ) : qrData ? (
                <div className="p-4 bg-white border shadow-sm rounded-2xl border-hairline">
                  <QRCodeSVG
                    value={qrData.profileUrl}
                    size={240}
                    level="M"
                    includeMargin
                  />
                </div>
              ) : (
                <p className="text-ink-muted-80 text-[14px]">Failed to load QR code.</p>
              )}
              {/* {qrData?.profileUrl && (
                <p className="font-mono text-[11px] text-slate mt-4 break-all text-center">
                  {qrData.profileUrl}
                </p>
              )} */}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
