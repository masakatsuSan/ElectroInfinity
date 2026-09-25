import { useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Camera, Share2, Edit3, MessageCircle, Star, Activity, X } from 'lucide-react'
import { uploadCoverPhoto, uploadProfilePhoto, getProfileQr } from '../api/profile'
import FriendActionButton from './FriendActionButton'
import ShareProfileModal from './ShareProfileModal'
import ScrollReveal from '../components/ScrollReveal'

function timeAgo(date) {
  if (!date) return ''
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function ProfileHeader({
  profile,
  isOwn,
  onUpdate,
  stats = {},
  onStatClick,
  onMessageClick,
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
  const [messageOpen, setMessageOpen] = useState(false)

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

  const totalPosts = stats.posts ?? ((profile?.projects || 0) + (profile?.forumPosts || 0) + (profile?.resourcesUploaded || 0))

  return (
    <ScrollReveal variant="fadeUp">
      <div className="relative w-full overflow-hidden bg-white border-b border-hairline">
        <div className="relative h-[180px] sm:h-[220px] lg:h-[260px] bg-[#181d26]" view-transition-name="profile-cover">
          {profile.coverPhoto ? (
            <img src={profile.coverPhoto} alt="Cover" className="absolute inset-0 object-cover w-full h-full" />
          ) : (
            <div
              className="absolute inset-0 bg-center bg-cover"
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
              className="absolute z-10 flex items-center justify-center text-white transition-colors rounded-full shadow-sm right-4 top-4 h-9 w-9 bg-white/20 backdrop-blur-sm hover:bg-white/30 disabled:opacity-50"
            >
              <Camera size={18} />
            </button>
          )}
          <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
        </div>

        <div className="mx-auto max-w-[1440px] px-4 md:px-6 xl:px-10">
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:gap-8 -mt-14 sm:-mt-16 lg:-mt-20">
            <div className="relative z-10 flex-shrink-0">
              <div className={`relative h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-white p-0.5 shadow-xl sm:h-32 sm:w-32 lg:h-36 lg:w-36 ${isOwn ? 'cursor-pointer group' : ''}`} view-transition-name="profile-photo">
                {profile.photo ? (
                  <img src={profile.photo} alt={profile.name} className="object-cover w-full h-full rounded-full" />
                ) : (
                  <div className="flex items-center justify-center w-full h-full rounded-full bg-gradient-to-br from-gray-200 to-gray-300">
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
                <span className="absolute -bottom-1 -right-1 z-10 flex items-center gap-0.5 rounded-full border-2 border-white bg-white px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 shadow">
                  <span className="w-2 h-2 rounded-full animate-pulse bg-emerald-500" />
                </span>
              )}
            </div>

            <div className="w-full min-w-0 mt-5 lg:mt-0">
              <div className="p-5 bg-white border shadow-sm rounded-2xl border-hairline lg:p-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex-1 min-w-0">
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

                    <div className="flex flex-wrap gap-2 mt-4">
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
                        className="flex items-center justify-center w-10 h-10 text-gray-700 transition-colors bg-white border shadow-sm rounded-xl border-hairline hover:bg-gray-50"
                      >
                        <MessageCircle size={18} />
                      </button>
                    )}

                    <div className="relative group">
                      <button
                        onClick={onShare}
                        className="flex items-center justify-center w-10 h-10 text-gray-700 transition-colors bg-white border shadow-sm rounded-xl border-hairline hover:bg-gray-50"
                      >
                        <Share2 size={18} />
                      </button>
                      <div className="absolute right-0 z-20 w-40 mt-2 overflow-hidden transition-all bg-white border shadow-lg opacity-0 top-full rounded-xl border-hairline group-hover:visible group-hover:opacity-100">
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

                <div className="grid grid-cols-4 pt-4 mt-6 border-t divide-x divide-gray-200 border-hairline ">
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

        <ShareProfileModal
          open={qrOpen}
          onClose={() => setQrOpen(false)}
          profile={profile}
          username={displayUsername}
          qrData={qrData}
          qrLoading={qrLoading}
        />
      </div>
    </ScrollReveal>
  )
}
