import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, Play, ArrowRight } from 'lucide-react'
import { getResources, downloadResource } from '../api/resources'
import { getSubjects } from '../api/subjects'
import { getYTLectures } from '../api/ytLectures'
import { useAuth } from '../context/AuthContext'
import SEO from '../components/SEO'
import UploaderInfo from '../components/UploaderInfo'
import ScrollReveal from '../components/ScrollReveal'

const TABS = [
  { id: 'notes',        label: 'Study Materials',  type: 'notes' },
  { id: 'pyqs',         label: 'PYQs',             type: 'pyqs' },
  { id: 'assignment',   label: 'Assignments',      type: 'assignment' },
  { id: 'lab_manual',   label: 'Lab Manuals',      type: 'lab_manual' },
  { id: 'yt_lectures',  label: 'YT Lectures',      type: 'yt_lectures' },
]

const SEMS = [1,2,3,4,5,6,7,8]

export default function Resources() {
  const [activeTab, setActiveTab] = useState(TABS[0])
  const [semesterFilter, setSemesterFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
  )
  const { user } = useAuth()

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)')
    const handler = (e) => setIsDesktop(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  const isYTLectures = activeTab.type === 'yt_lectures'

  const { data: resData, isLoading: rLoading } = useQuery({
    queryKey: ['resources', activeTab.type, semesterFilter, subjectFilter],
    queryFn: () => {
      const params = { type: activeTab.type }
      if (semesterFilter) params.semester = Number(semesterFilter)
      if (subjectFilter) params.subject = subjectFilter
      return getResources(params).then(r => r.data)
    },
    enabled: !isYTLectures,
  })

  const { data: ytData, isLoading: ytLoading } = useQuery({
    queryKey: ['yt-lectures', semesterFilter, subjectFilter],
    queryFn: () => {
      const params = {}
      if (semesterFilter) params.semester = Number(semesterFilter)
      if (subjectFilter) params.subject = subjectFilter
      return getYTLectures(params).then(r => r.data)
    },
    enabled: isYTLectures,
  })

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => getSubjects({ status: 'approved' }).then(r => r.data),
  })
  const subjects = subjectsData?.data || []

  const isLoading = isYTLectures ? ytLoading : rLoading
  const data = isYTLectures ? ytData?.data : resData?.data

  return (
    <div className="min-h-screen bg-white text-ink pt-36 pb-28">
      <SEO
        title="Resources & Bulletins | Electro Infinity"
        description="Study materials, PYQs, assignments, lab manuals, and YouTube lectures for Electro Infinity members."
        path="/resources"
      />

      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
      <ScrollReveal variant="fadeUp">
        <div className="max-w-3xl mb-12">
          <span className="font-mono text-[12px] uppercase tracking-wider text-signature-coral font-medium block mb-2">
            Academic Vault
          </span>
          <h1 className="font-display text-[40px] md:text-[56px] font-normal tracking-tight text-ink mb-4">
            Resources & Bulletins
          </h1>
          <p className="font-sans text-[17px] text-body leading-relaxed">
          Curated repository of previous year questions, class notes, laboratory manuals, and official departmental announcements.
        </p>
          <Link to="/resources/folders" className="inline-flex items-center gap-2 font-sans text-[13px] font-semibold text-primary border border-primary rounded-full px-4 py-2 hover:bg-primary hover:text-white transition-colors duration-200 mt-2">
            Browse by Folder (Series)
            <ArrowRight size={14} />
          </Link>
        </div>
      </ScrollReveal>

        <div className="flex gap-2 pb-4 mb-10 overflow-x-auto border-b border-hairline scrollbar-thin">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab)
                setSemesterFilter('')
                setSubjectFilter('')
              }}
              className={'font-sans text-[13px] sm:text-[14px] font-medium px-4 py-2.5 rounded-full transition-all whitespace-nowrap shrink-0 ' +
                (activeTab.id === tab.id
                  ? 'bg-primary text-white'
                  : 'bg-soft-stone text-muted hover:text-ink')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 mb-6 w-full">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3 min-w-0 w-full sm:w-auto">
            <label className="font-sans text-[13px] font-medium text-muted">Filter by Semester:</label>
            <FilterSelect
              value={semesterFilter}
              onChange={setSemesterFilter}
              options={[{ value: '', label: 'All Semesters' }, ...SEMS.map(s => ({ value: String(s), label: `Semester ${s}` }))]}
              placeholder="All Semesters"
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3 min-w-0 w-full sm:w-auto">
            <label className="font-sans text-[13px] font-medium text-muted">Filter by Subject:</label>
            <FilterSelect
              value={subjectFilter}
              onChange={setSubjectFilter}
              options={[
                { value: '', label: 'All Subjects' },
                ...(semesterFilter
                  ? subjects.filter(s => s.semester === Number(semesterFilter))
                  : subjects
                ).map(s => ({ value: s.name, label: s.name })),
              ]}
              placeholder="All Subjects"
            />
          </div>
        </div>

        <div key={activeTab.id} className="animate-in h-[calc(100vh-15rem)] min-h-[600px]">
          {isLoading ? (
            <SkeletonGrid />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data?.length > 0
                ? data.map(item =>
                    isYTLectures
                      ? <YTLectureCard key={item._id} lecture={item} />
                      : <ResourceCard
                          key={item._id}
                          resource={item}
                        />
                  )
                : <Empty label={activeTab.label.toLowerCase()} user={user} />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FilterSelect({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const selected = options.find(o => o.value === value)

  const handleSelect = useCallback((option) => {
    onChange(option.value)
    setOpen(false)
  }, [onChange])

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={'flex items-center gap-2 w-full min-w-0 rounded-lg border px-4 py-2.5 text-[14px] font-sans transition-all duration-150 cursor-pointer select-none ' +
          (open
            ? 'border-primary bg-soft-stone/40'
            : 'border-hairline bg-white text-ink hover:border-ink/30 hover:shadow-sm')}
        style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
      >
        <span className={!value ? 'text-muted' : 'text-ink'}>{selected?.label || placeholder}</span>
        <ChevronDown
          size={16}
          className={'text-muted transition-transform duration-200 ' + (open ? 'rotate-180' : '')}
          style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
        />
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-2 w-full max-w-[calc(100vw-32px)] min-w-[220px] bg-white border border-hairline rounded-lg shadow-lg py-1.5 animate-in fade-in duration-150 origin-top overflow-hidden"
          style={{ animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}>
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option)}
              className={'w-full text-left px-4 py-2 text-[14px] font-sans transition-colors break-words ' +
                (option.value === value
                  ? 'bg-primary text-white'
                  : 'text-ink hover:bg-soft-stone')}
              style={{ transitionDuration: '0.22s', transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ResourceCard({ resource: r }) {
  const date = new Date(r.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  return (
    <div className="flex flex-col justify-between p-6 transition-colors border border-hairline bg-white rounded-lg hover:bg-soft-stone/30 group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="font-mono text-[11px] font-medium uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-soft-stone text-ink border border-hairline">
            {r.type?.replace('_', ' ') || 'Resource'}
          </span>
          {r.semester && (
            <span className="font-mono text-[11px] font-medium uppercase px-2.5 py-0.5 rounded-full bg-soft-stone text-ink">
              Sem {r.semester}
            </span>
          )}
        </div>

        <h3 className="font-sans text-[16px] font-medium text-ink leading-snug truncate">
          {r.title}
        </h3>
        {r.subject && (
          <p className="font-sans text-[13px] text-muted mt-1.5">{r.subject}</p>
        )}
        <UploaderInfo user={r.uploadedBy} size="w-6 h-6" />
      </div>

      <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-hairline text-[12px]">
        <a
          href={downloadResource(r._id)}
          target="_blank"
          rel="noreferrer"
          className="button-primary !py-1 !px-3 !text-[12px] !bg-primary text-white"
        >
          Download ↓
        </a>
      </div>
    </div>
  )
}

function YTLectureCard({ lecture: l }) {
  const thumbnail = l.thumbnail || `https://img.youtube.com/vi/${l.youtubeVideoId}/maxresdefault.jpg`
  const youtubeUrl = `https://www.youtube.com/watch?v=${l.youtubeVideoId}`

  return (
    <div className="flex flex-col overflow-hidden transition-colors border border-hairline bg-white rounded-lg hover:bg-soft-stone/30 group">
      <div className="relative overflow-hidden aspect-video bg-soft-stone">
        <img
          src={thumbnail}
          alt={l.title}
          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.target.src = `https://img.youtube.com/vi/${l.youtubeVideoId}/hqdefault.jpg`
          }}
        />
        <span className="absolute top-3 left-3 font-mono text-[11px] font-medium uppercase tracking-wider px-2.5 py-1 rounded-md bg-ink/80 text-white">
          Lec {l.lectureNumber}
        </span>
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noreferrer"
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="flex items-center justify-center w-12 h-12 transition-transform rounded-full bg-white/90 group-hover:scale-110">
            <Play size={20} className="ml-1 text-primary" fill="currentColor" />
          </span>
        </a>
      </div>

      <div className="flex flex-col flex-1 p-5">
        <h3 className="font-sans text-[15px] font-medium text-ink leading-snug line-clamp-2">
          {l.title}
        </h3>
        <UploaderInfo user={l.uploadedBy} size="w-6 h-6" />
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {l.semester && (
            <span className="font-mono text-[11px] font-medium uppercase px-2.5 py-0.5 rounded-full bg-soft-stone text-ink">
              Sem {l.semester}
            </span>
          )}
          {l.subject && (
            <span className="font-sans text-[12px] text-muted">{l.subject}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border border-hairline bg-soft-stone/40 rounded-lg h-[160px] skeleton-shimmer" />
      ))}
    </div>
  )
}

function Empty({ label, user }) {
  return (
    <div className="py-16 text-center border col-span-full border-hairline bg-soft-stone rounded-lg px-4">
      <span className="font-mono text-[12px] font-medium uppercase tracking-wider text-muted block mb-2">
        No Content Available
      </span>
      <p className="font-sans text-[16px] text-body">
        No {label} uploaded yet.
        {user ? ' Ask your CR or Faculty to add content.' : ' Sign in to view batch-specific content.'}
      </p>
    </div>
  )
}
