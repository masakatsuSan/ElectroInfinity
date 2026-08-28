import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAchievements } from '../api/achievements'
import { Skeleton } from '../components/Skeleton'
import ImageGuard from '../components/ImageGuard'

function AchCard({ item, badgeText }) {
  return (
    <div className="flex flex-col overflow-hidden transition-all duration-300 transform border group bg-surface-pearl border-divider-soft rounded-2xl hover:shadow-xl hover:-translate-y-1">
      <div className="relative h-48 overflow-hidden sm:h-56 bg-canvas">
        <ImageGuard className="w-full h-full">
          {item.photo ? (
            <img 
              src={item.photo} 
              alt={item.name} 
              className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-canvas-parchment">
              <span className="font-sans text-ink-muted-48">No Photo</span>
            </div>
          )}
        </ImageGuard>
        <div className="absolute top-3 right-3 bg-canvas/90 backdrop-blur-sm border border-divider-soft px-2.5 py-1 rounded-md shadow-sm">
          <span className="font-sans text-[11px] font-bold text-primary uppercase tracking-widest">{item.year}</span>
        </div>
        {badgeText && (
          <div className="absolute bottom-3 left-3 bg-primary text-white px-2.5 py-1 rounded-md shadow-md">
            <span className="font-sans text-[11px] font-bold uppercase tracking-widest">{badgeText}</span>
          </div>
        )}
      </div>
      <div className="flex flex-col flex-grow p-5">
        <h3 className="font-display font-semibold text-[18px] text-ink mb-2 line-clamp-1">{item.name}</h3>
        <p className="font-sans text-[14px] text-ink-muted-80 leading-relaxed flex-grow line-clamp-3">
          {item.desc}
        </p>
      </div>
    </div>
  )
}

function SkeletonAchCard() {
  return (
    <div className="flex flex-col overflow-hidden border bg-surface-pearl border-divider-soft rounded-2xl animate-pulse">
      <div className="h-48 sm:h-56 bg-soft-stone" />
      <div className="flex flex-col flex-grow p-5">
        <div className="h-5 w-3/4 bg-soft-stone rounded mb-2" />
        <div className="h-4 w-full bg-soft-stone rounded mb-1.5" />
        <div className="h-4 w-full bg-soft-stone rounded mb-1.5" />
        <div className="h-4 w-2/3 bg-soft-stone rounded" />
      </div>
    </div>
  )
}

function SkeletonSection() {
  return (
    <div className="mb-20">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-7 w-48 bg-soft-stone rounded animate-pulse" />
        <div className="flex-grow h-px mt-2 bg-divider-soft" />
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
  const { data, isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => getAchievements().then(r => r.data),
  })

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20 bg-canvas pt-28">
        <div className="px-6 mx-auto max-w-7xl">
          <div className="max-w-2xl mx-auto mb-16 text-center">
            <div className="h-4 w-40 bg-soft-stone rounded animate-pulse mx-auto mb-3" />
            <div className="h-12 w-64 bg-soft-stone rounded animate-pulse mx-auto mb-4" />
            <div className="h-5 w-96 bg-soft-stone rounded animate-pulse mx-auto" />
          </div>
          <SkeletonSection />
          <SkeletonSection />
        </div>
      </div>
    )
  }

  const allAchievements = data?.data || []
  
  // Assuming the DB schema has name as title, desc as description, year as date (we'll format it), photo as image
  const formatAch = (a) => ({
    name: a.title,
    desc: a.description,
    year: a.date ? new Date(a.date).getFullYear() : '',
    photo: a.image
  })

  const STUDENT_ACH = allAchievements.filter(a => a.category === 'student').map(formatAch)
  const FACULTY_ACH = allAchievements.filter(a => a.category === 'faculty').map(formatAch)
  const AWARDS = allAchievements.filter(a => a.category === 'awards').map(formatAch)

  return (
    <div className="min-h-screen pb-20 bg-canvas pt-28">
      <div className="px-6 mx-auto max-w-7xl">
        <div className="max-w-2xl mx-auto mb-16 text-center">
          <span className="font-sans text-[13px] font-semibold text-primary uppercase tracking-[0.2em] mb-3 block">Pride of the Department</span>
          <h1 className="font-display font-semibold text-[40px] md:text-[56px] text-ink leading-[1.1] tracking-tight">
            Achievements
          </h1>
          <p className="font-sans text-[16px] text-ink-muted-80 mt-6 leading-relaxed">
            Celebrating the outstanding accomplishments of our students, faculty, and the electrical engineering department.
          </p>
        </div>

        <div className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-display font-semibold text-[28px] text-ink tracking-tight">Student Achievements</h2>
            <div className="flex-grow h-px mt-2 bg-divider-soft"></div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {STUDENT_ACH.map(a => <AchCard key={a.name} item={a} badgeText="Student" />)}
          </div>
        </div>

        <div className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-display font-semibold text-[28px] text-ink tracking-tight">Faculty Achievements</h2>
            <div className="flex-grow h-px mt-2 bg-divider-soft"></div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {FACULTY_ACH.map(a => <AchCard key={a.name} item={a} badgeText="Faculty" />)}
          </div>
        </div>

        <div className="mb-10">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-display font-semibold text-[28px] text-ink tracking-tight">Awards & Certificates</h2>
            <div className="flex-grow h-px mt-2 bg-divider-soft"></div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {AWARDS.map(a => <AchCard key={a.name} item={a} badgeText="Award" />)}
          </div>
        </div>

      </div>
    </div>
  )
}
