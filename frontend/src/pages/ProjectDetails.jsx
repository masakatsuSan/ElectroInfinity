import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getProject } from '../api/projects'
import { useAuth } from '../context/AuthContext'
import { Heart, GitBranch, ExternalLink, ArrowLeft } from 'lucide-react'
import SEO from '../components/SEO'
import UploaderInfo from '../components/UploaderInfo'

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
      <div className="min-h-screen bg-white text-ink pt-24 pb-24">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-40 bg-surface-soft rounded-sm mb-6" />
            <div className="h-10 w-3/4 bg-surface-soft rounded-sm mb-4" />
            <div className="h-4 w-full bg-surface-soft rounded-sm mb-2" />
            <div className="h-4 w-full bg-surface-soft rounded-sm mb-2" />
            <div className="h-4 w-2/3 bg-surface-soft rounded-sm mb-6" />
            <div className="flex gap-2">
              {[1,2,3,4].map(i => <div key={i} className="h-8 w-20 bg-surface-soft rounded-sm" />)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !project._id) {
    return (
      <div className="min-h-screen bg-white text-ink pt-24 pb-24">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 text-center">
          <p className="font-sans text-[14px] text-muted mb-4">Project not found.</p>
          <button onClick={() => navigate('/projects')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-hairline bg-white text-ink font-sans text-[14px] font-medium">
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
    <div className="min-h-screen bg-white text-ink pt-24 pb-24">
      <SEO
        title={`${project.title} | Student Projects | Electro Infinity`}
        description={description.slice(0, 160)}
      />

      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-hairline bg-white text-ink hover:border-ink transition-colors mb-8 font-sans text-[14px] font-medium"
        >
          <ArrowLeft size={16} />
          Back to Projects
        </button>

        <div className="max-w-3xl">
          <h1 className="font-display text-[36px] md:text-[48px] font-normal tracking-[0] text-ink mb-6 leading-[1.2]">
            {project.title}
          </h1>

          <p className="font-sans text-[14px] text-body leading-[1.25] mb-6 whitespace-pre-line">
            {description}
          </p>

          {techStack.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {techStack.map((tech) => (
                <span
                  key={tech}
                  className="font-sans text-[11px] font-medium uppercase tracking-[0.16px] px-3 py-1.5 rounded-sm bg-surface-soft text-ink border border-hairline"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}

          <UploaderInfo user={project.author} size="w-8 h-8" className="gap-3">
            <div className="flex flex-col">
              <span className="font-sans text-[13px] text-muted">
                by <span className="font-medium text-ink">{authorName}</span>
              </span>
              {project.author?.rollNumber && (
                <span className="font-sans text-[10px] uppercase tracking-[0.16px] text-muted">
                  {project.author.rollNumber}
                </span>
              )}
            </div>
          </UploaderInfo>

          {images.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {images.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`${project.title} screenshot ${idx + 1}`}
                  className="rounded-md border border-hairline w-full object-cover bg-white"
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-6 pt-6 border-t border-hairline">
            <span className="font-sans text-[14px] text-body flex items-center gap-2">
              <Heart size={18} className={liked ? 'fill-signature-coral text-signature-coral' : 'text-muted'} />
              {project.likes?.length || 0} {project.likes?.length === 1 ? 'like' : 'likes'}
            </span>

            {project.githubLink && (
              <a
                href={project.githubLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-muted hover:text-ink transition-colors"
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
                className="inline-flex items-center gap-2 text-muted hover:text-ink transition-colors"
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
