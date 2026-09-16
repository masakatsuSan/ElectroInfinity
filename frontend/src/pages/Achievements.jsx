import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getAchievements } from '../api/achievements'
import { Skeleton } from '../components/Skeleton'
import ImageGuard from '../components/ImageGuard'
import UploaderInfo from '../components/UploaderInfo'
import { useAuth } from '../context/AuthContext'

const ACHIEVEMENT_BADGE_CLASSES = {
  Student: 'bg-signature-coral text-white',
  Faculty: 'bg-signature-forest text-white',
  Award: 'bg-signature-mustard text-ink',
}
const NO_GRADIENTS = '[*]:bg-none [*]:before:bg-none'

function AchCard({ item, badgeText }) {
  const badgeClass = ACHIEVEMENT_BADGE_CLASSES[badgeText] || 'bg-ink text-white'
  const authorName = item.author?.name || 'Unknown'

  return (
    <div className="flex flex-col overflow-hidden border border-hairline bg-white rounded-md group">
      <div className="relative h-48 overflow-hidden sm:h-56 bg-white">
        <ImageGuard className={`w-full h-full ${NO_GRADIENTS}`}>
          {item.photo ? (
            <img 
              src={item.photo} 
              alt={item.name} 
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-surface-soft">
              <span className="font-sans text-[14px] text-muted">No Photo</span>
            </div>
          )}
        </ImageGuard>
        <div className="absolute top-3 right-3 bg-white border border-hairline px-2.5 py-1 rounded-sm">
          <span className="font-sans text-[11px] font-medium text-ink uppercase tracking-[0.16px]">{item.year}</span>
        </div>
        {badgeText && (
          <div className={`absolute bottom-3 left-3 px-2.5 py-1 rounded-sm ${badgeClass}`}>
            <span className="font-sans text-[11px] font-medium uppercase tracking-[0.16px]">{badgeText}</span>
          </div>
        )}
      </div>
      <div className="flex flex-col flex-grow p-5">
        <h3 className="font-sans font-medium text-[18px] text-ink mb-2 leading-[1.4] line-clamp-1">{item.name}</h3>
        <p className="font-sans text-[14px] text-body leading-[1.25] flex-grow line-clamp-3">
          {item.desc}
        </p>
        <div className="mt-4">
          <UploaderInfo user={item.author} size="w-7 h-7">
            <span className="font-sans text-[12px] text-muted">
              by <span className="font-medium text-ink">{authorName}</span>
            </span>
          </UploaderInfo>
        </div>
      </div>
    </div>
  )
}

function SkeletonAchCard() {
  return (
    <div className="flex flex-col overflow-hidden border bg-white border-hairline rounded-md animate-pulse">
      <div className="h-48 sm:h-56 bg-surface-soft" />
      <div className="flex flex-col flex-grow p-5">
        <div className="h-5 w-3/4 bg-surface-soft rounded-sm mb-2" />
        <div className="h-4 w-full bg-surface-soft rounded-sm mb-1.5" />
        <div className="h-4 w-full bg-surface-soft rounded-sm mb-1.5" />
        <div className="h-4 w-2/3 bg-surface-soft rounded-sm" />
      </div>
    </div>
  )
}

function SkeletonSection() {
  return (
    <div className="mb-24">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-7 w-48 bg-surface-soft rounded-sm animate-pulse" />
        <div className="flex-grow mt-2 border-t border-hairline" />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonAchCard key={i} />
        ))}
      </div>
    </div>
  )
}

export default function Achievements() {
  const { user } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => getAchievements().then(r => r.data),
  })

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24 bg-white pt-24">
        <div className="px-6 mx-auto max-w-[1280px]">
          <div className="max-w-2xl mx-auto mb-16 text-center">
            <div className="h-4 w-40 bg-surface-soft rounded-sm animate-pulse mx-auto mb-3" />
            <div className="h-12 w-64 bg-surface-soft rounded-sm animate-pulse mx-auto mb-4" />
            <div className="h-5 w-96 bg-surface-soft rounded-sm animate-pulse mx-auto" />
          </div>
          <SkeletonSection />
          <SkeletonSection />
        </div>
      </div>
    )
  }

  const allAchievements = data?.data || []
  
  const formatAch = (a) => ({
    id: a._id,
    name: a.title,
    desc: a.description,
    year: a.date ? new Date(a.date).getFullYear() : '',
    photo: a.image,
    author: a.author,
  })

  const STUDENT_ACH = allAchievements.filter(a => a.category === 'student').map(formatAch)
  const FACULTY_ACH = allAchievements.filter(a => a.category === 'faculty').map(formatAch)
  const AWARDS = allAchievements.filter(a => a.category === 'awards').map(formatAch)

  return (
    <div className="min-h-screen pb-24 bg-white pt-24">
      <div className="px-6 mx-auto max-w-[1280px]">
        <div className="max-w-3xl mb-16">
          <span className="font-sans text-[13px] font-medium text-signature-coral uppercase tracking-[0.16px] mb-3 block">Pride of the Department</span>
          <h1 className="font-display font-normal text-[40px] md:text-[56px] text-ink leading-[1.2] tracking-[0]">
            Achievements
          </h1>
          <p className="font-sans text-[14px] text-body mt-6 leading-[1.25] max-w-2xl">
            Celebrating the outstanding accomplishments of our students, faculty, and the electrical engineering department.
          </p>
        </div>

        <div className="mb-24">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-sans font-normal text-[24px] text-ink leading-[1.35] tracking-[0.12px]">Student Achievements</h2>
            <div className="flex-grow mt-2 border-t border-hairline"></div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {STUDENT_ACH.map(a => (
              <Link key={a.id} to={`/achievements/${a.id}`} className="block">
                <AchCard item={a} badgeText="Student" />
              </Link>
            ))}
          </div>
        </div>

        <div className="mb-24">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-sans font-normal text-[24px] text-ink leading-[1.35] tracking-[0.12px]">Faculty Achievements</h2>
            <div className="flex-grow mt-2 border-t border-hairline"></div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {FACULTY_ACH.map(a => (
              <Link key={a.id} to={`/achievements/${a.id}`} className="block">
                <AchCard item={a} badgeText="Faculty" />
              </Link>
            ))}
          </div>
        </div>

        <div className="mb-0">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-sans font-normal text-[24px] text-ink leading-[1.35] tracking-[0.12px]">Awards & Certificates</h2>
            <div className="flex-grow mt-2 border-t border-hairline"></div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {AWARDS.map(a => (
              <Link key={a.id} to={`/achievements/${a.id}`} className="block">
                <AchCard item={a} badgeText="Award" />
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
