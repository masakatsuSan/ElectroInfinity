import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPublicProfile } from '../api/profile'
import { getProjects, createProject } from '../api/projects'
import { updateMyProfile, getSuggestedUsers, setStatus as setStatusApi, clearStatus as clearStatusApi, getProfileViews } from '../api/profile'
import { getAchievements, createAchievement, updateAchievement, deleteAchievement } from '../api/achievements'
import { getGallery, createGalleryPhoto, updateGalleryPhoto, deleteGalleryPhoto } from '../api/gallery'
import { useAuth } from '../context/AuthContext'
import SEO from '../components/SEO'
import ProfileHeader from '../components/ProfileHeader'
import SocialLinkCard from '../components/SocialLinkCard'
import GalleryLightbox from '../components/GalleryLightbox'
import { ExternalLink, GitBranch, Users, Image as ImageIcon, Plus, Edit3, Save, X, Trophy, Sparkles, Eye, TrendingUp } from 'lucide-react'

const TABS = ['about', 'projects', 'achievements', 'gallery']

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
  const { user: currentUser } = useAuth()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('about')
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
    enabled: activeTab === 'gallery',
  })

  useEffect(() => {
    if (profileData) {
      setProfile(profileData)
      setStatusText(profileData.status || '')
    }
  }, [profileData])

  const stats = {
    projects: profile?.projects || 0,
    forumPosts: profile?.forumPosts || 0,
    resources: profile?.resourcesUploaded || 0,
    followers: profile?.followers || 0,
    following: profile?.following || 0,
    achievements: profile?.achievements || 0,
    profileViews: profile?.profileViews || 0,
  }

  const isOwn = currentUser && currentUser._id === profile?._id

  const handleSetStatus = async () => {
    if (!statusText.trim()) return
    setStatusSaving(true)
    try {
      const res = await setStatusApi(statusText.trim())
      setProfile((p) => ({ ...p, status: res.data.data.text }))
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
      setProfile((p) => ({ ...p, status: '' }))
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
    setSkillsForm({
      skills: (profile.skills || []).join(', '),
      interests: (profile.interests || []).join(', '),
      languages: (profile.languages || []).join(', '),
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
        skills: skillsForm.skills.split(',').map((s) => s.trim()).filter(Boolean),
        interests: skillsForm.interests.split(',').map((s) => s.trim()).filter(Boolean),
        languages: skillsForm.languages.split(',').map((s) => s.trim()).filter(Boolean),
      })
      setEditingSkills(false)
      qc.invalidateQueries({ queryKey: ['profile', id] })
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
    },
  })

  const updateAchievementMut = useMutation({
    mutationFn: ({ id, data }) => updateAchievement(id, data),
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
      setShowGalleryModal(false)
    },
  })

  const updateGalleryMut = useMutation({
    mutationFn: ({ id, data }) => updateGalleryPhoto(id, data),
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
      <div className="min-h-screen bg-canvas pt-28">
        <div className="max-w-[1280px] mx-auto px-4 md:px-12">
          <div className="animate-pulse space-y-4">
            <div className="h-[300px] bg-soft-stone rounded-2xl" />
            <div className="h-24 bg-soft-stone rounded-full -mt-10 mx-4" />
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-canvas pt-28 flex items-center justify-center">
        <div className="text-center">
          <p className="font-display text-[24px] font-bold text-ink mb-2">Profile not found</p>
          <p className="font-sans text-[15px] text-ink-muted-80 mb-6">The user you're looking for doesn't exist or has been removed.</p>
          <Link to="/" className="button-primary">Go Home</Link>
        </div>
      </div>
    )
  }

  const galleryImages = profile?.gallery || []
  const suggested = suggestedData?.slice(0, 5) || []

  return (
    <div className="min-h-screen bg-canvas pt-24 md:pt-28">
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

      <div className="max-w-[1280px] mx-auto px-4 md:px-12">
        {/* Tabs */}
        <div className="flex gap-2 mt-8 mb-8 overflow-x-auto p-1 bg-surface-pearl border border-divider-soft rounded-[999px] w-max max-w-full">
          {TABS.map((tab) => (
            <motion.button
              key={tab}
              onClick={() => setActiveTab(tab)}
              whileTap={{ scale: 0.97 }}
              className={`font-sans text-[13px] font-bold uppercase tracking-[0.04em] px-5 py-2.5 rounded-[999px] transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-ink text-canvas shadow-sm'
                  : 'text-[#696969] bg-transparent hover:text-ink hover:bg-canvas-parchment'
              }`}
            >
              {tab}
            </motion.button>
          ))}
        </div>

        <div className="pb-20">
          <AnimatePresence mode="wait">
            {activeTab === 'about' && (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="grid gap-6 md:grid-cols-3"
              >
                {/* About Card */}
                <div className="md:col-span-2 p-6 md:p-8 border border-divider-soft bg-surface-pearl rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-display text-[22px] font-bold text-ink">About</h2>
                    {isOwn && !editingAbout && (
                      <button onClick={startEditAbout} className="inline-flex items-center gap-1 text-[13px] font-semibold text-action-blue hover:underline">
                        <Edit3 size={14} /> Edit
                      </button>
                    )}
                  </div>

                  {editingAbout ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Bio</label>
                        <textarea value={aboutForm.bio} onChange={(e) => setAboutForm((f) => ({ ...f, bio: e.target.value }))} rows={4} className="input resize-none" />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Department</label>
                          <input value={aboutForm.department} onChange={(e) => setAboutForm((f) => ({ ...f, department: e.target.value }))} className="input" />
                        </div>
                        <div>
                          <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Location</label>
                          <input value={aboutForm.location} onChange={(e) => setAboutForm((f) => ({ ...f, location: e.target.value }))} className="input" />
                        </div>
                        <div>
                          <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Batch</label>
                          <input value={aboutForm.batch} onChange={(e) => setAboutForm((f) => ({ ...f, batch: e.target.value }))} className="input" />
                        </div>
                        <div>
                          <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Semester</label>
                          <input type="number" value={aboutForm.semester} onChange={(e) => setAboutForm((f) => ({ ...f, semester: e.target.value }))} className="input" />
                        </div>
                        <div>
                          <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">College Email</label>
                          <input value={aboutForm.collegeEmail} onChange={(e) => setAboutForm((f) => ({ ...f, collegeEmail: e.target.value }))} className="input" />
                        </div>
                        <div>
                          <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Personal Email</label>
                          <input value={aboutForm.personalEmail} onChange={(e) => setAboutForm((f) => ({ ...f, personalEmail: e.target.value }))} className="input" />
                        </div>
                        <div>
                          <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Phone</label>
                          <input value={aboutForm.phone} onChange={(e) => setAboutForm((f) => ({ ...f, phone: e.target.value }))} className="input" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 pt-2">
                        <button onClick={saveAbout} disabled={saving} className="inline-flex items-center gap-2 bg-ink text-canvas px-5 py-2.5 rounded-full text-[13px] font-semibold hover:bg-ink/90 transition-colors disabled:opacity-50">
                          <Save size={14} /> {saving ? 'Saving…' : 'Save'}
                        </button>
                        <button onClick={() => setEditingAbout(false)} className="inline-flex items-center gap-2 bg-soft-stone text-ink px-5 py-2.5 rounded-full text-[13px] font-semibold hover:bg-soft-stone/80 transition-colors">
                          <X size={14} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted-48 mb-1">Department</p>
                        <p className="font-sans text-[15px] text-ink">{profile.department || '—'}</p>
                      </div>
                      <div>
                        <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted-48 mb-1">Semester</p>
                        <p className="font-sans text-[15px] text-ink">{profile.semester || '—'}</p>
                      </div>
                      <div>
                        <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted-48 mb-1">Location</p>
                        <p className="font-sans text-[15px] text-ink">{profile.location || '—'}</p>
                      </div>
                      <div>
                        <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted-48 mb-1">Batch</p>
                        <p className="font-sans text-[15px] text-ink">{profile.batch || '—'}</p>
                      </div>
                      {isOwn && (
                        <div className="sm:col-span-2 mt-2">
                          <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted-48 mb-1.5">Status</p>
                          <div className="flex gap-2">
                            <input
                              value={statusText}
                              onChange={(e) => setStatusText(e.target.value)}
                              placeholder="What's on your mind? (max 100 chars)"
                              maxLength={100}
                              className="input flex-1"
                            />
                            <button
                              onClick={handleSetStatus}
                              disabled={statusSaving || !statusText.trim()}
                              className="px-4 py-2 bg-ink text-canvas rounded-full text-[13px] font-semibold disabled:opacity-50"
                            >
                              Set
                            </button>
                            {profile.status?.text && (
                              <button
                                onClick={handleClearStatus}
                                className="px-4 py-2 bg-soft-stone text-ink rounded-full text-[13px] font-semibold"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                          <p className="font-mono text-[10px] text-ink-muted-48 mt-1">Auto-expires after 24 hours</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Skills */}
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted-48">Skills</p>
                      {isOwn && !editingSkills && (
                        <button onClick={startEditSkills} className="text-[12px] font-semibold text-action-blue hover:underline inline-flex items-center gap-1">
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
                          <button onClick={saveSkills} disabled={saving} className="inline-flex items-center gap-2 bg-ink text-canvas px-5 py-2.5 rounded-full text-[13px] font-semibold hover:bg-ink/90 transition-colors disabled:opacity-50">
                            <Save size={14} /> {saving ? 'Saving…' : 'Save'}
                          </button>
                          <button onClick={() => setEditingSkills(false)} className="inline-flex items-center gap-2 bg-soft-stone text-ink px-5 py-2.5 rounded-full text-[13px] font-semibold hover:bg-soft-stone/80 transition-colors">
                            <X size={14} /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {profile.skills?.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {profile.skills.map((skill) => (
                              <span key={skill} className="font-mono text-[12px] font-semibold px-3 py-1.5 rounded-full bg-soft-stone text-ink border border-hairline">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                        {profile.interests?.length > 0 && (
                          <div className="mt-4">
                            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted-48 mb-2">Interests</p>
                            <div className="flex flex-wrap gap-2">
                              {profile.interests.map((interest) => (
                                <span key={interest} className="font-mono text-[12px] font-semibold px-3 py-1.5 rounded-full bg-blue-50 text-action-blue border border-blue-100">
                                  {interest}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {profile.languages?.length > 0 && (
                          <div className="mt-4">
                            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted-48 mb-2">Languages</p>
                            <div className="flex flex-wrap gap-2">
                              {profile.languages.map((lang) => (
                                <span key={lang} className="font-mono text-[12px] font-semibold px-3 py-1.5 rounded-full bg-green-50 text-deep-green border border-green-100">
                                  {lang}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Contact */}
                  {(profile.collegeEmail || profile.personalEmail || profile.phone) && (
                    <div className="mt-8 pt-6 border-t border-divider-soft">
                      <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted-48 mb-3">Contact</p>
                      <div className="space-y-2">
                        {profile.collegeEmail && (
                          <p className="font-sans text-[14px] text-ink-muted-80">College Email: {profile.collegeEmail}</p>
                        )}
                        {profile.personalEmail && (
                          <p className="font-sans text-[14px] text-ink-muted-80">Personal Email: {profile.personalEmail}</p>
                        )}
                        {profile.phone && (
                          <p className="font-sans text-[14px] text-ink-muted-80">Phone: {profile.phone}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right sidebar */}
                <div className="space-y-6">
                  {/* Social Links */}
                  {socialPlatforms.some((p) => profile.socialLinks?.[p.key]) && (
                    <div className="p-6 border border-divider-soft bg-surface-pearl rounded-2xl shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-display text-[18px] font-bold text-ink">Social Links</h3>
                        {isOwn && !editingSocial && (
                          <button onClick={startEditSocial} className="text-[12px] font-semibold text-action-blue hover:underline inline-flex items-center gap-1">
                            <Edit3 size={12} /> Edit
                          </button>
                        )}
                      </div>
                      {editingSocial ? (
                        <div className="space-y-3">
                          {socialPlatforms.map((platform) => (
                            <div key={platform.key}>
                              <label className="block font-sans text-[12px] font-semibold text-ink-muted-80 mb-1">{platform.label}</label>
                              <input
                                value={socialForm[platform.key] || ''}
                                onChange={(e) => setSocialForm((f) => ({ ...f, [platform.key]: e.target.value }))}
                                className="input"
                                placeholder={`@${platform.key}`}
                              />
                            </div>
                          ))}
                          <div className="flex items-center gap-3 pt-2">
                            <button onClick={saveSocial} disabled={saving} className="inline-flex items-center gap-2 bg-ink text-canvas px-5 py-2.5 rounded-full text-[13px] font-semibold hover:bg-ink/90 transition-colors disabled:opacity-50">
                              <Save size={14} /> {saving ? 'Saving…' : 'Save'}
                            </button>
                            <button onClick={() => setEditingSocial(false)} className="inline-flex items-center gap-2 bg-soft-stone text-ink px-5 py-2.5 rounded-full text-[13px] font-semibold hover:bg-soft-stone/80 transition-colors">
                              <X size={14} /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {socialPlatforms
                            .filter((p) => profile.socialLinks?.[p.key])
                            .map((p) => (
                              <SocialLinkCard
                                key={p.key}
                                platform={p.key}
                                username={profile.socialLinks[p.key]}
                                url={p.key === 'website' ? profile.socialLinks[p.key] : undefined}
                              />
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Badges */}
                  {profile.badges?.length > 0 && (
                    <div className="p-6 border border-divider-soft bg-surface-pearl rounded-2xl shadow-sm">
                      <h3 className="font-display text-[18px] font-bold text-ink mb-4">Badges</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.badges.map((badge) => (
                          <span key={badge} className="inline-flex items-center px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[12px] font-semibold">
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Profile Views (own profile only) */}
                  {isOwn && viewsData?.length > 0 && (
                    <div className="p-6 border border-divider-soft bg-surface-pearl rounded-2xl shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <Eye size={18} className="text-slate" />
                        <h3 className="font-display text-[18px] font-bold text-ink">Recent Views</h3>
                      </div>
                      <div className="space-y-2">
                        {viewsData.slice(0, 5).map((viewer) => (
                          <Link key={viewer._id} to={`/profile/${viewer._id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-soft-stone transition-colors">
                            <div className="w-8 h-8 rounded-full bg-soft-stone flex items-center justify-center overflow-hidden">
                              {viewer.photo ? (
                                <img src={viewer.photo} alt={viewer.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="font-display font-bold text-[14px] text-ink-muted-48">
                                  {viewer.name?.charAt(0)}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-sans text-[13px] font-semibold text-ink truncate">{viewer.name}</p>
                              <p className="font-mono text-[11px] text-slate">{viewer.profile?.department || viewer.role}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Similar Profiles */}
                  {!isOwn && suggested.length > 0 && (
                    <div className="p-6 border border-divider-soft bg-surface-pearl rounded-2xl shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={18} className="text-coral" />
                        <h3 className="font-display text-[18px] font-bold text-ink">Similar Profiles</h3>
                      </div>
                      <div className="space-y-3">
                        {suggested.map((user) => (
                          <Link key={user._id} to={`/profile/${user._id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-soft-stone transition-colors group">
                            <div className="w-10 h-10 rounded-full bg-soft-stone flex items-center justify-center overflow-hidden flex-shrink-0">
                              {user.photo ? (
                                <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="font-display font-bold text-[16px] text-ink-muted-48">
                                  {user.name?.charAt(0)}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-sans text-[14px] font-semibold text-ink group-hover:text-action-blue transition-colors truncate">{user.name}</p>
                              <p className="font-mono text-[11px] text-slate">{user.department || user.role} {user.batch ? `· Batch ${user.batch}` : ''}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Network Stats */}
                  <div className="p-6 border border-divider-soft bg-surface-pearl rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display text-[18px] font-bold text-ink">Network</h3>
                      <Users size={18} className="text-slate" />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1 text-center p-3 bg-canvas rounded-xl">
                        <p className="font-display text-[20px] font-bold text-ink">{profile.followers || 0}</p>
                        <p className="font-mono text-[11px] uppercase tracking-wider text-ink-muted-48">Followers</p>
                      </div>
                      <div className="flex-1 text-center p-3 bg-canvas rounded-xl">
                        <p className="font-display text-[20px] font-bold text-ink">{profile.following || 0}</p>
                        <p className="font-mono text-[11px] uppercase tracking-wider text-ink-muted-48">Following</p>
                      </div>
                    </div>
                    {isOwn && stats.profileViews > 0 && (
                      <div className="mt-3 flex items-center justify-center gap-2 text-[13px] text-ink-muted-80">
                        <Eye size={14} className="text-slate" />
                        <span>{stats.profileViews} profile views</span>
                      </div>
                    )}
                  </div>
                </div>
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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-[24px] font-bold text-ink">Projects</h2>
                  {isOwn && (
                    <button
                      onClick={() => setShowProjectModal(true)}
                      className="inline-flex items-center gap-2 bg-ink text-canvas px-5 py-2.5 rounded-full text-[14px] font-semibold hover:bg-ink/90 transition-colors shadow-sm"
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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-[24px] font-bold text-ink">Achievements</h2>
                  {isOwn && (
                    <button
                      onClick={() => setShowAchievementModal(true)}
                      className="inline-flex items-center gap-2 bg-ink text-canvas px-5 py-2.5 rounded-full text-[14px] font-semibold hover:bg-ink/90 transition-colors shadow-sm"
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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-[24px] font-bold text-ink">Gallery</h2>
                  {isOwn && (
                    <button
                      onClick={() => setShowGalleryModal(true)}
                      className="inline-flex items-center gap-2 bg-ink text-canvas px-5 py-2.5 rounded-full text-[14px] font-semibold hover:bg-ink/90 transition-colors shadow-sm"
                    >
                      <Plus size={16} />
                      Upload Photo
                    </button>
                  )}
                </div>
                {galleryData?.data?.length === 0 ? (
                  <div className="py-16 text-center border border-divider-soft rounded-2xl bg-surface-pearl">
                    <ImageIcon size={32} className="mx-auto text-slate mb-3" />
                    <p className="font-sans text-[15px] text-ink-muted-80">No gallery images yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {galleryData?.data?.map((img, i) => (
                      <div key={img._id} className="relative aspect-square rounded-2xl overflow-hidden border border-divider-soft hover:shadow-md transition-shadow group">
                        <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover" />
                        {isOwn && (
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button onClick={() => setEditingGallery(img)} className="px-3 py-1.5 bg-white text-ink text-[12px] font-semibold rounded-lg hover:bg-soft-stone transition-colors">Edit</button>
                            <button onClick={() => { if (window.confirm('Remove this photo?')) deleteGalleryMut.mutate(img._id) }} className="px-3 py-1.5 bg-red-500 text-white text-[12px] font-semibold rounded-lg hover:bg-red-600 transition-colors">Delete</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Lightbox */}
        {lightboxImages.length > 0 && (
          <GalleryLightbox
            images={lightboxImages}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxImages([])}
          />
        )}

        {/* Project Submit Modal */}
        {showProjectModal && (
          <ProjectSubmitModal
            onClose={() => setShowProjectModal(false)}
            onSubmit={async (data) => {
              const res = await createProject(data)
              setShowProjectModal(false)
              qc.invalidateQueries({ queryKey: ['userProjects', id] })
              qc.invalidateQueries({ queryKey: ['profile', id] })
              return res.data
            }}
          />
        )}

        {/* Achievement Submit Modal */}
        {showAchievementModal && (
          <AchievementSubmitModal
            onClose={() => setShowAchievementModal(false)}
            onSubmit={async (data) => {
              await saveAchievementMut.mutateAsync(data)
            }}
            loading={saveAchievementMut.isPending}
          />
        )}

        {/* Achievement Edit Modal */}
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

        {/* Gallery Submit Modal */}
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
    </div>
  )
}

function ProjectsList({ projects }) {
  if (projects.length === 0) {
    return (
      <div className="py-16 text-center border border-divider-soft rounded-2xl bg-surface-pearl">
        <p className="font-sans text-[15px] text-ink-muted-80">No projects yet.</p>
      </div>
    )
  }

  const pinned = projects.filter(p => p.pinned)
  const unpinned = projects.filter(p => !p.pinned)

  return (
    <div className="space-y-6">
      {pinned.length > 0 && (
        <div>
          <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-coral mb-3">Pinned Projects</h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pinned.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        </div>
      )}
      {unpinned.length > 0 && (
        <div>
          {pinned.length > 0 && (
            <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate mb-3">Other Projects</h3>
          )}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
      <div className="border border-divider-soft bg-canvas rounded-2xl overflow-hidden shadow-card hover:border-slate/30 hover:shadow-md transition-all flex flex-col h-full">
        {project.thumbnail ? (
          <img src={project.thumbnail} alt={project.title} className="w-full h-32 object-cover" />
        ) : project.images?.[0] ? (
          <img src={project.images[0]} alt={project.title} className="w-full h-32 object-cover" />
        ) : (
          <div className="w-full h-32 bg-soft-stone flex items-center justify-center">
            <GitBranch size={24} className="text-slate" />
          </div>
        )}
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex-1">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="font-display text-[18px] font-bold text-ink leading-snug">{project.title}</h3>
              {project.pinned && (
                <span className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-coral/10 text-coral border border-coral/20">
                  Pinned
                </span>
              )}
            </div>
            <p className="font-sans text-[14px] text-ink-muted-80 leading-relaxed mb-4 line-clamp-3">{project.description}</p>
            {project.techStack?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {project.techStack.map((tech) => (
                  <span key={tech} className="font-mono text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-soft-stone text-ink border border-hairline">
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-hairline">
            <div className="flex items-center gap-3">
              {project.githubLink && (
                <a href={project.githubLink} target="_blank" rel="noreferrer" className="text-slate hover:text-ink transition-colors">
                  <GitBranch size={16} />
                </a>
              )}
              {project.demoLink && (
                <a href={project.demoLink} target="_blank" rel="noreferrer" className="text-slate hover:text-ink transition-colors">
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
            {!project.isApproved && (
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-soft-stone text-slate border border-hairline">
                Pending
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

function AchievementsList({ achievements, isOwn, onEdit, onDelete }) {
  if (achievements.length === 0) {
    return (
      <div className="py-16 text-center border border-divider-soft rounded-2xl bg-surface-pearl">
        <p className="font-sans text-[15px] text-ink-muted-80">No achievements yet.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {achievements.map((achievement) => (
        <div key={achievement._id} className="border border-divider-soft bg-canvas rounded-2xl overflow-hidden shadow-card hover:shadow-md transition-shadow">
          {achievement.image && (
            <img src={achievement.image} alt={achievement.title} className="w-full h-48 object-cover" />
          )}
          <div className="p-6">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-display text-[18px] font-bold text-ink">{achievement.title}</h3>
              {isOwn && (
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => onEdit?.(achievement)} className="font-sans text-[12px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors px-2.5 py-1 rounded-md">Edit</button>
                  <button onClick={() => onDelete?.(achievement._id)} className="font-sans text-[12px] font-medium text-red-500/70 hover:text-red-500 transition-colors bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 rounded-md">Delete</button>
                </div>
              )}
            </div>
            <p className="font-sans text-[14px] text-ink-muted-80 mb-4">{achievement.description}</p>
            <div className="flex items-center justify-between">
              <p className="font-mono text-[12px] text-slate">
                {achievement.date ? new Date(achievement.date).toLocaleDateString() : ''}
              </p>
              {achievement.certificatePdf && (
                <a href={achievement.certificatePdf} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] font-semibold text-action-blue hover:underline">
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
      <div className="bg-canvas text-ink border border-divider-soft rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-divider-soft flex items-center justify-between">
          <div>
            <h3 className="font-display text-[22px] font-bold">Submit Project</h3>
            <p className="font-sans text-[13px] text-body-muted">
              Share your project with the department community.
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-soft-stone border border-hairline flex items-center justify-center hover:bg-soft-stone/80 transition-colors">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          <div>
            <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Project Title *</label>
            <input required value={form.title} onChange={set('title')} placeholder="e.g. Solar-Powered IoT Weather Station" className="w-full bg-surface-pearl border border-divider-soft rounded-xl px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary" />
            {errors.title && <p className="text-error text-[12px] mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Description *</label>
            <textarea required value={form.description} onChange={set('description')} placeholder="What does your project do?" rows={4} className="w-full bg-surface-pearl border border-divider-soft rounded-xl px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary resize-none" />
            {errors.description && <p className="text-error text-[12px] mt-1">{errors.description}</p>}
          </div>

          <div>
            <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Tech Stack *</label>
            <input required value={form.techStack} onChange={set('techStack')} placeholder="e.g. React, Node.js, Arduino" className="w-full bg-surface-pearl border border-divider-soft rounded-xl px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary" />
            <p className="font-sans text-[11px] text-ink-muted-48 mt-1">Separate technologies with commas.</p>
            {errors.techStack && <p className="text-error text-[12px] mt-1">{errors.techStack}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">GitHub Link</label>
              <input type="url" value={form.githubLink} onChange={set('githubLink')} placeholder="https://github.com/username/repo" className="w-full bg-surface-pearl border border-divider-soft rounded-xl px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Demo Link</label>
              <input type="url" value={form.demoLink} onChange={set('demoLink')} placeholder="https://your-demo.vercel.app" className="w-full bg-surface-pearl border border-divider-soft rounded-xl px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-[14px] font-semibold text-slate hover:text-ink transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="button-primary px-6 py-2.5 text-[14px]">
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
      <div className="bg-canvas text-ink border border-divider-soft rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-divider-soft flex items-center justify-between">
          <div>
            <h3 className="font-display text-[22px] font-bold">Post Achievement</h3>
            <p className="font-sans text-[13px] text-body-muted">
              Share your achievement with the department.
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-soft-stone border border-hairline flex items-center justify-center hover:bg-soft-stone/80 transition-colors">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          <div>
            <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Title *</label>
            <input required value={form.title} onChange={set('title')} placeholder="e.g. Won First Place at Hackathon" className="w-full bg-surface-pearl border border-divider-soft rounded-xl px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary" />
            {errors.title && <p className="text-error text-[12px] mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Description *</label>
            <textarea required value={form.description} onChange={set('description')} placeholder="Describe your achievement..." rows={4} className="w-full bg-surface-pearl border border-divider-soft rounded-xl px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary resize-none" />
            {errors.description && <p className="text-error text-[12px] mt-1">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Date *</label>
              <input type="date" required value={form.date} onChange={set('date')} className="w-full bg-surface-pearl border border-divider-soft rounded-xl px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary" />
              {errors.date && <p className="text-error text-[12px] mt-1">{errors.date}</p>}
            </div>
            <div>
              <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Category</label>
              <select value={form.category} onChange={set('category')} className="w-full bg-surface-pearl border border-divider-soft rounded-xl px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary">
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="awards">Award</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Image (optional)</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={set('image')} className="hidden" />
            <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2 border border-divider-soft rounded-xl text-[13px] font-semibold hover:bg-soft-stone/50 transition-colors">
              Choose Image
            </button>
            {imagePreview && <img src={imagePreview} alt="Preview" className="mt-3 w-full h-48 object-cover rounded-xl" />}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-[14px] font-semibold text-slate hover:text-ink transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting || loading} className="button-primary px-6 py-2.5 text-[14px]">
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
      <div className="bg-canvas text-ink border border-divider-soft rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-divider-soft flex items-center justify-between">
          <div>
            <h3 className="font-display text-[22px] font-bold">Edit Achievement</h3>
            <p className="font-sans text-[13px] text-body-muted">
              Update your achievement details.
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-soft-stone border border-hairline flex items-center justify-center hover:bg-soft-stone/80 transition-colors">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          <div>
            <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Title *</label>
            <input required value={form.title} onChange={set('title')} placeholder="e.g. Won First Place at Hackathon" className="w-full bg-surface-pearl border border-divider-soft rounded-xl px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary" />
            {errors.title && <p className="text-error text-[12px] mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Description *</label>
            <textarea required value={form.description} onChange={set('description')} placeholder="Describe your achievement..." rows={4} className="w-full bg-surface-pearl border border-divider-soft rounded-xl px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary resize-none" />
            {errors.description && <p className="text-error text-[12px] mt-1">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Date *</label>
              <input type="datetime-local" required value={form.date} onChange={set('date')} className="w-full bg-surface-pearl border border-divider-soft rounded-xl px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary" />
              {errors.date && <p className="text-error text-[12px] mt-1">{errors.date}</p>}
            </div>
            <div>
              <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Category</label>
              <select value={form.category} onChange={set('category')} className="w-full bg-surface-pearl border border-divider-soft rounded-xl px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary">
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="awards">Award</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Image (optional - upload new to replace)</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={set('image')} className="hidden" />
            <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2 border border-divider-soft rounded-xl text-[13px] font-semibold hover:bg-soft-stone/50 transition-colors">
              Choose Image
            </button>
            {imagePreview && <img src={imagePreview} alt="Preview" className="mt-3 w-full h-48 object-cover rounded-xl" />}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-[14px] font-semibold text-slate hover:text-ink transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting || loading} className="button-primary px-6 py-2.5 text-[14px]">
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
      <div className="bg-canvas text-ink border border-divider-soft rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-divider-soft flex items-center justify-between">
          <div>
            <h3 className="font-display text-[22px] font-bold">{isEdit ? 'Edit Photo' : 'Upload Photo'}</h3>
            <p className="font-sans text-[13px] text-body-muted">
              {isEdit ? 'Update your gallery photo details.' : 'Share a moment with the department. Photos require admin approval.'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-soft-stone border border-hairline flex items-center justify-center hover:bg-soft-stone/80 transition-colors">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          <div>
            <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Title *</label>
            <input required value={form.title} onChange={set('title')} placeholder="e.g. Lab Workshop 2024" className="w-full bg-surface-pearl border border-divider-soft rounded-xl px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary" />
            {errors.title && <p className="text-error text-[12px] mt-1">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Category</label>
              <select value={form.category} onChange={set('category')} className="w-full bg-surface-pearl border border-divider-soft rounded-xl px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary">
                <option value="campus">Campus</option>
                <option value="event">Event</option>
                <option value="lab">Lab</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Date</label>
              <input type="datetime-local" value={form.date} onChange={set('date')} className="w-full bg-surface-pearl border border-divider-soft rounded-xl px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div>
            <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Image</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={set('image')} className="hidden" />
            <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2 border border-divider-soft rounded-xl text-[13px] font-semibold hover:bg-soft-stone/50 transition-colors">
              Choose Image
            </button>
            {imagePreview && <img src={imagePreview} alt="Preview" className="mt-3 w-full h-48 object-cover rounded-xl" />}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-[14px] font-semibold text-slate hover:text-ink transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting || loading} className="button-primary px-6 py-2.5 text-[14px]">
              {submitting || loading ? (isEdit ? 'Saving…' : 'Uploading…') : (isEdit ? 'Save Changes' : 'Upload Photo')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
