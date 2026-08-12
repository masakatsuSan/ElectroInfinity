import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAchievements } from '../api/achievements'

function AchCard({ item, badgeText }) {
  return (
    <div className="flex flex-col overflow-hidden transition-all duration-300 transform border group bg-surface-pearl border-divider-soft rounded-2xl hover:shadow-xl hover:-translate-y-1">
      <div className="relative h-48 overflow-hidden sm:h-56 bg-canvas">
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

export default function Achievements() {
  const { data, isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => getAchievements().then(r => r.data),
  })

  const allAchievements = data?.data || []
  
  // Assuming the DB schema has name as title, desc as description, year as date (we'll format it), photo as image
  const formatAch = (a) => ({
    name: a.title,
    desc: a.description,
    year: a.date ? new Date(a.date).getFullYear() : '',
    photo: a.image
  })

  const STUDENT_ACH = allAchievements.filter(a => a.category === 'academic' || a.category === 'sports').map(formatAch)
  const FACULTY_ACH = allAchievements.filter(a => a.category === 'other').map(formatAch) // assuming faculty falls under other or create a new category later
  const AWARDS = allAchievements.filter(a => a.category === 'cultural').map(formatAch) // just placeholder categorizations

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

        <div className="pt-8 mt-16 text-center border-t border-divider-soft">
          <p className="font-sans text-[11px] uppercase tracking-[0.15em] text-ink-muted-48">
            Replace placeholder data with real achievements — or connect to MongoDB in Phase 4 admin panel
          </p>
        </div>
      </div>
    </div>
  )
}
