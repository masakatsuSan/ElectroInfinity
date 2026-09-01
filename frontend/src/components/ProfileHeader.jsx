import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Share2, Edit3, X, QrCode } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { uploadCoverPhoto, uploadProfilePhoto, toggleFollow, getProfileQr } from '../api/profile'
import FollowButton from './FollowButton'
import { QRCodeSVG } from 'qrcode.react'

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
      <div className="relative w-full h-[260px] md:h-[340px] bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden">
        {profile.coverPhoto ? (
          <img src={profile.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#1863dc]/10 via-[#4c6ee6]/10 to-[#9b60aa]/10" />
        )}
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
        <div className="relative -mt-16 md:-mt-20 mb-4 flex flex-col md:flex-row items-start md:items-end gap-4 md:gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div
              onClick={() => isOwn && photoRef.current?.click()}
              className={`w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-canvas shadow-lg overflow-hidden bg-soft-stone ${
                isOwn ? 'cursor-pointer group' : ''
              }`}
            >
              {profile.photo ? (
                <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-ink/5">
                  <span className="text-4xl md:text-5xl font-display font-bold text-ink-muted-48">
                    {profile.name?.charAt(0)}
                  </span>
                </div>
              )}
              {isOwn && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <Camera size={24} className="text-white" />
                </div>
              )}
            </div>
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>

          {/* Name + Actions */}
          <div className="flex-1 min-w-0 pb-2">
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
              <div>
                <h1 className="font-display text-[28px] md:text-[36px] font-bold text-ink tracking-tight leading-tight">
                  {profile.name}
                </h1>
                <p className="font-mono text-[13px] md:text-[14px] text-slate mt-1">
                  {displayUsername}
                </p>
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
                <div className="relative group">
                  <button
                    className="inline-flex items-center gap-2 bg-white border border-hairline text-ink px-4 py-2 rounded-full text-[13px] font-semibold hover:bg-soft-stone/50 transition-colors shadow-sm"
                  >
                    <Share2 size={14} /> Share
                  </button>
                  <div className="absolute top-full left-0 mt-2 w-48 bg-canvas border border-divider-soft rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 overflow-hidden">
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
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[14px] text-ink-muted-80">
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
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="font-sans text-[15px] text-ink-muted-80 mt-3 leading-relaxed max-w-2xl">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-6 pb-6 border-b border-divider-soft">
          {[
            { label: 'Projects', value: stats.projects || 0 },
            { label: 'Forum Posts', value: stats.forumPosts || 0 },
            { label: 'Resources', value: stats.resources || 0 },
            { label: 'Followers', value: stats.followers || profile.followers || 0 },
            { label: 'Following', value: stats.following || profile.following || 0 },
            { label: 'Achievements', value: stats.achievements || 0 },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-[20px] font-bold text-ink">{stat.value}</p>
              <p className="font-mono text-[11px] uppercase tracking-wider text-ink-muted-48">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* QR Modal */}
      {qrOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setQrOpen(false)}>
          <div className="bg-canvas border border-divider-soft rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-divider-soft flex items-center justify-between">
              <div>
                <h3 className="font-display text-[22px] font-bold">Share Profile</h3>
                <p className="font-sans text-[13px] text-body-muted">
                  Scan this QR code to open {profile?.name}'s profile.
                </p>
              </div>
              <button onClick={() => setQrOpen(false)} className="w-8 h-8 rounded-full bg-soft-stone border border-hairline flex items-center justify-center hover:bg-soft-stone/80 transition-colors">
                <X size={14} />
              </button>
            </div>
            <div className="p-8 flex flex-col items-center">
              {qrLoading ? (
                <div className="w-[260px] h-[260px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ink"></div>
                </div>
              ) : qrData ? (
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-hairline">
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
              {qrData?.profileUrl && (
                <p className="font-mono text-[11px] text-slate mt-4 break-all text-center">
                  {qrData.profileUrl}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
