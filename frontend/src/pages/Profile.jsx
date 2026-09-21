import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPublicProfile } from '../api/profile'
import { getProjects, createProject } from '../api/projects'
import { updateMyProfile, getSuggestedUsers, setStatus as setStatusApi, clearStatus as clearStatusApi, getProfileViews, recordProfileView } from '../api/profile'
import { getAchievements, createAchievement, updateAchievement, deleteAchievement } from '../api/achievements'
import { getGallery, createGalleryPhoto, updateGalleryPhoto, deleteGalleryPhoto } from '../api/gallery'
import { getAllStudents } from '../api/students'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import SEO from '../components/SEO'
import ProfileHeader from '../components/ProfileHeader'
import SocialLinkCard from '../components/SocialLinkCard'
import GalleryLightbox from '../components/GalleryLightbox'
import BatchMateCard from '../components/BatchMateCard'
import MyUploadsSection from '../components/MyUploadsSection'
import ProfileGrid from '../components/ProfileGrid'
import FriendActionButton from '../components/FriendActionButton'
import { ExternalLink, GitBranch, Users, Image as ImageIcon, Plus, Edit3, Save, X, Trophy, Sparkles, Eye, Search, Upload, Rocket, MessageCircle, Pin, User, Star } from 'lucide-react'

const TABS = ['posts', 'about', 'directory', 'uploads']

const socialPlatforms = [
  { key: 'github', label: 'GitHub' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'twitter', label: 'X (Twitter)' },
  { key: 'discord', label: 'Discord' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'website', label: 'Website' },
  { key: 'blog', label: 'Blog' },
]

export default function Profile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState(() => {
    const t = searchParams.get('tab')
    return TABS.includes(t) ? t : 'about'
  })
  const [profile, setProfile] = useState(null)
  const [lightboxImages, setLightboxImages] = useState([])
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const [editingAbout, setEditingAbout] = useState(false)
  const [aboutForm, setAboutForm] = useState({})
  const [editingSkills, setEditingSkills] = useState(false)
  const [skillsForm, setSkillsForm] = useState({})
  const [editingSocial, setEditingSocial] = useState(false)
  const [socialForm, setSocialForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [statusSaving, setStatusSaving] = useState(false)

  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showAchievementModal, setShowAchievementModal] = useState(false)
  const [showGalleryModal, setShowGalleryModal] = useState(false)
  const [editingGallery, setEditingGallery] = useState(null)
  const [dirSearch, setDirSearch] = useState('')
  const [dirBatch, setDirBatch] = useState('')
  const [editingAchievement, setEditingAchievement] = useState(null)

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => getPublicProfile(id).then((r) => r.data.data),
  })

  const { data: suggestedData } = useQuery({
    queryKey: ['suggestedUsers'],
    queryFn: () => getSuggestedUsers().then((r) => r.data.data),
    enabled: !!id && !!currentUser,
  })

  const { data: viewsData } = useQuery({
    queryKey: ['profileViews'],
    queryFn: () => getProfileViews().then((r) => r.data.data),
    enabled: !!currentUser && currentUser._id === id,
  })

  const { data: projectsData } = useQuery({
    queryKey: ['userProjects', id],
    queryFn: () => getProjects({ author: id, limit: 20 }).then((r) => r.data.data),
    enabled: activeTab === 'projects',
  })

  const { data: achievementsData } = useQuery({
    queryKey: ['myAchievements', id],
    queryFn: () => getAchievements({ author: id, limit: 20 }).then((r) => r.data.data),
    enabled: activeTab === 'achievements',
  })

  const { data: galleryData } = useQuery({
    queryKey: ['myGallery', id],
    queryFn: () => getGallery({ author: id, limit: 20 }).then((r) => r.data.data),
    enabled: activeTab === 'gallery' || activeTab === 'posts',
  })

  const { data: directoryData, isLoading: directoryLoading } = useQuery({
    queryKey: ['allStudentsForDirectory'],
    queryFn: () => getAllStudents().then((r) => r.data),
    enabled: activeTab === 'directory',
  })

  const { data: postsGalleryData } = useQuery({
    queryKey: ['postsGallery', id],
    queryFn: () => getGallery({ author: id, limit: 50 }).then((r) => r.data.data),
    enabled: activeTab === 'posts',
  })

  const { data: postsAchievementsData } = useQuery({
    queryKey: ['postsAchievements', id],
    queryFn: () => getAchievements({ author: id, limit: 50 }).then((r) => r.data.data),
    enabled: activeTab === 'posts',
  })

  const { data: postsProjectsData } = useQuery({
    queryKey: ['postsProjects', id],
    queryFn: () => getProjects({ author: id, limit: 50 }).then((r) => r.data.data),
    enabled: activeTab === 'posts',
  })

  useEffect(() => {
    if (profileData) {
      setProfile(profileData)
      setStatusText(profileData.status?.text || '')
    }
  }, [profileData])

  const isOwn = currentUser && currentUser._id === profile?._id

  useEffect(() => {
    if (profile && !isOwn && currentUser && profile._id !== currentUser._id) {
      recordProfileView(profile._id).catch(() => {})
    }
  }, [profile, isOwn, currentUser])

  const stats = {
    posts: (profile?.projects || 0) + (profile?.forumPosts || 0) + (profile?.resourcesUploaded || 0),
    projects: profile?.projects || 0,
    forumPosts: profile?.forumPosts || 0,
    resources: profile?.resourcesUploaded || 0,
    friends: profile?.friends || 0,
    photos: profile?.photosCount || 0,
    likes: profile?.likesReceived || 0,
    achievements: profile?.achievements || 0,
    profileViews: profile?.profileViews || 0,
  }

  const handleSetStatus = async () => {
    if (!statusText.trim()) return
    setStatusSaving(true)
    try {
      const res = await setStatusApi(statusText.trim())
      setProfile((p) => ({ ...p, status: { text: res.data.data.text, expiresAt: res.data.data.expiresAt } }))
      showToast('Status updated!')
    } catch (err) {
      console.error(err)
    } finally {
      setStatusSaving(false)
    }
  }

  const handleClearStatus = async () => {
    setStatusSaving(true)
    try {
      await clearStatusApi()
      setStatusText('')
      setProfile((p) => ({ ...p, status: { text: '', expiresAt: null } }))
    } catch (err) {
      console.error(err)
    } finally {
      setStatusSaving(false)
    }
  }

  const startEditAbout = () => {
    if (!profile) return
    setAboutForm({
      bio: profile.bio || '',
      department: profile.department || '',
      location: profile.location || '',
      batch: profile.batch || '',
      semester: profile.semester || '',
      collegeEmail: profile.collegeEmail || '',
      personalEmail: profile.personalEmail || '',
      phone: profile.phone || '',
    })
    setEditingAbout(true)
  }

  const startEditSkills = () => {
    if (!profile) return
    const safeJoin = (val) => (Array.isArray(val) ? val.join(', ') : '')
    setSkillsForm({
      skills: safeJoin(profile.skills),
      interests: safeJoin(profile.interests),
      languages: safeJoin(profile.languages),
    })
    setEditingSkills(true)
  }

  const startEditSocial = () => {
    if (!profile) return
    setSocialForm({ ...(profile.socialLinks || {}) })
    setEditingSocial(true)
  }

  const saveAbout = async () => {
    setSaving(true)
    try {
      await updateMyProfile({
        bio: aboutForm.bio,
        department: aboutForm.department,
        location: aboutForm.location,
        batch: aboutForm.batch,
        semester: aboutForm.semester ? Number(aboutForm.semester) : undefined,
        collegeEmail: aboutForm.collegeEmail,
        personalEmail: aboutForm.personalEmail,
        phone: aboutForm.phone,
      })
      setEditingAbout(false)
      qc.invalidateQueries({ queryKey: ['profile', id] })
      showToast('Profile updated successfully!')
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const saveSkills = async () => {
    setSaving(true)
    try {
      await updateMyProfile({
        skills: (skillsForm.skills || '').split(',').map((s) => s.trim()).filter(Boolean),
        interests: (skillsForm.interests || '').split(',').map((s) => s.trim()).filter(Boolean),
        languages: (skillsForm.languages || '').split(',').map((s) => s.trim()).filter(Boolean),
      })
      setEditingSkills(false)
      qc.invalidateQueries({ queryKey: ['profile', id] })
      showToast('Skills updated successfully!')
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const saveSocial = async () => {
    setSaving(true)
    try {
      await updateMyProfile({
        socialLinks: socialForm,
      })
      setEditingSocial(false)
      qc.invalidateQueries({ queryKey: ['profile', id] })
      showToast('Social links updated successfully!')
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: `${profile?.name} | Electro Infinity`, url })
      } catch {}
    } else {
      await navigator.clipboard.writeText(url)
      alert('Profile link copied to clipboard!')
    }
  }

  const saveAchievementMut = useMutation({
    mutationFn: createAchievement,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myAchievements', id] })
      qc.invalidateQueries({ queryKey: ['profile', id] })
      showToast('Achievement posted successfully!')
    },
  })

  const updateAchievementMut = useMutation({
    mutationFn: ({ id: aid, data }) => updateAchievement(aid, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myAchievements', id] })
      qc.invalidateQueries({ queryKey: ['profile', id] })
      setEditingAchievement(null)
    },
  })

  const deleteAchievementMut = useMutation({
    mutationFn: (achievementId) => deleteAchievement(achievementId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myAchievements', id] })
      qc.invalidateQueries({ queryKey: ['profile', id] })
    },
  })

  const createGalleryMut = useMutation({
    mutationFn: createGalleryPhoto,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myGallery', id] })
      qc.invalidateQueries({ queryKey: ['profile', id] })
      setShowGalleryModal(false)
      showToast('Photo uploaded successfully!')
    },
  })

  const updateGalleryMut = useMutation({
    mutationFn: ({ id: gid, data }) => updateGalleryPhoto(gid, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myGallery', id] })
      setEditingGallery(null)
    },
  })

  const deleteGalleryMut = useMutation({
    mutationFn: (photoId) => deleteGalleryPhoto(photoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myGallery', id] })
    },
  })

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-[1280px] mx-auto px-4 md:px-12">
          <div className="skeleton-shimmer">
            <div className="h-[170px] bg-gray-300 rounded-t-lg" />
            <div className="h-24 bg-gray-300 rounded-full -mt-10 mx-4" />
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <div className="text-center">
          <p className="font-sans text-[24px] font-medium text-gray-900 mb-2">Profile not found</p>
          <p className="font-sans text-[15px] text-gray-500 mb-6">
            The user you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-5 py-2.5 bg-[#181d26] text-white rounded-full font-semibold hover:bg-[#0d1218] transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  const suggested = suggestedData?.slice(0, 5) || []

  return (
    <div className="min-h-screen bg-gray-50 pt-16" style={{
      backgroundImage: 'radial-gradient(circle at 10% 10%, rgba(24,29,38,0.03) 0%, transparent 30%), radial-gradient(circle at 90% 80%, rgba(24,29,38,0.02) 0%, transparent 25%)'
    }}>
      <SEO
        title={`${profile.name} | Electro Infinity`}
        description={profile.bio || `Profile of ${profile.name} at Electro Infinity`}
      />

      <ProfileHeader
        profile={profile}
        isOwn={isOwn}
        onUpdate={setProfile}
        stats={stats}
        onShare={handleShare}
      />

      <div className="mx-auto w-full max-w-[1440px] px-4 pb-12 pt-5 md:px-6 xl:px-10">
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[240px_minmax(0,1fr)_300px]">
          {/* Left Sidebar */}
          <LeftSidebar
            profile={profile}
            isOwn={isOwn}
            id={id}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            socialPlatforms={socialPlatforms}
            startEditAbout={startEditAbout}
            startEditSkills={startEditSkills}
            startEditSocial={startEditSocial}
            editingAbout={editingAbout}
            editingSkills={editingSkills}
            editingSocial={editingSocial}
            aboutForm={aboutForm}
            setAboutForm={setAboutForm}
            skillsForm={skillsForm}
            setSkillsForm={setSkillsForm}
            socialForm={socialForm}
            setSocialForm={setSocialForm}
            saving={saving}
            saveAbout={saveAbout}
            saveSkills={saveSkills}
            saveSocial={saveSocial}
          />

          {/* Main Content */}
          <div className="min-w-0">
            <MainContent
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              searchParams={searchParams}
              setSearchParams={setSearchParams}
              id={id}
              isOwn={isOwn}
              profile={profile}
              postsGalleryData={postsGalleryData}
              postsAchievementsData={postsAchievementsData}
              postsProjectsData={postsProjectsData}
              projectsData={projectsData}
              achievementsData={achievementsData}
              galleryData={galleryData}
              directoryData={directoryData}
              directoryLoading={directoryLoading}
              dirSearch={dirSearch}
              dirBatch={dirBatch}
              setDirSearch={setDirSearch}
              setDirBatch={setDirBatch}
              currentUser={currentUser}
              navigate={navigate}
              showProjectModal={showProjectModal}
              setShowProjectModal={setShowProjectModal}
              showAchievementModal={showAchievementModal}
              setShowAchievementModal={setShowAchievementModal}
              showGalleryModal={showGalleryModal}
              setShowGalleryModal={setShowGalleryModal}
              editingGallery={editingGallery}
              setEditingGallery={setEditingGallery}
              editingAchievement={editingAchievement}
              setEditingAchievement={setEditingAchievement}
              createProject={createProject}
              saveAchievementMut={saveAchievementMut}
              updateAchievementMut={updateAchievementMut}
              deleteAchievementMut={deleteAchievementMut}
              createGalleryMut={createGalleryMut}
              updateGalleryMut={updateGalleryMut}
              deleteGalleryMut={deleteGalleryMut}
              saving={saving}
              editingSkills={editingSkills}
              setEditingSkills={setEditingSkills}
              skillsForm={skillsForm}
              setSkillsForm={setSkillsForm}
              saveSkills={saveSkills}
              startEditSkills={startEditSkills}
              editingSocial={editingSocial}
              setEditingSocial={setEditingSocial}
              socialForm={socialForm}
              setSocialForm={setSocialForm}
              saveSocial={saveSocial}
              startEditSocial={startEditSocial}
              socialPlatforms={socialPlatforms}
              editingAbout={editingAbout}
              setEditingAbout={setEditingAbout}
              aboutForm={aboutForm}
              setAboutForm={setAboutForm}
              startEditAbout={startEditAbout}
              saveAbout={saveAbout}
            />
          </div>

          {/* Right Sidebar */}
          <RightSidebar
            isOwn={isOwn}
            viewsData={viewsData}
            suggested={suggested}
            profile={profile}
            currentUser={currentUser}
            navigate={navigate}
          />
        </div>
      </div>

      {lightboxImages.length > 0 && (
        <GalleryLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxImages([])}
        />
      )}

      {showProjectModal && (
        <ProjectSubmitModal
          onClose={() => setShowProjectModal(false)}
          onSubmit={async (data) => {
            const res = await createProject(data)
            setShowProjectModal(false)
            qc.invalidateQueries({ queryKey: ['userProjects', id] })
            qc.invalidateQueries({ queryKey: ['profile', id] })
            showToast('Project uploaded successfully!')
            return res.data
          }}
        />
      )}

      {showAchievementModal && (
        <AchievementSubmitModal
          onClose={() => setShowAchievementModal(false)}
          onSubmit={async (data) => {
            await saveAchievementMut.mutateAsync(data)
          }}
          loading={saveAchievementMut.isPending}
        />
      )}

      {editingAchievement && (
        <AchievementEditModal
          achievement={editingAchievement}
          onClose={() => setEditingAchievement(null)}
          onSubmit={async (data) => {
            await updateAchievementMut.mutateAsync({ id: editingAchievement._id, data })
          }}
          loading={updateAchievementMut.isPending}
        />
      )}

      {showGalleryModal && (
        <GallerySubmitModal
          onClose={() => { setShowGalleryModal(false); setEditingGallery(null) }}
          onSubmit={async (data) => {
            await createGalleryMut.mutateAsync(data)
            qc.invalidateQueries({ queryKey: ['profile', id] })
          }}
          loading={createGalleryMut.isPending}
          initialData={editingGallery || undefined}
        />
      )}
    </div>
  )
}

function LeftSidebar({
  profile, isOwn, id, activeTab, setActiveTab, socialPlatforms,
  startEditAbout, startEditSkills, startEditSocial, editingAbout, editingSkills, editingSocial,
  aboutForm, setAboutForm, skillsForm, setSkillsForm, socialForm, setSocialForm, saving,
  saveAbout, saveSkills, saveSocial,
}) {
  return (
    <div className="hidden xl:block w-64 flex-shrink-0 xl:sticky xl:top-24 self-start">
      <div className="space-y-3">
        <div className="bg-white rounded-xl shadow border border-hairline overflow-hidden">
          <div className="p-4 border-b border-hairline">
            <h3 className="font-sans text-[14px] font-semibold text-gray-500 uppercase tracking-wider">
              Profile
            </h3>
          </div>
          <div className="p-2">
            <Link
              to={`/profile/${id}?tab=about`}
              onClick={() => setActiveTab('about')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors ${
                activeTab === 'about'
                  ? 'bg-[#181d26] text-white hover:text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <User size={16} />
              About
            </Link>
            <Link
              to={`/profile/${id}?tab=posts`}
              onClick={() => setActiveTab('posts')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors ${
                activeTab === 'posts'
                  ? 'bg-[#181d26] text-white hover:text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ImageIcon size={16} />
              Posts
            </Link>
            {isOwn && (
              <Link
                to={`/profile/${id}?tab=uploads`}
                onClick={() => setActiveTab('uploads')}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors ${
                  activeTab === 'uploads'
                    ? 'bg-[#181d26] text-white hover:text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Upload size={16} />
                My Uploads
              </Link>
            )}
            {isOwn && (
              <Link
                to={`/profile/${id}?tab=directory`}
                onClick={() => setActiveTab('directory')}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors ${
                  activeTab === 'directory'
                    ? 'bg-[#181d26] text-white hover:text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Users size={16} />
                Campus Directory
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function RightSidebar({ isOwn, viewsData, suggested, profile, currentUser, navigate }) {
  return (
    <div className="hidden lg:block w-80 flex-shrink-0 lg:sticky lg:top-24 self-start">
      <div className="space-y-4">
        {isOwn && viewsData?.length > 0 && (
          <div className="bg-white rounded-xl shadow border border-hairline p-4">
            <div className="flex items-center gap-2 mb-3">
              <Eye size={18} className="text-gray-600" />
              <h3 className="font-display text-[16px] font-bold text-gray-900">Recent Views</h3>
            </div>
            <div className="space-y-2">
              {viewsData.slice(0, 5).map((viewer) => (
                <Link
                  key={viewer._id}
                  to={`/profile/${viewer._id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {viewer.photo ? (
                      <img src={viewer.photo} alt={viewer.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-sans font-medium text-[14px] text-gray-500">
                        {viewer.name?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-[13px] font-medium text-gray-900 truncate">{viewer.name}</p>
                    <p className="font-mono text-[11px] text-gray-500">{viewer.profile?.department || viewer.role}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {!isOwn && suggested.length > 0 && (
          <div className="bg-white rounded-xl shadow border border-hairline p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-[#181d26]" />
              <h3 className="font-display text-[16px] font-bold text-gray-900">Suggested Friends</h3>
            </div>
            <div className="space-y-2">
              {suggested.map((user) => (
                <Link
                  key={user._id}
                  to={`/profile/${user._id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {user.photo ? (
                      <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-sans font-medium text-[16px] text-gray-500">
                        {user.name?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-[14px] font-medium text-gray-900 group-hover:text-[#181d26] transition-colors truncate">
                      {user.name}
                    </p>
                    <p className="font-mono text-[11px] text-gray-500">{user.department || user.role}</p>
                  </div>
                  <FriendActionButton
                    userId={user._id}
                    friendStatus={user.friendStatus || 'none'}
                    size="sm"
                    showIcon={false}
                  />
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow border border-hairline p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-[16px] font-bold text-gray-900">Community</h3>
            <Users size={18} className="text-gray-600" />
          </div>
          <div className="space-y-2 text-[14px]">
            <Link to="/forum" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
              <MessageCircle size={16} />
              Discussion Forum
            </Link>
            <Link to="/projects" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
              <Rocket size={16} />
              Projects
            </Link>
            <Link to="/announcements" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
              <Trophy size={16} />
              Announcements
            </Link>
            <Link to="/gallery" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
              <ImageIcon size={16} />
              Campus Gallery
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function MainContent({
  activeTab, setActiveTab, searchParams, setSearchParams, id, isOwn, profile,
  postsGalleryData, postsAchievementsData, postsProjectsData,
  projectsData, achievementsData, galleryData,
  directoryData, directoryLoading, dirSearch, dirBatch, setDirSearch, setDirBatch,
  currentUser, navigate,
  showProjectModal, setShowProjectModal,
  showAchievementModal, setShowAchievementModal,
  showGalleryModal, setShowGalleryModal,
  editingGallery, setEditingGallery,
  editingAchievement, setEditingAchievement,
  createProject, saveAchievementMut, updateAchievementMut, deleteAchievementMut,
  createGalleryMut, updateGalleryMut, deleteGalleryMut,
  saving,
  editingSkills, setEditingSkills, skillsForm, setSkillsForm, saveSkills, startEditSkills,
  editingSocial, setEditingSocial, socialForm, setSocialForm, saveSocial, startEditSocial,
  socialPlatforms,
  editingAbout, setEditingAbout, aboutForm, setAboutForm, startEditAbout, saveAbout,
}) {
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    const next = new URLSearchParams(searchParams)
    if (tab === 'about') next.delete('tab')
    else next.set('tab', tab)
    setSearchParams(next, { replace: true })
  }

  return (
    <div>
      <div className="mb-4 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="inline-flex gap-1 bg-white rounded-xl shadow border border-hairline p-1">
          {TABS.filter(tab => isOwn || (tab !== 'directory' && tab !== 'uploads')).map((tab) => (
            <motion.button
              key={tab}
              onClick={() => handleTabChange(tab)}
              whileTap={{ scale: 0.97 }}
              className={`font-sans text-[12px] sm:text-[13px] font-medium uppercase tracking-[0.04em] px-3 sm:px-5 py-2 rounded-lg transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-[#181d26] text-white shadow'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab === 'posts' ? 'Posts'
                : tab === 'about' ? 'About'
                : tab === 'directory' ? 'Campus Directory'
                : tab === 'projects' ? 'Projects'
                : tab === 'achievements' ? 'Achievements'
                : tab === 'uploads' ? 'My Uploads'
                : 'Gallery'}
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'about' && (
          <motion.div
            key="about"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <AboutSection
              profile={profile}
              isOwn={isOwn}
              editingAbout={editingAbout}
              setEditingAbout={setEditingAbout}
              aboutForm={aboutForm}
              setAboutForm={setAboutForm}
              saving={saving}
              startEditAbout={startEditAbout}
              saveAbout={saveAbout}
            />
            <SkillsSection
              profile={profile}
              isOwn={isOwn}
              editingSkills={editingSkills}
              setEditingSkills={setEditingSkills}
              skillsForm={skillsForm}
              setSkillsForm={setSkillsForm}
              saving={saving}
              saveSkills={saveSkills}
              startEditSkills={startEditSkills}
            />
            <SocialLinksSection
              profile={profile}
              isOwn={isOwn}
              editingSocial={editingSocial}
              setEditingSocial={setEditingSocial}
              socialForm={socialForm}
              setSocialForm={setSocialForm}
              saving={saving}
              saveSocial={saveSocial}
              startEditSocial={startEditSocial}
              socialPlatforms={socialPlatforms}
            />
            {profile.badges?.length > 0 && (
              <div className="bg-white rounded-xl shadow border border-hairline p-6">
                <h3 className="font-display text-[18px] font-bold text-gray-900 mb-4">Badges</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.badges.map((badge) => (
                    <span
                      key={badge}
                      className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-[12px] font-medium"
                    >
                      <Star size={12} className="mr-1" />
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'posts' && (
          <motion.div
            key="posts"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <PostsGrid
              gallery={postsGalleryData || []}
              achievements={postsAchievementsData || []}
              projects={postsProjectsData || []}
              isOwn={isOwn}
              onOpenGalleryModal={() => setShowGalleryModal(true)}
              onOpenAchievementModal={() => setShowAchievementModal(true)}
              onOpenProjectModal={() => setShowProjectModal(true)}
            />
          </motion.div>
        )}

        {activeTab === 'directory' && isOwn && (
          <motion.div
            key="directory"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <DirectoryPanel
              data={directoryData}
              loading={directoryLoading}
              search={dirSearch}
              setSearch={setDirSearch}
              batch={dirBatch}
              setBatch={setDirBatch}
              selfId={currentUser?._id}
              onOpenProfile={(uid) => navigate(`/profile/${uid}`)}
            />
          </motion.div>
        )}

        {activeTab === 'projects' && (
          <motion.div
            key="projects"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-[22px] font-bold text-gray-900">Projects</h2>
              {isOwn && (
                <button
                  onClick={() => setShowProjectModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#181d26] text-white rounded-full text-[14px] font-semibold hover:bg-[#0d1218] transition-colors shadow"
                >
                  <Plus size={16} />
                  Upload Your Project
                </button>
              )}
            </div>
            <ProjectsList projects={projectsData?.data || []} />
          </motion.div>
        )}

        {activeTab === 'achievements' && (
          <motion.div
            key="achievements"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-[22px] font-bold text-gray-900">Achievements</h2>
              {isOwn && (
                <button
                  onClick={() => setShowAchievementModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#181d26] text-white rounded-full text-[14px] font-semibold hover:bg-[#0d1218] transition-colors shadow"
                >
                  <Trophy size={16} />
                  Post Achievement
                </button>
              )}
            </div>
            <AchievementsList
              achievements={achievementsData || []}
              isOwn={isOwn}
              onEdit={(a) => setEditingAchievement(a)}
              onDelete={(aid) => deleteAchievementMut.mutate(aid)}
            />
          </motion.div>
        )}

        {activeTab === 'gallery' && (
          <motion.div
            key="gallery"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-[22px] font-bold text-gray-900">Gallery</h2>
              {isOwn && (
                <button
                  onClick={() => setShowGalleryModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#181d26] text-white rounded-full text-[14px] font-semibold hover:bg-[#0d1218] transition-colors shadow"
                >
                  <Plus size={16} />
                  Upload Photo
                </button>
              )}
            </div>
            {galleryData?.data?.length === 0 ? (
              <div className="py-16 text-center bg-white border border-hairline rounded-xl">
                <ImageIcon size={32} className="mx-auto text-gray-400 mb-3" />
                <p className="font-sans text-[15px] text-gray-500">No gallery images yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-2">
                {galleryData?.data?.map((img) => (
                  <motion.div
                    key={img._id}
                    whileTap={{ scale: 0.98 }}
                    className="group relative aspect-square bg-gray-200 cursor-pointer overflow-hidden border border-transparent hover:border-hairline transition-colors rounded-lg"
                  >
                    <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover" />
                    {isOwn && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => setEditingGallery(img)}
                          className="px-3 py-1.5 bg-white text-gray-900 text-[12px] font-medium rounded-md hover:bg-gray-100 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Remove this photo?')) deleteGalleryMut.mutate(img._id)
                          }}
                          className="px-3 py-1.5 bg-red-500 text-white text-[12px] font-medium rounded-md hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'uploads' && isOwn && (
          <motion.div
            key="uploads"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <MyUploadsSection enabled={isOwn} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ProjectsList({ projects }) {
  if (projects.length === 0) {
    return (
      <div className="py-16 text-center bg-white border border-hairline rounded-xl">
        <p className="font-sans text-[15px] text-gray-500">No projects yet.</p>
      </div>
    )
  }

  const pinned = projects.filter(p => p.pinned)
  const unpinned = projects.filter(p => !p.pinned)

  return (
    <div className="space-y-6">
      {pinned.length > 0 && (
        <div>
          <h3 className="font-mono text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-3">Pinned Projects</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pinned.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        </div>
      )}
      {unpinned.length > 0 && (
        <div>
          {pinned.length > 0 && (
            <h3 className="font-mono text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-3">All Projects</h3>
          )}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {unpinned.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ProjectCard({ project }) {
  return (
    <Link to={`/projects/${project._id}`} className="block h-full">
      <div className="border border-hairline bg-white rounded-xl overflow-hidden shadow hover:shadow-md transition-shadow flex flex-col h-full group">
        {project.thumbnail ? (
          <img src={project.thumbnail} alt={project.title} className="w-full h-36 object-cover" />
        ) : project.images?.[0] ? (
          <img src={project.images[0]} alt={project.title} className="w-full h-36 object-cover" />
        ) : (
          <div className="w-full h-36 bg-gray-200 flex items-center justify-center">
            <GitBranch size={28} className="text-gray-400" />
          </div>
        )}
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex-1">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="font-display text-[18px] font-bold text-gray-900 leading-snug">{project.title}</h3>
              {project.pinned && (
                <span className="shrink-0 font-mono text-[10px] font-medium uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#181d26]/10 text-[#181d26]">
                  <Pin size={10} className="mr-0.5" />
                  Pinned
                </span>
              )}
            </div>
            <p className="font-sans text-[14px] text-gray-600 leading-relaxed mb-4 line-clamp-3">{project.description}</p>
            {project.techStack?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {project.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="font-mono text-[11px] font-medium uppercase tracking-wider px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 border border-hairline"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-hairline">
            <div className="flex items-center gap-3">
              {project.githubLink && (
                <a
                  href={project.githubLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-500 hover:text-[#181d26] transition-colors"
                >
                  <GitBranch size={18} />
                </a>
              )}
              {project.demoLink && (
                <a
                  href={project.demoLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-500 hover:text-[#181d26] transition-colors"
                >
                  <ExternalLink size={18} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

function AchievementsList({ achievements, isOwn, onEdit, onDelete }) {
  if (achievements.length === 0) {
    return (
      <div className="py-16 text-center bg-white border border-hairline rounded-xl">
        <p className="font-sans text-[15px] text-gray-500">No achievements yet.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {achievements.map((achievement) => (
        <div
          key={achievement._id}
          className="border border-hairline bg-white rounded-xl overflow-hidden shadow hover:shadow-md transition-shadow"
        >
          {achievement.image && (
            <img src={achievement.image} alt={achievement.title} className="w-full h-40 object-cover" />
          )}
          <div className="p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-display text-[18px] font-bold text-gray-900">{achievement.title}</h3>
              {isOwn && (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => onEdit?.(achievement)}
                    className="font-sans text-[12px] font-medium text-[#181d26] hover:bg-gray-100 transition-colors px-2.5 py-1 rounded-md"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete?.(achievement._id)}
                    className="font-sans text-[12px] font-medium text-red-500/70 hover:text-red-500 transition-colors bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 rounded-md"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
            <p className="font-sans text-[14px] text-gray-600 mb-3">{achievement.description}</p>
            <div className="flex items-center justify-between">
              <p className="font-mono text-[12px] text-gray-500">
                {achievement.date ? new Date(achievement.date).toLocaleDateString() : ''}
              </p>
              {achievement.certificatePdf && (
                <a
                  href={achievement.certificatePdf}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[12px] font-medium text-[#181d26] hover:no-underline"
                >
                  View Certificate
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function PostsGrid({ gallery = [], achievements = [], projects = [], isOwn, onOpenGalleryModal, onOpenAchievementModal, onOpenProjectModal }) {
  const combined = useMemo(() => {
    const items = [
      ...gallery.map((g) => ({
        _id: g._id,
        kind: 'gallery',
        title: g.title || 'Untitled',
        thumb: g.imageUrl,
        imageUrl: g.imageUrl,
        date: g.date || g.createdAt,
        createdAt: g.createdAt,
        category: g.category,
      })),
      ...achievements.map((a) => ({
        _id: a._id,
        kind: 'achievement',
        title: a.title || 'Untitled Achievement',
        thumb: a.image,
        imageUrl: a.image,
        date: a.date || a.createdAt,
        createdAt: a.createdAt,
        certificatePdf: a.certificatePdf,
        meta: { description: a.description },
      })),
      ...projects.map((p) => ({
        _id: p._id,
        kind: 'project',
        title: p.title || 'Untitled Project',
        thumb: p.thumbnail || (p.images && p.images[0]),
        imageUrl: p.thumbnail || (p.images && p.images[0]),
        date: p.createdAt,
        createdAt: p.createdAt,
        meta: { description: p.description, techStack: p.techStack, githubLink: p.githubLink, demoLink: p.demoLink },
      })),
    ]
    return items.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
  }, [gallery, achievements, projects])

  return (
    <div>
      {isOwn && (
        <div className="bg-white rounded-xl shadow border border-hairline p-4 mb-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={onOpenGalleryModal}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#181d26] text-white rounded-lg text-[14px] font-semibold hover:bg-[#0d1218] transition-colors"
            >
              <ImageIcon size={16} />
              Upload Photo
            </button>
            <button
              onClick={onOpenAchievementModal}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#181d26] text-white rounded-lg text-[14px] font-semibold hover:bg-[#0d1218] transition-colors"
            >
              <Trophy size={16} />
              Post Achievement
            </button>
            <button
              onClick={onOpenProjectModal}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#181d26] text-white rounded-lg text-[14px] font-semibold hover:bg-[#0d1218] transition-colors"
            >
              <GitBranch size={16} />
              Upload Project
            </button>
          </div>
        </div>
      )}
      <ProfileGrid items={combined} isOwn={isOwn} />
    </div>
  )
}

function AboutSection({ profile, isOwn, editingAbout, setEditingAbout, aboutForm, setAboutForm, saving, startEditAbout, saveAbout }) {
  return (
    <div className="bg-white rounded-xl shadow border border-hairline p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-[20px] font-bold text-gray-900">About</h2>
        {isOwn && !editingAbout && (
          <button
            onClick={startEditAbout}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#181d26] hover:no-underline"
          >
            <Edit3 size={14} /> Edit
          </button>
        )}
      </div>

      {editingAbout ? (
        <div className="space-y-4">
          <div>
            <label className="block font-sans text-[13px] font-medium text-gray-500 mb-1.5">Bio</label>
            <textarea
              value={aboutForm.bio}
              onChange={(e) => setAboutForm((f) => ({ ...f, bio: e.target.value }))}
              rows={4}
              className="w-full bg-gray-50 border border-hairline rounded-lg px-3 py-2 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#181d26]"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-sans text-[13px] font-medium text-gray-500 mb-1.5">Department</label>
              <input value={aboutForm.department} onChange={(e) => setAboutForm((f) => ({ ...f, department: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="block font-sans text-[13px] font-medium text-gray-500 mb-1.5">Location</label>
              <input value={aboutForm.location} onChange={(e) => setAboutForm((f) => ({ ...f, location: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="block font-sans text-[13px] font-medium text-gray-500 mb-1.5">Batch</label>
              <input value={aboutForm.batch} onChange={(e) => setAboutForm((f) => ({ ...f, batch: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="block font-sans text-[13px] font-medium text-gray-500 mb-1.5">Semester</label>
              <input type="number" value={aboutForm.semester} onChange={(e) => setAboutForm((f) => ({ ...f, semester: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="block font-sans text-[13px] font-medium text-gray-500 mb-1.5">College Email</label>
              <input value={aboutForm.collegeEmail} onChange={(e) => setAboutForm((f) => ({ ...f, collegeEmail: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="block font-sans text-[13px] font-medium text-gray-500 mb-1.5">Personal Email</label>
              <input value={aboutForm.personalEmail} onChange={(e) => setAboutForm((f) => ({ ...f, personalEmail: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="block font-sans text-[13px] font-medium text-gray-500 mb-1.5">Phone</label>
              <input value={aboutForm.phone} onChange={(e) => setAboutForm((f) => ({ ...f, phone: e.target.value }))} className="input" />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button onClick={saveAbout} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#181d26] text-white rounded-full text-[13px] font-medium hover:bg-[#0d1218] transition-colors disabled:opacity-50">
              <Save size={14} /> {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setEditingAbout(false)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-full text-[13px] font-medium hover:bg-gray-200 transition-colors">
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: 'Department', value: profile.department },
              { label: 'Semester', value: profile.semester },
              { label: 'Location', value: profile.location },
              { label: 'Batch', value: profile.batch },
            ].map((item) => (
              <div key={item.label} className="p-4 bg-gray-50 rounded-lg border border-hairline">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 mb-1">{item.label}</p>
                <p className="font-display text-[15px] font-semibold text-gray-900">{item.value || '—'}</p>
              </div>
            ))}
          </div>

          {(profile.collegeEmail || profile.personalEmail || profile.phone) && (
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 mb-3">Contact Information</p>
              <div className="space-y-2.5">
                {profile.collegeEmail && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-hairline">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 mb-0.5">College Email</p>
                      <p className="font-sans text-[14px] text-gray-700 break-all">{profile.collegeEmail}</p>
                    </div>
                  </div>
                )}
                {profile.personalEmail && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-hairline">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 mb-0.5">Personal Email</p>
                      <p className="font-sans text-[14px] text-gray-700 break-all">{profile.personalEmail}</p>
                    </div>
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-hairline">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 mb-0.5">Phone</p>
                      <p className="font-sans text-[14px] text-gray-700">{profile.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SkillsSection({ profile, isOwn, editingSkills, setEditingSkills, skillsForm, setSkillsForm, saving, saveSkills, startEditSkills }) {
  return (
    <div className="bg-white rounded-xl shadow border border-hairline p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-[18px] font-bold text-gray-900">Skills</h3>
        {isOwn && !editingSkills && (
          <button
            onClick={startEditSkills}
            className="text-[12px] font-medium text-[#181d26] hover:no-underline inline-flex items-center gap-1"
          >
            <Edit3 size={12} /> Edit
          </button>
        )}
      </div>
      {editingSkills ? (
        <div className="space-y-3">
          <input value={skillsForm.skills} onChange={(e) => setSkillsForm((f) => ({ ...f, skills: e.target.value }))} className="input" placeholder="React, Python, Flutter..." />
          <input value={skillsForm.interests} onChange={(e) => setSkillsForm((f) => ({ ...f, interests: e.target.value }))} className="input" placeholder="Machine Learning, Robotics..." />
          <input value={skillsForm.languages} onChange={(e) => setSkillsForm((f) => ({ ...f, languages: e.target.value }))} className="input" placeholder="English, Hindi, Bengali..." />
          <div className="flex items-center gap-3">
            <button onClick={saveSkills} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#181d26] text-white rounded-full text-[13px] font-medium hover:bg-[#0d1218] transition-colors disabled:opacity-50">
              <Save size={14} /> {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setEditingSkills(false)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-full text-[13px] font-medium hover:bg-gray-200 transition-colors">
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {profile.skills?.length > 0 && (
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 mb-2.5">Skills</p>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span key={skill} className="font-mono text-[12px] font-medium px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 border border-hairline">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          {profile.interests?.length > 0 && (
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 mb-2.5">Interests</p>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <span key={interest} className="font-mono text-[12px] font-medium px-3 py-1.5 rounded-full bg-gray-100 text-[#181d26] border border-hairline">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
          {profile.languages?.length > 0 && (
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 mb-2.5">Languages</p>
              <div className="flex flex-wrap gap-2">
                {profile.languages.map((lang) => (
                  <span key={lang} className="font-mono text-[12px] font-medium px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-100">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SocialLinksSection({ profile, isOwn, editingSocial, setEditingSocial, socialForm, setSocialForm, saving, saveSocial, socialPlatforms, startEditSocial }) {
  return (
    <div className="bg-white rounded-xl shadow border border-hairline p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-[18px] font-bold text-gray-900">Social Links</h3>
        {isOwn && !editingSocial && (
          <button
            onClick={startEditSocial}
            className="text-[12px] font-medium text-[#181d26] hover:no-underline inline-flex items-center gap-1"
          >
            <Edit3 size={12} /> Edit
          </button>
        )}
      </div>
      {editingSocial ? (
        <div className="space-y-3">
          {socialPlatforms.map((platform) => (
            <div key={platform.key}>
              <label className="block font-sans text-[12px] font-medium text-gray-500 mb-1">{platform.label}</label>
              <input
                value={socialForm[platform.key] || ''}
                onChange={(e) => setSocialForm((f) => ({ ...f, [platform.key]: e.target.value }))}
                className="input"
                placeholder={`https://${platform.key}.com/username`}
              />
            </div>
          ))}
          <div className="flex items-center gap-3 pt-2">
            <button onClick={saveSocial} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#181d26] text-white rounded-full text-[13px] font-medium hover:bg-[#0d1218] transition-colors disabled:opacity-50">
              <Save size={14} /> {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setEditingSocial(false)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-full text-[13px] font-medium hover:bg-gray-200 transition-colors">
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {socialPlatforms
            .filter((p) => profile.socialLinks?.[p.key])
            .map((p) => (
              <SocialLinkCard
                key={p.key}
                platform={p.key}
                username={profile.socialLinks[p.key]}
                url={profile.socialLinks[p.key]}
              />
            ))}
        </div>
      )}
    </div>
  )
}

function DirectoryPanel({ data, loading, search, setSearch, batch, setBatch, selfId, onOpenProfile }) {
  const students = (data?.data || []).filter((s) => s._id !== selfId)
  const batches = Array.from(new Set(students.map((s) => s.batch).filter(Boolean))).sort((a, b) => String(b).localeCompare(String(a)))
  const q = search.trim().toLowerCase()
  const filtered = students.filter((s) => {
    const matchSearch = !q || s.name?.toLowerCase().includes(q) || s.rollNumber?.toLowerCase().includes(q)
    const matchBatch = !batch || s.batch === batch
    return matchSearch && matchBatch
  })

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-gray-500">Campus Directory</p>
          <h2 className="font-display text-[28px] font-bold text-gray-900">Students &amp; CRs</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-sans text-[13px] text-gray-500">{filtered.length + 1} people</span>
          <select
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            className="bg-white border border-hairline rounded-lg px-3 py-2 text-[13px] font-sans text-gray-700 focus:outline-none focus:border-[#181d26]/40 transition-colors"
          >
            <option value="">All Batches</option>
            {batches.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or roll..."
              className="w-full md:w-64 bg-white border border-hairline rounded-lg pl-9 pr-4 py-2 text-[14px] font-sans text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#181d26]/40 transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border border-hairline">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-5 border border-hairline rounded-xl bg-white skeleton-shimmer">
                <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gray-200" />
                <div className="h-3 mx-auto mb-2 rounded bg-gray-200 w-28" />
                <div className="h-2 mx-auto rounded bg-gray-200 w-16" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-sans text-[15px] text-gray-500">
              {search || batch ? 'No students match your filters.' : 'No other students have joined yet.'}
            </p>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((mate) => (
              <BatchMateCard key={mate._id} mate={mate} onClick={() => onOpenProfile(mate._id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ProjectSubmitModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    techStack: '',
    githubLink: '',
    demoLink: '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    setErrors((errs) => ({ ...errs, [k]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    if (!form.description.trim()) errs.description = 'Description is required'
    if (!form.techStack.trim()) errs.techStack = 'Add at least one technology'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      await onSubmit({
        title: form.title.trim(),
        description: form.description.trim(),
        techStack: form.techStack.split(',').map((t) => t.trim()).filter(Boolean),
        githubLink: form.githubLink.trim() || undefined,
        demoLink: form.demoLink.trim() || undefined,
      })
    } catch (err) {
      console.error(err)
      alert('Failed to submit project')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white text-gray-900 border border-hairline rounded-xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-hairline flex items-center justify-between">
          <div>
            <h3 className="font-display text-[22px] font-bold">Submit Project</h3>
            <p className="font-sans text-[13px] text-gray-500">Share your project with the department community.</p>
          </div>
          <button onClick={onClose} className="flex items-center justify-center w-8 h-8 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1">
          <div>
            <label className="block font-sans text-[13px] font-medium text-gray-500 mb-1.5">Project Title *</label>
            <input required value={form.title} onChange={set('title')} placeholder="e.g. Solar-Powered IoT Weather Station" className="input" />
            {errors.title && <p className="text-red-500 text-[12px] mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block font-sans text-[13px] font-medium text-gray-500 mb-1.5">Description *</label>
            <textarea required value={form.description} onChange={set('description')} placeholder="What does your project do?" rows={4} className="input resize-none" />
            {errors.description && <p className="text-red-500 text-[12px] mt-1">{errors.description}</p>}
          </div>

          <div>
            <label className="block font-sans text-[13px] font-medium text-gray-500 mb-1.5">Tech Stack *</label>
            <input required value={form.techStack} onChange={set('techStack')} placeholder="e.g. React, Node.js, Arduino" className="input" />
            <p className="font-sans text-[11px] text-gray-400 mt-1">Separate technologies with commas.</p>
            {errors.techStack && <p className="text-red-500 text-[12px] mt-1">{errors.techStack}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-sans text-[13px] font-medium text-gray-500 mb-1.5">GitHub Link</label>
              <input type="url" value={form.githubLink} onChange={set('githubLink')} placeholder="https://github.com/username/repo" className="input" />
            </div>
            <div>
              <label className="block font-sans text-[13px] font-medium text-gray-500 mb-1.5">Demo Link</label>
              <input type="url" value={form.demoLink} onChange={set('demoLink')} placeholder="https://your-demo.vercel.app" className="input" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-full text-[14px] font-medium text-gray-500 hover:bg-gray-100 transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="button-primary !py-2 !px-6 !text-[14px]">
              {submitting ? 'Submitting…' : 'Submit Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AchievementSubmitModal({ onClose, onSubmit, loading }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    category: 'student',
    image: null,
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState('')
  const fileRef = useRef(null)

  const set = (k) => (e) => {
    const value = e.target.type === 'file' ? e.target.files?.[0] : e.target.value
    setForm((f) => ({ ...f, [k]: value }))
    setErrors((errs) => ({ ...errs, [k]: '' }))
    if (k === 'image' && value) {
      setImagePreview(URL.createObjectURL(value))
    }
  }

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    if (!form.description.trim()) errs.description = 'Description is required'
    if (!form.date) errs.date = 'Date is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const data = new FormData()
      data.append('title', form.title.trim())
      data.append('description', form.description.trim())
      data.append('date', form.date)
      data.append('category', form.category)
      if (form.image) {
        data.append('image', form.image)
      }
      await onSubmit(data)
    } catch (err) {
      console.error(err)
      alert('Failed to post achievement')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white text-gray-900 border border-hairline rounded-xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-hairline flex items-center justify-between">
          <div>
            <h3 className="font-display text-[22px] font-bold">Post Achievement</h3>
            <p className="font-sans text-[13px] text-gray-500">Share your achievement with the department.</p>
          </div>
          <button onClick={onClose} className="flex items-center justify-center w-8 h-8 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1">
          <div>
            <label className="block font-sans text-[13px] font-medium text-gray-500 mb-1.5">Title *</label>
            <input required value={form.title} onChange={set('title')} placeholder="e.g. Won First Place at Hackathon" className="input" />
            {errors.title && <p className="text-red-500 text-[12px] mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block font-sans text-[13px] font-medium text-gray-500 mb-1.5">Description *</label>
            <textarea required value={form.description} onChange={set('description')} placeholder="Describe your achievement..." rows={4} className="input resize-none" />
            {errors.description && <p className="text-red-500 text-[12px] mt-1">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-sans text-[13px] font-medium text-gray-500 mb-1.5">Date *</label>
              <input type="date" required value={form.date} onChange={set('date')} className="input" />
              {errors.date && <p className="text-red-500 text-[12px] mt-1">{errors.date}</p>}
            </div>
            <div>
              <label className="block font-sans text-[13px] font-medium text-gray-500 mb-1.5">Category</label>
              <select value={form.category} onChange={set('category')} className="input">
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="awards">Award</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-sans text-[13px] font-medium text-gray-500 mb-1.5">Image (optional)</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={set('image')} className="hidden" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 border border-hairline rounded-lg text-[13px] font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Choose Image
            </button>
            {imagePreview && <img src={imagePreview} alt="Preview" className="mt-3 w-full h-48 object-cover rounded-lg" />}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-full text-[14px] font-medium text-gray-500 hover:bg-gray-100 transition-colors">Cancel</button>
            <button type="submit" disabled={submitting || loading} className="button-primary !py-2 !px-6 !text-[14px]">
              {submitting || loading ? 'Posting…' : 'Post Achievement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AchievementEditModal({ achievement, onClose, onSubmit, loading }) {
  const [form, setForm] = useState({
    title: achievement?.title || '',
    description: achievement?.description || '',
    date: achievement?.date ? new Date(achievement.date).toISOString().slice(0, 16) : '',
    category: achievement?.category || 'student',
    image: null,
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState(achievement?.image || '')
  const fileRef = useRef(null)

  const set = (k) => (e) => {
    const value = e.target.type === 'file' ? e.target.files?.[0] : e.target.value
    setForm((f) => ({ ...f, [k]: value }))
    setErrors((errs) => ({ ...errs, [k]: '' }))
    if (k === 'image' && value) {
      setImagePreview(URL.createObjectURL(value))
    }
  }

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    if (!form.description.trim()) errs.description = 'Description is required'
    if (!form.date) errs.date = 'Date is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const data = new FormData()
      data.append('title', form.title.trim())
      data.append('description', form.description.trim())
      data.append('date', form.date)
      data.append('category', form.category)
      if (form.image) {
        data.append('image', form.image)
      }
      await onSubmit(data)
    } catch (err) {
      console.error(err)
      alert('Failed to update achievement')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white text-gray-900 border border-hairline rounded-xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-hairline flex items-center justify-between">
          <div>
            <h3 className="font-display text-[22px] font-bold">Edit Achievement</h3>
            <p className="font-sans text-[13px] text-gray-500">Update your achievement details.</p>
          </div>
          <button onClick={onClose} className="flex items-center justify-center w-8 h-8 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1">
          <div>
            <label className="block font-sans text-[13px] font-medium text-gray-500 mb-1.5">Title *</label>
            <input required value={form.title} onChange={set('title')} placeholder="e.g. Won First Place at Hackathon" className="input" />
            {errors.title && <p className="text-red-500 text-[12px] mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block font-sans text-[13px] font-medium text-gray-500 mb-1.5">Description *</label>
            <textarea required value={form.description} onChange={set('description')} placeholder="Describe your achievement..." rows={4} className="input resize-none" />
            {errors.description && <p className="text-red-500 text-[12px] mt-1">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-sans text-[13px] font-medium text-gray-500 mb-1.5">Date *</label>
              <input type="datetime-local" required value={form.date} onChange={set('date')} className="input" />
              {errors.date && <p className="text-red-500 text-[12px] mt-1">{errors.date}</p>}
            </div>
            <div>
              <label className="block font-sans text-[13px] font-medium text-gray-500 mb-1.5">Category</label>
              <select value={form.category} onChange={set('category')} className="input">
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="awards">Award</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-sans text-[13px] font-medium text-gray-500 mb-1.5">Image (optional - upload new to replace)</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={set('image')} className="hidden" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 border border-hairline rounded-lg text-[13px] font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Choose Image
            </button>
            {imagePreview && <img src={imagePreview} alt="Preview" className="mt-3 w-full h-48 object-cover rounded-lg" />}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-full text-[14px] font-medium text-gray-500 hover:bg-gray-100 transition-colors">Cancel</button>
            <button type="submit" disabled={submitting || loading} className="button-primary !py-2 !px-6 !text-[14px]">
              {submitting || loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function GallerySubmitModal({ onClose, onSubmit, loading, initialData }) {
  const isEdit = !!initialData
  const [form, setForm] = useState({
    title: initialData?.title || '',
    category: initialData?.category || 'campus',
    date: initialData?.date ? new Date(initialData.date).toISOString().slice(0, 16) : '',
    image: null,
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState(initialData?.imageUrl || '')
  const fileRef = useRef(null)

  const set = (k) => (e) => {
    const value = e.target.type === 'file' ? e.target.files?.[0] : e.target.value
    setForm((f) => ({ ...f, [k]: value }))
    setErrors((errs) => ({ ...errs, [k]: '' }))
    if (k === 'image' && value) {
      setImagePreview(URL.createObjectURL(value))
    }
  }

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const data = new FormData()
      data.append('title', form.title.trim())
      data.append('category', form.category)
      if (form.date) data.append('date', form.date)
      if (form.image) data.append('image', form.image)
      await onSubmit(data)
    } catch (err) {
      console.error(err)
      alert('Failed to upload photo')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white text-gray-900 border border-hairline rounded-xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-hairline flex items-center justify-between">
          <div>
            <h3 className="font-display text-[22px] font-bold">{isEdit ? 'Edit Photo' : 'Upload Photo'}</h3>
            <p className="font-sans text-[13px] text-gray-500">
              {isEdit ? 'Update your gallery photo details.' : 'Share a moment with the department. Photos require admin approval.'}
            </p>
          </div>
          <button onClick={onClose} className="flex items-center justify-center w-8 h-8 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1">
          <div>
            <label className="block font-sans text-[13px] font-medium text-gray-500 mb-1.5">Title *</label>
            <input required value={form.title} onChange={set('title')} placeholder="e.g. Lab Workshop 2024" className="input" />
            {errors.title && <p className="text-red-500 text-[12px] mt-1">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-sans text-[13px] font-medium text-gray-500 mb-1.5">Category</label>
              <select value={form.category} onChange={set('category')} className="input">
                <option value="campus">Campus</option>
                <option value="event">Event</option>
                <option value="lab">Lab</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block font-sans text-[13px] font-medium text-gray-500 mb-1.5">Date</label>
              <input type="datetime-local" value={form.date} onChange={set('date')} className="input" />
            </div>
          </div>

          <div>
            <label className="block font-sans text-[13px] font-medium text-gray-500 mb-1.5">Image</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={set('image')} className="hidden" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 border border-hairline rounded-lg text-[13px] font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Choose Image
            </button>
            {imagePreview && <img src={imagePreview} alt="Preview" className="mt-3 w-full h-48 object-cover rounded-lg" />}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-full text-[14px] font-medium text-gray-500 hover:bg-gray-100 transition-colors">Cancel</button>
            <button type="submit" disabled={submitting || loading} className="button-primary !py-2 !px-6 !text-[14px]">
              {submitting || loading ? (isEdit ? 'Saving…' : 'Uploading…') : (isEdit ? 'Save Changes' : 'Upload Photo')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

