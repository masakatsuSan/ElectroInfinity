import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getResources, getDownloadUrl } from '../api/resources'
import { getSubjects } from '../api/subjects'
import { useAuth } from '../context/AuthContext'
import SEO from '../components/SEO'

const TABS = [
  { id: 'notes',      label: 'Study Materials',  type: 'notes' },
  { id: 'pyq',        label: 'PYQs',             type: 'pyq' },
  { id: 'assignment', label: 'Assignments',      type: 'assignment' },
  { id: 'lab_manual', label: 'Lab Manuals',      type: 'lab_manual' },
  { id: 'syllabus',   label: 'Syllabus',         type: 'syllabus' },
]

const SEMS = [1,2,3,4,5,6,7,8]

export default function Resources() {
  const [activeTab, setActiveTab] = useState(TABS[0])
  const [semesterFilter, setSemesterFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: resData, isLoading: rLoading } = useQuery({
    queryKey: ['resources', activeTab.type, semesterFilter, subjectFilter],
    queryFn: () => {
      const params = { type: activeTab.type }
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

  return (
    <div className="min-h-screen bg-canvas text-ink pt-36 pb-28">
      <SEO
        title="Resources & Bulletins | Electro Infinity"
        description="Study materials, PYQs, assignments and announcements for Electro Infinity members."
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
        <div className="flex gap-2 overflow-x-auto pb-4 mb-10 scrollbar-none border-b border-hairline">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'syllabus') {
                  navigate('/courses')
                  return
                }
                setActiveTab(tab)
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
        <div className="mb-6">
          <label className="font-sans text-[13px] font-medium text-ink-muted-80 mr-3">Filter by Semester:</label>
          <select
            value={semesterFilter}
            onChange={e => setSemesterFilter(e.target.value)}
            className="bg-canvas border border-divider-soft rounded-lg px-4 py-2 text-[14px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value="">All Semesters</option>
            {SEMS.map(s => <option key={s} value={s}>Semester {s}</option>)}
          </select>
        </div>

        {/* Subject filter */}
        <div className="mb-6">
          <label className="font-sans text-[13px] font-medium text-ink-muted-80 mr-3">Filter by Subject:</label>
          <select
            value={subjectFilter}
            onChange={e => setSubjectFilter(e.target.value)}
            className="bg-canvas border border-divider-soft rounded-lg px-4 py-2 text-[14px] font-sans text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value="">All Subjects</option>
            {(semesterFilter ? subjects.filter(s => s.semester === Number(semesterFilter)) : subjects).map(s => (
              <option key={s._id} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div key={activeTab.id} className="animate-in fade-in duration-200">
          {isLoading ? (
            <SkeletonGrid />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {resData?.data?.length > 0
                ? resData.data.map(r => <ResourceCard key={r._id} resource={r} />)
                : <Empty label={activeTab.label.toLowerCase()} user={user} />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Resource Card ──────────────────────────────────────────────── */
function ResourceCard({ resource: r }) {
  const date = new Date(r.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  return (
    <div className="border border-hairline bg-canvas rounded-2xl p-6 shadow-card hover:bg-soft-stone/30 transition-colors flex flex-col justify-between group">
      <div>
        {/* Type and Sem badges */}
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

        {/* Title */}
        <h3 className="font-sans text-[16px] font-semibold text-ink leading-snug group-hover:text-action-blue transition-colors">
          {r.title}
        </h3>
        {r.subject && (
          <p className="font-sans text-[13px] text-body-muted mt-1.5">{r.subject}</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-hairline text-[12px]">
        <span className="font-mono text-slate">
          {date} · {r.downloadCount || 0} dl
        </span>
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
        No Files Available
      </span>
      <p className="font-sans text-[16px] text-body-muted">
        No {label} uploaded yet.
        {user ? ' Ask your CR or Faculty to upload.' : ' Sign in to view batch-specific content.'}
      </p>
    </div>
  )
}
