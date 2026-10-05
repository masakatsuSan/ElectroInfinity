import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, ArrowRight, ExternalLink } from 'lucide-react'
import { getResources, downloadResource } from '../api/resources'
import { getSubjects } from '../api/subjects'
import { getYTLectures } from '../api/ytLectures'
import { useAuth } from '../context/AuthContext'
import SEO from '../components/SEO'
import { BRAND_NAME } from '../config/brand'
import UploaderInfo from '../components/UploaderInfo'
import ScrollReveal from '../components/ScrollReveal'

const FILTERS = [
  { id: '',          label: 'All' },
  { id: 'notes',     label: 'Notes' },
  { id: 'books',     label: 'Books' },
  { id: 'organisers',label: 'Organisers' },
  { id: 'pyqs',      label: 'PYQs' },
  { id: 'yt playlist',label: 'YT Playlist' },
  { id: 'yt-lectures', label: 'YT Lectures' },
]

const SEMS = [1,2,3,4,5,6,7,8]

export default function Resources() {
  const [activeFilter, setActiveFilter] = useState('')
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

  const { data: resData, isLoading: rLoading } = useQuery({
    queryKey: ['resources', activeFilter, semesterFilter, subjectFilter],
    queryFn: () => {
      const params = {}
      if (activeFilter) params.type = activeFilter
      if (semesterFilter) params.semester = Number(semesterFilter)
      if (subjectFilter) params.subject = subjectFilter
      return getResources(params).then(r => r.data)
    },
  })

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => getSubjects({ status: 'approved' }).then(r => r.data),
  })
  const subjects = subjectsData?.data || []

  const isLoading = rLoading
  const data = resData?.data

  const isYTFilters = activeFilter === 'yt-lectures'

  const { data: ytData, isLoading: ytLoading } = useQuery({
    queryKey: ['yt-lectures', semesterFilter, subjectFilter],
    enabled: isYTFilters,
    queryFn: () => {
      const params = {}
      if (semesterFilter) params.semester = Number(semesterFilter)
      if (subjectFilter) params.subject = subjectFilter
      return getYTLectures(params).then(r => r.data)
    },
  })
  const ytLectures = ytData?.data || []

  return (
    <div className="min-h-screen bg-white text-ink pt-36 pb-28">
      <SEO
        title={`Resources &amp; Bulletins | ${BRAND_NAME}`}
        description={`Study materials, PYQs, assignments, lab manuals, and YouTube lectures for ${BRAND_NAME} members.`}
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
          Curated repository of previous year questions, class notes, and laboratory manuals, shared by seniors for their juniors. Student-maintained and unofficial &mdash; always confirm anything important with the department.
        </p>
          <Link to="/resources/folders" className="inline-flex items-center gap-2 font-sans text-[13px] font-semibold text-primary border border-primary rounded-full px-4 py-2 hover:bg-primary hover:text-white transition-colors duration-200 mt-2">
            Browse by Folder (Series)
            <ArrowRight size={14} />
          </Link>
        </div>
      </ScrollReveal>

        <div className="flex gap-2 pb-4 mb-10 overflow-x-auto border-b border-hairline scrollbar-thin">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => {
                setActiveFilter(f.id)
                setSemesterFilter('')
                setSubjectFilter('')
              }}
              className={'font-sans text-[13px] sm:text-[14px] font-medium px-4 py-2.5 rounded-full transition-all whitespace-nowrap shrink-0 ' +
                (activeFilter === f.id
                  ? 'bg-primary text-white'
                  : 'bg-soft-stone text-muted hover:text-ink')}
            >
              {f.label}
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

        <div key={activeFilter} className="animate-in min-h-[calc(100vh-15rem)] min-h-[600px]">
          {isLoading || (isYTFilters && ytLoading) ? (
            <SkeletonGrid />
          ) : isYTFilters ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {ytLectures.length > 0
                ? ytLectures.map(lecture =>
                    <YTLectureCard key={lecture._id} lecture={lecture} />
                  )
                : <Empty label={activeFilter ? activeFilter.toLowerCase().replace(/[-\s]/g, ' ') : 'yt lectures'} user={user} />}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data?.length > 0
                ? data.map(item =>
                    <ResourceCard
                      key={item._id}
                      resource={item}
                    />
                  )
                : <Empty label={activeFilter ? activeFilter.toLowerCase() : 'resources'} user={user} />}
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
        <div className="absolute left-0 z-50 mt-2 w-full min-w-[220px] bg-white border border-hairline rounded-lg shadow-lg py-1.5 animate-in fade-in duration-150 origin-top overflow-hidden"
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
          rel="noopener noreferrer"
          download={r.fileName || undefined}
          className="button-primary !py-1 !px-3 !text-[12px] !bg-primary text-white"
        >
          Download ↓
        </a>
      </div>
    </div>
  )
}

function YTLectureCard({ lecture }) {
  const ytUrl = `https://www.youtube.com/watch?v=${lecture.youtubeVideoId}`

  return (
    <div className="flex flex-col justify-between p-0 transition-colors border border-hairline bg-white rounded-lg hover:bg-soft-stone/30 group overflow-hidden">
      <a
        href={ytUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative w-full aspect-video bg-black overflow-hidden"
      >
        <img
          src={lecture.thumbnail || `https://img.youtube.com/vi/${lecture.youtubeVideoId}/hqdefault.jpg`}
          alt={lecture.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <span className="absolute bottom-2 left-2 font-mono text-[11px] font-medium uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-black/60 text-white border border-white/20">
          Lec {lecture.lectureNumber}
        </span>
      </a>

      <div className="p-5">
        <h3 className="font-sans text-[15px] font-medium text-ink leading-snug line-clamp-2">
          {lecture.title}
        </h3>
        <div className="flex items-center gap-2 mt-2.5">
          {lecture.semester && (
            <span className="font-mono text-[11px] font-medium uppercase px-2.5 py-0.5 rounded-full bg-soft-stone text-ink">
              Sem {lecture.semester}
            </span>
          )}
          {lecture.subject && (
            <span className="font-sans text-[12px] text-muted truncate">{lecture.subject}</span>
          )}
        </div>
        <UploaderInfo user={lecture.uploadedBy} size="w-5 h-5" />

        <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-hairline">
          <a
            href={ytUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-sans text-[12px] font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            <ExternalLink size={13} />
            Watch on YouTube
          </a>
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
