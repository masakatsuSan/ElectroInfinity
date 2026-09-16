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
    <div className="relative w-full overflow-hidden border-b border-hairline bg-white">
      <div className="relative h-[180px] sm:h-[220px] lg:h-[260px] bg-[#181d26]">
        {profile.coverPhoto ? (
          <img src={profile.coverPhoto} alt="Cover" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'radial-gradient(circle at 18% 20%, rgba(255,255,255,0.10), transparent 28%), radial-gradient(circle at 82% 75%, rgba(122, 91, 248, 0.22), transparent 32%), linear-gradient(120deg, #181d26 0%, #252b38 52%, #11161d 100%)'
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-ink/50 via-ink/10 to-ink/30" />
        <div
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.7) 1px, transparent 0)',
            backgroundSize: '22px 22px'
          }}
        />

        {isOwn && (
          <button
            onClick={() => coverRef.current?.click()}
            disabled={coverLoading}
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-white/30 disabled:opacity-50"
          >
            <Camera size={18} />
          </button>
        )}
        <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
      </div>

      <div className="mx-auto max-w-[1440px] px-4 md:px-6 xl:px-10">
        <div className="relative flex flex-col lg:flex-row lg:items-end lg:gap-8 -mt-14 sm:-mt-16 lg:-mt-20">
          <div className="relative z-10 flex-shrink-0">
            <div className={`relative h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-white p-0.5 shadow-xl sm:h-32 sm:w-32 lg:h-36 lg:w-36 ${isOwn ? 'cursor-pointer group' : ''}`}>
              {profile.photo ? (
                <img src={profile.photo} alt={profile.name} className="h-full w-full rounded-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-gray-200 to-gray-300">
                  <span className="font-display text-4xl font-bold text-gray-600">
                    {profile.name?.charAt(0)}
                  </span>
                </div>
              )}
              {isOwn && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera size={22} className="text-white" />
                </div>
              )}
            </div>
            {isOwn && (
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            )}

            {isActiveNow && !isOwn && (
              <span className="absolute -bottom-1 -right-1 z-10 flex items-center gap-0.5 rounded-full border-2 border-white bg-white px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 shadow">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              </span>
            )}
          </div>

          <div className="mt-5 min-w-0 flex-1 lg:mt-0">
            <div className="rounded-2xl border border-hairline bg-white p-5 shadow-sm lg:p-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-display text-[24px] font-bold leading-tight text-gray-900 sm:text-[28px] lg:text-[30px]">
                      {profile.name}
                    </h1>
                    {profile.badges?.length > 0 && profile.badges.map((badge) => (
                      <span key={badge} className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-700">
                        <Star size={10} className="mr-0.5" />
                        {badge}
                      </span>
                    ))}
                  </div>

                  <p className="mt-1 font-mono text-[13px] text-gray-500">
                    {displayUsername}
                  </p>

                  {connectionLabel && (
                    <p className="mt-1 text-[12px] font-medium text-gray-500">
                      {connectionLabel}
                    </p>
                  )}

                  {profile.bio && (
                    <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-gray-600">
                      {profile.bio}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {profile.department && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-[13px] font-medium text-gray-700">
                        {profile.department}
                      </span>
                    )}
                    {profile.semester && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-[13px] font-medium text-gray-700">
                        Semester {profile.semester}
                      </span>
                    )}
                    {profile.location && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-[13px] font-medium text-gray-700">
                        {profile.location}
                      </span>
                    )}
                    {profile.batch && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-[13px] font-medium text-gray-700">
                        Batch {profile.batch}
                      </span>
                    )}
                    {!isOwn && profile?.lastActive && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-[12px] font-medium text-gray-600">
                        <Activity size={10} className={isActiveNow ? 'text-emerald-500' : 'text-gray-400'} />
                        Active {timeAgo(profile.lastActive)}
                      </span>
                    )}
                  </div>

                  {profile.skills?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {profile.skills.slice(0, 8).map((skill) => (
                        <span key={skill} className="rounded-full bg-gray-100 px-2.5 py-1 font-mono text-[12px] font-medium text-gray-700">
                          {skill}
                        </span>
                      ))}
                      {profile.skills.length > 8 && (
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 font-mono text-[12px] font-medium text-gray-500">
                          +{profile.skills.length - 8}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 xl:mt-0">
                  {isOwn ? (
                    <button
                      onClick={() => navigate('/profile/edit')}
                      className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-primary-active"
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
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-hairline bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                    >
                      <MessageCircle size={18} />
                    </button>
                  )}

                  <div className="relative group">
                    <button
                      onClick={onShare}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-hairline bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                    >
                      <Share2 size={18} />
                    </button>
                    <div className="absolute right-0 top-full z-20 mt-2 w-40 overflow-hidden rounded-xl border border-hairline bg-white opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
                      <button
                        onClick={handleCopyLink}
                        className="w-full px-4 py-2.5 text-left text-[13px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        Copy Link
                      </button>
                      <button
                        onClick={openQr}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        <QrCode size={14} /> Share QR Code
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-4 divide-x divide-gray-200 border-t border-hairline pt-4">
                <div className="flex flex-col items-center px-1">
                  <span className="font-display text-[20px] font-bold text-gray-900">{totalPosts}</span>
                  <span className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-gray-500">Posts</span>
                </div>
                <div className="flex flex-col items-center px-1">
                  <span className="font-display text-[20px] font-bold text-gray-900">{profile.friends || 0}</span>
                  <span className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-gray-500">Friends</span>
                </div>
                <div className="flex flex-col items-center px-1">
                  <span className="font-display text-[20px] font-bold text-gray-900">{profile.photosCount || 0}</span>
                  <span className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-gray-500">Photos</span>
                </div>
                <div className="flex flex-col items-center px-1">
                  <span className="font-display text-[20px] font-bold text-gray-900">{profile.likesReceived || 0}</span>
                  <span className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-gray-500">Likes</span>
                </div>
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
