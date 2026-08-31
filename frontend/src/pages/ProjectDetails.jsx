import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getProject } from '../api/projects'
import { useAuth } from '../context/AuthContext'
import { Heart, GitBranch, ExternalLink, ArrowLeft } from 'lucide-react'
import SEO from '../components/SEO'

export default function ProjectDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProject(id).then(r => r.data),
    enabled: !!id,
  })

  const project = data?.data || {}

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas text-ink pt-36 pb-28">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-soft-stone rounded mb-6" />
            <div className="h-10 w-3/4 bg-soft-stone rounded mb-4" />
            <div className="h-4 w-full bg-soft-stone rounded mb-2" />
            <div className="h-4 w-full bg-soft-stone rounded mb-2" />
            <div className="h-4 w-2/3 bg-soft-stone rounded mb-6" />
            <div className="flex gap-2">
              {[1,2,3,4].map(i => <div key={i} className="h-8 w-20 bg-soft-stone rounded-full" />)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !project._id) {
    return (
      <div className="min-h-screen bg-canvas text-ink pt-36 pb-28">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 text-center">
          <p className="text-body-muted text-lg mb-4">Project not found.</p>
          <button onClick={() => navigate('/projects')} className="text-primary hover:underline font-semibold">
            ← Back to Projects
          </button>
        </div>
      </div>
    )
  }

  const description = project.description || ''
  const techStack = project.techStack || []
  const authorName = project.author?.name || 'Unknown'
  const liked = !!user && (project.likedBy?.includes(user._id))
  const images = project.images || []

  return (
    <div className="min-h-screen bg-canvas text-ink pt-36 pb-28">
      <SEO
        title={`${project.title} | Student Projects | Electro Infinity`}
        description={description.slice(0, 160)}
      />

      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-2 text-slate hover:text-ink transition-colors mb-8 font-sans text-[14px] font-medium"
        >
          <ArrowLeft size={16} />
          Back to Projects
        </button>

        <div className="max-w-3xl">
          <h1 className="font-display text-[36px] md:text-[48px] font-normal tracking-tight text-ink mb-6 leading-tight">
            {project.title}
          </h1>

          <p className="font-sans text-[16px] text-body-muted leading-relaxed mb-6 whitespace-pre-line">
            {description}
          </p>

          {techStack.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {techStack.map((tech) => (
                <span
                  key={tech}
                  className="font-mono text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full bg-soft-stone text-ink border border-hairline"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}

          <p className="font-mono text-[13px] text-slate mb-8">
            by {authorName}
          </p>

          {images.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {images.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`${project.title} screenshot ${idx + 1}`}
                  className="rounded-2xl border border-hairline w-full object-cover"
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-6 pt-6 border-t border-hairline">
            <span className="font-sans text-[14px] text-body-muted flex items-center gap-2">
              <Heart size={18} className={liked ? 'fill-coral text-coral' : 'text-slate'} />
              {project.likes?.length || 0} {project.likes?.length === 1 ? 'like' : 'likes'}
            </span>

            {project.githubLink && (
              <a
                href={project.githubLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-slate hover:text-ink transition-colors"
              >
                <GitBranch size={18} />
                <span className="text-[14px] font-medium">GitBranch</span>
              </a>
            )}

            {project.demoLink && (
              <a
                href={project.demoLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-slate hover:text-ink transition-colors"
              >
                <ExternalLink size={18} />
                <span className="text-[14px] font-medium">Live Demo</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
