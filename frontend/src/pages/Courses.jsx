import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getSubjects } from '../api/subjects'
import SEO from '../components/SEO'

const SEMESTER_PILLS = [3, 4, 5, 6, 7, 8]

function typeLabel(code) {
  if (!code) return 'Course'
  if (code.startsWith('PC'))  return 'Program Core'
  if (code.startsWith('PE'))  return 'Professional Elective'
  if (code.startsWith('OE'))  return 'Open Elective'
  if (code.startsWith('BS'))  return 'Basic Science'
  if (code.startsWith('ES'))  return 'Allied / Interdisciplinary'
  if (code.startsWith('HM'))  return 'Humanities & Management'
  if (code.startsWith('MC'))  return 'Mandatory Course'
  if (code.startsWith('PW'))  return 'Project / Work'
  if (code.startsWith('PW-EE 782')) return 'Seminar'
  return 'Course'
}

export default function Courses() {
  const [selectedSem, setSelectedSem] = useState(3)
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['courses', 'approved'],
    queryFn: () => getSubjects({}).then(r => r.data),
  })

  const all = data?.data || []

  const bySem = {}
  all.forEach((s) => { (bySem[s.semester] = bySem[s.semester] || []).push(s) })
  const subjects = bySem[selectedSem] || []

  const totalCredits = subjects.reduce((a, s) => a + (s.credits || 0), 0)

  return (
    <div className="min-h-screen bg-canvas text-ink pt-36 pb-28">
      <SEO
        title="Curriculum &amp; Courses | Electro Infinity"
        description="Semester-wise subjects under the MAKAUT-affiliated B.Tech Electrical Engineering curriculum."
      />

      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        <div className="max-w-3xl mb-12">
          <span className="font-mono text-[12px] uppercase tracking-wider text-coral font-semibold block mb-2">
            Academic Curriculum
          </span>
          <h1 className="font-display text-[40px] md:text-[56px] font-normal tracking-tight text-ink mb-4">
            B.Tech Electrical Engineering
          </h1>
          <p className="font-sans text-[17px] text-body-muted leading-relaxed">
            MAKAUT-affiliated 4-year degree roadmap spanning power systems, circuits, electronics, and lab practicums.
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 mb-10 scrollbar-none border-b border-hairline">
          {SEMESTER_PILLS.map((sem) => (
            <button
              key={sem}
              onClick={() => setSelectedSem(sem)}
              className={'font-sans text-[14px] font-semibold px-5 py-2 rounded-full transition-all whitespace-nowrap ' + (selectedSem === sem ? 'bg-primary text-white shadow-sm' : 'bg-soft-stone text-body-muted hover:text-ink')}
            >
              Semester {sem}
            </button>
          ))}
        </div>

        {isLoading ? (
          <SkeletonGrid />
        ) : (
          <div className="border border-hairline bg-canvas rounded-2xl overflow-hidden shadow-card">
            <div className="p-6 bg-soft-stone border-b border-hairline flex items-center justify-between">
              <h2 className="font-display text-[20px] font-bold text-ink">
                Semester {selectedSem} Course List
              </h2>
              <span className="font-mono text-[12px] text-slate">
                {subjects.length} Subjects &middot; Total {totalCredits} Credits
              </span>
            </div>

            <div className="divide-y divide-hairline">
              {subjects.length > 0 ? (
                subjects.map((sub) => (
                  <div
                    key={sub._id || sub.code}
                    onClick={() => navigate('/subject/' + encodeURIComponent(sub._id))}
                    className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-soft-stone/40 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="font-mono text-[12px] font-bold uppercase tracking-wider px-3 py-1 rounded-md bg-pale-blue text-action-blue border border-blue-200 flex-shrink-0">
                        {sub.code}
                      </span>
                      <div>
                        <h3 className="font-sans text-[16px] font-semibold text-ink">{sub.name}</h3>
                        <p className="font-sans text-[12px] text-body-muted">{typeLabel(sub.code)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 flex-shrink-0">
                      <span className="font-mono text-[13px] font-semibold text-ink bg-soft-stone px-3 py-1 rounded-full">
                        {(sub.credits || 0)} {(sub.credits || 0) === 1 ? 'Credit' : 'Credits'}
                      </span>
                      <span className="text-[13px] font-medium text-action-blue">
                        Syllabus Details &rarr;
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-body-muted font-sans">
                  No courses scheduled for this semester yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="border border-hairline bg-canvas rounded-2xl overflow-hidden shadow-card divide-y divide-hairline">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="p-5 md:p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-7 bg-soft-stone rounded animate-pulse"></div>
            <div className="h-4 w-48 bg-soft-stone rounded animate-pulse"></div>
          </div>
          <div className="h-4 w-20 bg-soft-stone rounded animate-pulse"></div>
        </div>
      ))}
    </div>
  )
}
