import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { GitBranch, ExternalLink, Heart, Code2, Plus, Search, X } from 'lucide-react'
import { getProjects, likeProject, createProject } from '../api/projects'
import { useAuth } from '../context/AuthContext'
import SEO from '../components/SEO'

export default function Projects() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjects().then(r => r.data),
  })

  const projects = data?.data || []

  const filtered = useMemo(() => {
    if (!search.trim()) return projects
    const q = search.toLowerCase()
    return projects.filter(p =>
      (p.techStack || []).some(t => t.toLowerCase().includes(q)) ||
      p.title.toLowerCase().includes(q) ||
      (p.author?.name || '').toLowerCase().includes(q)
    )
  }, [projects, search])

  const likeMut = useMutation({
    mutationFn: (id) => likeProject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })

  const createMut = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      setShowModal(false)
    },
  })

  return (
    <div className="min-h-screen bg-canvas text-ink pt-36 pb-28">
      <SEO
        title="Student Projects | Electro Infinity"
        description="Showcase of student projects, prototypes, and engineering builds from AGEMC."
      />

      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <span className="font-mono text-[12px] uppercase tracking-wider text-coral font-semibold block mb-2">
            Student Innovation
          </span>
          <h1 className="font-display text-[40px] md:text-[56px] font-normal tracking-tight text-ink mb-4">
            Student Projects
          </h1>
          <p className="font-sans text-[17px] text-body-muted leading-relaxed">
            Explore prototypes, capstones, and research builds from fellow students. Filter by tech stack or share your own work.
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="relative w-full sm:max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by tech stack or title…"
              className="w-full bg-soft-stone/60 border border-hairline rounded-xl pl-9 pr-4 py-2.5 text-[14px] font-sans text-ink placeholder:text-ink-muted-48 focus:outline-none focus:border-primary/40 transition-colors"
            />
          </div>

          {user && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 bg-ink text-canvas px-5 py-2.5 rounded-xl text-[14px] font-semibold hover:bg-ink/90 transition-colors shadow-sm"
            >
              <Plus size={16} />
              Submit Project
            </button>
          )}
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border border-hairline bg-soft-stone/40 rounded-2xl h-[240px] animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p) => (
              <ProjectCard key={p._id} project={p} liked={!!user && (p.likedBy?.includes(user._id))} onLike={() => likeMut.mutate(p._id)} liking={likeMut.isPending} />
            ))}
          </div>
        ) : (
          <div className="border border-hairline bg-soft-stone/30 rounded-2xl p-12 text-center">
            <Code2 size={32} className="mx-auto text-slate mb-3" />
            <p className="font-sans text-[15px] text-body-muted">
              {search ? 'No projects match your search.' : 'No projects submitted yet. Be the first to share your work!'}
            </p>
          </div>
        )}
      </div>

      {/* Submit Modal */}
      {showModal && (
        <SubmitModal
          onClose={() => setShowModal(false)}
          onSubmit={(data) => createMut.mutate(data)}
          loading={createMut.isPending}
          error={createMut.error?.response?.data?.error || ''}
        />
      )}
    </div>
  )
}

function ProjectCard({ project, liked, onLike, liking }) {
  const description = project.description || ''
  const truncated = description.length > 140 ? description.slice(0, 140) + '…' : description
  const techStack = project.techStack || []
  const authorName = project.author?.name || 'Unknown'
  const isPending = !project.isApproved

  return (
    <Link to={`/projects/${project._id}`} className="block h-full">
      <div className="border border-hairline bg-canvas rounded-2xl p-6 shadow-card hover:border-slate/30 transition-all flex flex-col h-full">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="font-display text-[20px] font-bold text-ink leading-snug">
              {project.title}
            </h3>
            {isPending && (
              <span className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-soft-stone text-slate border border-hairline">
                Pending Approval
              </span>
            )}
          </div>

          <p className="font-sans text-[14px] text-body-muted leading-relaxed mb-4">
            {truncated}
          </p>

          {techStack.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {techStack.map((tech) => (
                <span
                  key={tech}
                  className="font-mono text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-soft-stone text-ink border border-hairline"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}

          <p className="font-mono text-[12px] text-slate mb-4">
            by {authorName}
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-hairline">
          <div className="flex items-center gap-4">
            <span className="font-sans text-[13px] text-body-muted flex items-center gap-1">
              <Heart size={14} className={liked ? 'fill-coral text-coral' : 'text-slate'} />
              {project.likes?.length || 0}
            </span>

            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.preventDefault()}
                className="text-slate hover:text-ink transition-colors"
                aria-label="GitBranch"
              >
                <GitBranch size={16} />
              </a>
            )}

            {project.demoLink && (
              <a
                href={project.demoLink}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.preventDefault()}
                className="text-slate hover:text-ink transition-colors"
                aria-label="Live demo"
              >
                <ExternalLink size={16} />
              </a>
            )}
          </div>

          {!isPending && liked && (
            <button
              onClick={(e) => { e.preventDefault(); onLike() }}
              disabled={liking}
              className="text-[12px] font-semibold text-coral hover:text-coral-soft transition-colors disabled:opacity-50"
            >
              {liking ? 'Saving…' : 'Unlike'}
            </button>
          )}
          {!isPending && !liked && (
            <button
              onClick={(e) => { e.preventDefault(); onLike() }}
              disabled={liking}
              className="text-[12px] font-semibold text-slate hover:text-ink transition-colors disabled:opacity-50"
            >
              {liking ? 'Saving…' : 'Like'}
            </button>
          )}
        </div>
      </div>
    </Link>
  )
}

function SubmitModal({ onClose, onSubmit, loading, error }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    techStack: '',
    github: '',
    demoLink: '',
    images: '',
  })
  const [errors, setErrors] = useState({})

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    setErrors(errs => ({ ...errs, [k]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    if (!form.description.trim()) errs.description = 'Description is required'
    if (!form.techStack.trim()) errs.techStack = 'Add at least one technology'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      techStack: form.techStack.split(',').map(t => t.trim()).filter(Boolean),
      github: form.github.trim() || undefined,
      demoLink: form.demoLink.trim() || undefined,
      images: form.images.trim() ? form.images.split(',').map(u => u.trim()).filter(Boolean) : undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-canvas text-ink border border-divider-soft rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-divider-soft flex items-center justify-between">
          <div>
            <h3 className="font-display text-[22px] font-bold">Submit Project</h3>
            <p className="font-sans text-[13px] text-body-muted">
              Share your project with the department community.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-soft-stone border border-hairline flex items-center justify-center hover:bg-soft-stone/80 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Title */}
          <div>
            <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Project Title *</label>
            <input
              required
              value={form.title}
              onChange={set('title')}
              placeholder="e.g. Solar-Powered IoT Weather Station"
              className="w-full bg-surface-pearl border border-divider-soft rounded-xl px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary"
            />
            {errors.title && <p className="text-error text-[12px] mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Description *</label>
            <textarea
              required
              value={form.description}
              onChange={set('description')}
              placeholder="What does your project do? What problem does it solve?"
              rows={4}
              className="w-full bg-surface-pearl border border-divider-soft rounded-xl px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary resize-none"
            />
            {errors.description && <p className="text-error text-[12px] mt-1">{errors.description}</p>}
          </div>

          {/* Tech Stack */}
          <div>
            <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Tech Stack *</label>
            <input
              required
              value={form.techStack}
              onChange={set('techStack')}
              placeholder="e.g. React, Node.js, Arduino, TensorFlow"
              className="w-full bg-surface-pearl border border-divider-soft rounded-xl px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary"
            />
            <p className="font-sans text-[11px] text-ink-muted-48 mt-1">Separate technologies with commas.</p>
            {errors.techStack && <p className="text-error text-[12px] mt-1">{errors.techStack}</p>}
          </div>

          {/* GitBranch + Demo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">GitBranch Link</label>
              <input
                type="url"
                value={form.github}
                onChange={set('github')}
                placeholder="https://github.com/username/repo"
                className="w-full bg-surface-pearl border border-divider-soft rounded-xl px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Demo Link</label>
              <input
                type="url"
                value={form.demoLink}
                onChange={set('demoLink')}
                placeholder="https://your-demo.vercel.app"
                className="w-full bg-surface-pearl border border-divider-soft rounded-xl px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block font-sans text-[13px] font-semibold text-ink-muted-80 mb-1.5">Image URLs</label>
            <input
              value={form.images}
              onChange={set('images')}
              placeholder="Paste image URLs separated by commas"
              className="w-full bg-surface-pearl border border-divider-soft rounded-xl px-4 py-2.5 text-[15px] font-sans text-ink focus:outline-none focus:border-primary"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-[13px] text-error font-medium bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-[14px] font-semibold text-slate hover:text-ink transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="button-primary px-6 py-2.5 text-[14px]"
            >
              {loading ? 'Submitting…' : 'Submit Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
