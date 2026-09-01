import { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Play } from 'lucide-react'
import { getResources, getDownloadUrl } from '../api/resources'
import { getSubjects } from '../api/subjects'
import { getYTLectures } from '../api/ytLectures'
import { useAuth } from '../context/AuthContext'
import SEO from '../components/SEO'

const TABS = [
  { id: 'notes',        label: 'Study Materials',  type: 'notes' },
  { id: 'pyq',          label: 'PYQs',             type: 'pyq' },
  { id: 'assignment',   label: 'Assignments',      type: 'assignment' },
  { id: 'lab_manual',   label: 'Lab Manuals',      type: 'lab_manual' },
  { id: 'yt_lectures',  label: 'YT Lectures',      type: 'yt_lectures' },
]

const SEMS = [1,2,3,4,5,6,7,8]

export default function Resources() {
  const [activeTab, setActiveTab] = useState(TABS[0])
  const [semesterFilter, setSemesterFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()

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
    <div className="min-h-screen bg-canvas text-ink pt-36 pb-28">
      <SEO
        title="Resources & Bulletins | Electro Infinity"
        description="Study materials, PYQs, assignments, lab manuals, and YouTube lectures for Electro Infinity members."
        path="/resources"
      />

      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <span className="font-mono text-[12px] uppercase tracking-wider text-coral font-semibold block mb-2">
            Academic Vault
          </span>
          <h1 className="font-display text-[40px] md:text-[56px] font-normal tracking-tight text-ink mb-4">
            Resources & Bulletins
          </h1>
          <p className="font-sans text-[17px] text-body-muted leading-relaxed">
            Curated repository of previous year questions, class notes, laboratory manuals, and official departmental announcements.
          </p>
        </div>

        {/* Tab selector pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-10 border-b border-hairline">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab)
                setSemesterFilter('')
                setSubjectFilter('')
              }}
              className={`font-sans text-[14px] font-semibold px-5 py-2 rounded-full transition-all whitespace-nowrap ${
                activeTab.id === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-soft-stone text-body-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Semester filter */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <label className="font-sans text-[13px] font-medium text-ink-muted-80">Filter by Semester:</label>
          <FilterSelect
            value={semesterFilter}
            onChange={setSemesterFilter}
            options={[{ value: '', label: 'All Semesters' }, ...SEMS.map(s => ({ value: String(s), label: `Semester ${s}` }))]}
            placeholder="All Semesters"
          />
        </div>

        {/* Subject filter */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <label className="font-sans text-[13px] font-medium text-ink-muted-80">Filter by Subject:</label>
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

        {/* Content */}
        <div key={activeTab.id} className="animate-in fade-in duration-200">
          {isLoading ? (
            <SkeletonGrid />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data?.length > 0
                ? data.map(item =>
                    isYTLectures
                      ? <YTLectureCard key={item._id} lecture={item} />
                      : <ResourceCard key={item._id} resource={item} />
                  )
                : <Empty label={activeTab.label.toLowerCase()} user={user} />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Custom Filter Select ────────────────────────────────────────── */
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
        className={`
          flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[14px] font-sans
          transition-all duration-150 cursor-pointer select-none
          ${open
            ? 'border-primary ring-1 ring-primary bg-soft-stone/40'
            : 'border-hairline bg-canvas text-ink hover:border-ink/30 hover:shadow-sm'
          }
        `}
      >
        <span className={!value ? 'text-body-muted' : 'text-ink'}>{selected?.label || placeholder}</span>
        <ChevronDown
          size={16}
          className={`text-slate transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full min-w-[220px] bg-white border border-hairline rounded-xl shadow-lg py-1.5 animate-in fade-in duration-150 origin-top">
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option)}
              className={`
                w-full text-left px-4 py-2 text-[14px] font-sans transition-colors
                ${option.value === value
                  ? 'bg-primary text-white'
                  : 'text-ink hover:bg-soft-stone'
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Resource Card ────────────────────────────────────────────────── */
function ResourceCard({ resource: r }) {
  const date = new Date(r.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  return (
    <div className="border border-hairline bg-canvas rounded-2xl p-6 shadow-card hover:bg-soft-stone/30 transition-colors flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-pale-blue text-action-blue border border-blue-200">
            {r.type?.replace('_', ' ') || 'Resource'}
          </span>
          {r.semester && (
            <span className="font-mono text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-soft-stone text-ink">
              Sem {r.semester}
            </span>
          )}
        </div>

        <h3 className="font-sans text-[16px] font-semibold text-ink leading-snug group-hover:text-action-blue transition-colors">
          {r.title}
        </h3>
        {r.subject && (
          <p className="font-sans text-[13px] text-body-muted mt-1.5">{r.subject}</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-hairline text-[12px]">
        <a
          href={r.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="button-primary !py-1 !px-3 !text-[12px] !bg-soft-stone !text-ink border border-hairline hover:bg-hairline"
        >
          View
        </a>
        <a
          href={getDownloadUrl(r._id)}
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

/* ── YT Lecture Card ──────────────────────────────────────────────── */
function YTLectureCard({ lecture: l }) {
  const thumbnail = l.thumbnail || `https://img.youtube.com/vi/${l.youtubeVideoId}/maxresdefault.jpg`
  const youtubeUrl = `https://www.youtube.com/watch?v=${l.youtubeVideoId}`

  return (
    <div className="border border-hairline bg-canvas rounded-2xl shadow-card hover:bg-soft-stone/30 transition-colors flex flex-col overflow-hidden group">
      <div className="relative aspect-video bg-soft-stone overflow-hidden">
        <img
          src={thumbnail}
          alt={l.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = `https://img.youtube.com/vi/${l.youtubeVideoId}/hqdefault.jpg`
          }}
        />
        <span className="absolute top-3 left-3 font-mono text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-ink/80 text-white">
          Lec {l.lectureNumber}
        </span>
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noreferrer"
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Play size={20} className="text-primary ml-1" fill="currentColor" />
          </span>
        </a>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-sans text-[15px] font-semibold text-ink leading-snug line-clamp-2">
          {l.title}
        </h3>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {l.semester && (
            <span className="font-mono text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-soft-stone text-ink">
              Sem {l.semester}
            </span>
          )}
          {l.subject && (
            <span className="font-sans text-[12px] text-body-muted">{l.subject}</span>
          )}
        </div>
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noreferrer"
          className="button-primary !py-1.5 !px-4 !text-[13px] !bg-soft-stone !text-ink border border-hairline hover:bg-hairline mt-4 self-start"
        >
          Watch on YouTube
        </a>
      </div>
    </div>
  )
}

/* ── Skeleton ───────────────────────────────────────────────────── */
function SkeletonGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border border-hairline bg-soft-stone/40 rounded-2xl h-[160px] animate-pulse" />
      ))}
    </div>
  )
}

/* ── Empty state ────────────────────────────────────────────────── */
function Empty({ label, user }) {
  return (
    <div className="col-span-full border border-hairline bg-soft-stone rounded-2xl py-16 text-center">
      <span className="font-mono text-[12px] font-bold uppercase tracking-wider text-slate block mb-2">
        No Content Available
      </span>
      <p className="font-sans text-[16px] text-body-muted">
        No {label} uploaded yet.
        {user ? ' Ask your CR or Faculty to add content.' : ' Sign in to view batch-specific content.'}
      </p>
    </div>
  )
}
