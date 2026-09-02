import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { updateMyProfile, uploadCoverPhoto, uploadProfilePhoto } from '../api/profile'
import { getMe } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import ProfileHeader from '../components/ProfileHeader'
import { Camera, Save } from 'lucide-react'

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'social', label: 'Social Links' },
  { id: 'privacy', label: 'Privacy' },
]

export default function EditProfile() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('general')
  const [form, setForm] = useState({
    name: '',
    bio: '',
    department: '',
    location: '',
    skills: '',
    interests: '',
    languages: '',
    collegeEmail: '',
    personalEmail: '',
    phone: '',
    rollNumber: '',
    batch: '',
    section: '',
    semester: '',
    socialLinks: {},
    profileVisibility: 'public',
  })
  const [coverPreview, setCoverPreview] = useState('')
  const [photoPreview, setPhotoPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const coverRef = useRef(null)
  const photoRef = useRef(null)

  const { data: profileData } = useQuery({
    queryKey: ['editProfile'],
    queryFn: () => getMe().then((res) => res.data.user),
    enabled: !!user,
  })

  useEffect(() => {
    if (profileData) {
      const u = profileData
      const p = u.profile || {}
      setForm({
        name: u.name || '',
        bio: p.bio || '',
        department: p.department || '',
        location: p.location || '',
        skills: (p.skills || []).join(', '),
        interests: (p.interests || []).join(', '),
        languages: (p.languages || []).join(', '),
        collegeEmail: u.collegeEmail || '',
        personalEmail: u.personalEmail || '',
        phone: u.phone || '',
        rollNumber: u.rollNumber || '',
        batch: u.batch || '',
        section: u.section || '',
        semester: u.semester?.toString() || '',
        socialLinks: p.socialLinks || {},
        profileVisibility: p.profileVisibility || 'public',
      })
      setCoverPreview(p.coverPhoto || '')
      setPhotoPreview(u.photo || '')
    }
   }, [profileData])

  const updateMut = useMutation({
    mutationFn: (data) => updateMyProfile(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['editProfile'] })
      qc.invalidateQueries({ queryKey: ['profile'] })
      setSaving(false)
      if (setUser) {
        const updated = { ...user, ...res.data.data }
        localStorage.setItem('ei_user', JSON.stringify(updated))
        setUser(updated)
      }
    },
    onError: () => setSaving(false),
  })

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const handleSocialChange = (platform, value) => {
    setForm((f) => ({
      ...f,
      socialLinks: { ...f.socialLinks, [platform]: value },
    }))
  }

  const prepareSaveData = () => ({
    name: form.name,
    bio: form.bio,
    department: form.department,
    location: form.location,
    skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
    interests: form.interests.split(',').map((s) => s.trim()).filter(Boolean),
    languages: form.languages.split(',').map((s) => s.trim()).filter(Boolean),
    collegeEmail: form.collegeEmail,
    personalEmail: form.personalEmail,
    phone: form.phone,
    rollNumber: form.rollNumber,
    batch: form.batch,
    section: form.section,
    semester: form.semester ? Number(form.semester) : undefined,
    socialLinks: form.socialLinks,
    profileVisibility: form.profileVisibility,
  })

  const handleSave = () => {
    setSaving(true)
    updateMut.mutate(prepareSaveData())
  }

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('cover', file)
    try {
      const res = await uploadCoverPhoto(fd)
      setCoverPreview(res.data.data.coverPhoto)
    } catch (err) {
      console.error(err)
    }
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('photo', file)
    try {
      const res = await uploadProfilePhoto(fd)
      setPhotoPreview(res.data.data.photo)
    } catch (err) {
      console.error(err)
    }
  }

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

  return (
    <div className="min-h-screen bg-canvas pt-28 pb-20">
      <div className="max-w-[1280px] mx-auto px-4 md:px-12">
        {/* Profile Preview */}
        <div className="mb-8">
          <ProfileHeader
            profile={{
              ...form,
              _id: user?._id,
              photo: photoPreview,
              coverPhoto: coverPreview,
              followers: 0,
              following: 0,
              isFollowing: false,
            }}
            isOwn={true}
            onUpdate={() => {}}
          />
        </div>

         {/* Tabs */}
         <div className="flex gap-2 mb-8 overflow-x-auto p-1 bg-white border border-divider-soft rounded-[999px] w-max max-w-full">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`font-sans text-[13px] font-bold uppercase tracking-[0.04em] px-5 py-2.5 rounded-[999px] transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-ink text-canvas shadow-sm'
                  : 'text-[#696969] bg-transparent hover:text-ink hover:bg-canvas-parchment'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            {activeTab === 'general' && (
              <div className="p-6 md:p-8 border border-divider-soft bg-white rounded-2xl shadow-sm space-y-6">
                <h2 className="font-display text-[22px] font-bold text-ink">General Information</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Full Name *</label>
                    <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Roll Number</label>
                    <input value={form.rollNumber} onChange={(e) => handleChange('rollNumber', e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Batch</label>
                    <input value={form.batch} onChange={(e) => handleChange('batch', e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Section</label>
                    <input value={form.section} onChange={(e) => handleChange('section', e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Semester</label>
                    <input type="number" value={form.semester} onChange={(e) => handleChange('semester', e.target.value)} className="input" />
                  </div>
                </div>

                {/* Cover & Photo Upload */}
                <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t border-divider-soft">
                  <div>
                    <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Cover Photo</label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => coverRef.current?.click()}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-divider-soft rounded-xl text-[13px] font-semibold hover:bg-soft-stone/50 transition-colors"
                      >
                        <Camera size={14} /> Change Cover
                      </button>
                      {coverPreview && (
                        <img src={coverPreview} alt="Cover preview" className="h-10 w-24 object-cover rounded-lg" />
                      )}
                    </div>
                    <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                  </div>
                  <div>
                    <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Profile Photo</label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => photoRef.current?.click()}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-divider-soft rounded-xl text-[13px] font-semibold hover:bg-soft-stone/50 transition-colors"
                      >
                        <Camera size={14} /> Change Photo
                      </button>
                      {photoPreview && (
                        <img src={photoPreview} alt="Photo preview" className="h-10 w-10 object-cover rounded-full" />
                      )}
                    </div>
                    <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="p-6 md:p-8 border border-divider-soft bg-white rounded-2xl shadow-sm space-y-6">
                <h2 className="font-display text-[22px] font-bold text-ink">About</h2>
                <div>
                  <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Bio</label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    rows={4}
                    className="input resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Department</label>
                    <input value={form.department} onChange={(e) => handleChange('department', e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Location</label>
                    <input value={form.location} onChange={(e) => handleChange('location', e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">College Email</label>
                    <input value={form.collegeEmail} onChange={(e) => handleChange('collegeEmail', e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Personal Email</label>
                    <input value={form.personalEmail} onChange={(e) => handleChange('personalEmail', e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Phone</label>
                    <input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} className="input" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="p-6 md:p-8 border border-divider-soft bg-white rounded-2xl shadow-sm space-y-6">
                <h2 className="font-display text-[22px] font-bold text-ink">Skills, Interests & Languages</h2>
                <div>
                  <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Skills</label>
                  <input
                    value={form.skills}
                    onChange={(e) => handleChange('skills', e.target.value)}
                    className="input"
                    placeholder="React, Python, Flutter..."
                  />
                  <p className="font-sans text-[11px] text-ink-muted-48 mt-1">Separate with commas</p>
                </div>
                <div>
                  <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Interests</label>
                  <input
                    value={form.interests}
                    onChange={(e) => handleChange('interests', e.target.value)}
                    className="input"
                    placeholder="Machine Learning, Robotics..."
                  />
                </div>
                <div>
                  <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Languages</label>
                  <input
                    value={form.languages}
                    onChange={(e) => handleChange('languages', e.target.value)}
                    className="input"
                    placeholder="English, Hindi, Bengali..."
                  />
                </div>
              </div>
            )}

            {activeTab === 'social' && (
              <div className="p-6 md:p-8 border border-divider-soft bg-white rounded-2xl shadow-sm space-y-6">
                <h2 className="font-display text-[22px] font-bold text-ink">Social Links</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {socialPlatforms.map((platform) => (
                    <div key={platform.key}>
                      <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">{platform.label}</label>
                      <input
                        value={form.socialLinks[platform.key] || ''}
                        onChange={(e) => handleSocialChange(platform.key, e.target.value)}
                        className="input"
                        placeholder={`@${platform.key}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="p-6 md:p-8 border border-divider-soft bg-white rounded-2xl shadow-sm space-y-6">
                <h2 className="font-display text-[22px] font-bold text-ink">Privacy Settings</h2>
                <div>
                  <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-2">Profile Visibility</label>
                  <div className="flex flex-wrap gap-3">
                    {['public', 'friends', 'private'].map((option) => (
                      <button
                        key={option}
                        onClick={() => handleChange('profileVisibility', option)}
                        className={`px-5 py-2.5 rounded-full text-[13px] font-semibold transition-colors ${
                          form.profileVisibility === option
                            ? 'bg-ink text-canvas shadow-sm'
                            : 'bg-soft-stone text-ink hover:bg-soft-stone/80'
                        }`}
                      >
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </button>
                    ))}
                  </div>
                  <p className="font-sans text-[12px] text-ink-muted-48 mt-2">
                    {form.profileVisibility === 'public' && 'Everyone can view your full profile.'}
                    {form.profileVisibility === 'friends' && 'Only followers can view your full profile. Others see limited info.'}
                    {form.profileVisibility === 'private' && 'Only you can view your profile.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Save Button */}
            <div className="p-6 border border-divider-soft bg-white rounded-2xl shadow-sm">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full inline-flex items-center justify-center gap-2 bg-ink text-canvas px-6 py-3 rounded-full text-[14px] font-semibold hover:bg-ink/90 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-canvas border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                onClick={() => navigate(`/profile/${user?._id}`)}
                className="w-full mt-3 inline-flex items-center justify-center gap-2 bg-white border border-divider-soft text-ink px-6 py-3 rounded-full text-[14px] font-semibold hover:bg-soft-stone/50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
