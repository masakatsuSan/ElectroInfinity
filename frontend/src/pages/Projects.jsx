import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { GitBranch, ExternalLink, Heart, Code2, Plus, Search, X } from 'lucide-react'
import { getProjects, likeProject, createProject } from '../api/projects'
import { useAuth } from '../context/AuthContext'
import SEO from '../components/SEO'
import UploaderInfo from '../components/UploaderInfo'

export default function Projects() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [myProjects, setMyProjects] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['projects', myProjects ? user?._id : 'all'],
    queryFn: () => getProjects(myProjects && user ? { author: user._id } : {}).then(r => r.data),
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
    <div className="min-h-screen bg-white text-ink pt-24 pb-24">
      <SEO
        title="Student Projects | Electro Infinity"
        description="Showcase of student projects, prototypes, and engineering builds from AGEMC."
      />

      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        <div className="max-w-3xl mb-12 md:mb-16">
          <span className="font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-signature-coral block mb-3">
            Student Innovation
          </span>
          <h1 className="font-display text-[40px] md:text-[56px] font-normal leading-[1.2] tracking-[0] text-ink mb-4">
            Student Projects
          </h1>
          <p className="font-sans text-[14px] text-body leading-[1.25] max-w-2xl">
            Explore prototypes, capstones, and research builds from fellow students. Filter by tech stack or share your own work.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div className="relative w-full sm:max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by tech stack or title…"
              className="w-full bg-white border border-hairline rounded-md pl-9 pr-4 py-2.5 text-[14px] font-sans text-ink placeholder:text-muted focus:outline-none focus:border-info-border transition-colors"
            />
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <button
                onClick={() => setMyProjects(!myProjects)}
                className={'inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-[14px] font-medium border transition-colors ' +
                  (myProjects
                    ? 'bg-ink text-white border-ink'
                    : 'bg-white border-hairline text-ink hover:border-ink')}
              >
                {myProjects ? 'Showing My Projects' : 'My Projects'}
              </button>
            )}
            {user && (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 bg-ink text-white px-5 py-2.5 rounded-md text-[14px] font-medium"
              >
                <Plus size={16} />
                Submit Project
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border border-hairline bg-surface-soft rounded-lg h-[240px] animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p) => (
              <ProjectCard key={p._id} project={p} liked={!!user && (p.likedBy?.includes(user._id))} onLike={() => likeMut.mutate(p._id)} liking={likeMut.isPending} />
            ))}
          </div>
        ) : (
          <div className="border border-hairline bg-surface-soft rounded-lg p-12 text-center">
            <Code2 size={32} className="mx-auto text-muted mb-3" />
            <p className="font-sans text-[14px] text-muted">
              {search ? 'No projects match your search.' : 'No projects submitted yet. Be the first to share your work!'}
            </p>
          </div>
        )}
      </div>

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

  return (
    <Link to={`/projects/${project._id}`} className="block h-full">
       <div className="border border-hairline bg-white rounded-lg p-6 transition-shadow flex flex-col h-full">
        <div className="flex-1">
          <div className="mb-3">
            <h3 className="font-sans text-[18px] font-medium text-ink leading-[1.4]">
              {project.title}
            </h3>
          </div>

          <p className="font-sans text-[14px] text-body leading-[1.25] mb-4">
            {truncated}
          </p>

          {techStack.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {techStack.map((tech) => (
                <span
                  key={tech}
                  className="font-sans text-[11px] font-medium uppercase tracking-[0.16px] px-2.5 py-1 rounded-sm bg-surface-soft text-ink border border-hairline"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}

          <UploaderInfo user={project.author} size="w-7 h-7">
            <span className="font-sans text-[12px] text-muted">
              by <span className="font-medium text-ink">{authorName}</span>
            </span>
          </UploaderInfo>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-hairline">
          <div className="flex items-center gap-4">
            <span className="font-sans text-[13px] text-body flex items-center gap-1">
              <Heart size={14} className={liked ? 'fill-signature-coral text-signature-coral' : 'text-muted'} />
              {project.likes?.length || 0}
            </span>

            {project.githubLink && (
              <a
                href={project.githubLink}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.preventDefault()}
                className="text-muted hover:text-ink transition-colors"
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
                className="text-muted hover:text-ink transition-colors"
                aria-label="Live demo"
              >
                <ExternalLink size={16} />
              </a>
            )}
          </div>

          {liked && (
            <button
              onClick={(e) => { e.preventDefault(); onLike() }}
              disabled={liking}
              className="text-[12px] font-medium text-signature-coral transition-colors disabled:opacity-50"
            >
              {liking ? 'Saving…' : 'Unlike'}
            </button>
          )}
          {!liked && (
            <button
              onClick={(e) => { e.preventDefault(); onLike() }}
              disabled={liking}
              className="text-[12px] font-medium text-muted hover:text-ink transition-colors disabled:opacity-50"
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
    <div className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center p-4">
      <div className="bg-white text-ink border border-hairline rounded-lg w-full max-w-xl max-h-[90vh] flex flex-col shadow-lg overflow-hidden">
        <div className="p-6 border-b border-hairline flex items-center justify-between">
          <div>
            <h3 className="font-display text-[22px] font-normal">Submit Project</h3>
            <p className="font-sans text-[13px] text-muted">
              Share your project with the department community.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-soft border border-hairline flex items-center justify-center transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          <div>
            <label className="block font-mono text-[13px] font-medium text-muted mb-1.5">Project Title *</label>
            <input
              required
              value={form.title}
              onChange={set('title')}
              placeholder="e.g. Solar-Powered IoT Weather Station"
              className="input"
            />
            {errors.title && <p className="text-[12px] text-signature-coral mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block font-mono text-[13px] font-medium text-muted mb-1.5">Description *</label>
            <textarea
              required
              value={form.description}
              onChange={set('description')}
              placeholder="What does your project do? What problem does it solve?"
              rows={4}
              className="input resize-none"
            />
            {errors.description && <p className="text-[12px] text-signature-coral mt-1">{errors.description}</p>}
          </div>

          <div>
            <label className="block font-mono text-[13px] font-medium text-muted mb-1.5">Tech Stack *</label>
            <input
              required
              value={form.techStack}
              onChange={set('techStack')}
              placeholder="e.g. React, Node.js, Arduino, TensorFlow"
              className="input"
            />
            <p className="font-sans text-[11px] text-muted mt-1">Separate technologies with commas.</p>
            {errors.techStack && <p className="text-[12px] text-signature-coral mt-1">{errors.techStack}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[13px] font-medium text-muted mb-1.5">GitHub Link</label>
              <input
                type="url"
                value={form.github}
                onChange={set('github')}
                placeholder="https://github.com/username/repo"
                className="input"
              />
            </div>
            <div>
              <label className="block font-mono text-[13px] font-medium text-muted mb-1.5">Demo Link</label>
              <input
                type="url"
                value={form.demoLink}
                onChange={set('demoLink')}
                placeholder="https://your-demo.vercel.app"
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[13px] font-medium text-muted mb-1.5">Image URLs</label>
            <input
              value={form.images}
              onChange={set('images')}
              placeholder="Paste image URLs separated by commas"
              className="input"
            />
          </div>

          {error && (
            <p className="text-[13px] text-signature-coral font-medium bg-surface-soft border border-hairline rounded-md px-4 py-3 text-center">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="button-secondary px-5 py-2.5 rounded-md text-[14px]"
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
