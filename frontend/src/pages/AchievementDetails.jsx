import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getAchievement } from '../api/achievements'
import ImageGuard from '../components/ImageGuard'
import { ArrowLeft, Calendar } from 'lucide-react'
import SEO from '../components/SEO'

const NO_GRADIENTS = '[*]:bg-none [*]:before:bg-none'

export default function AchievementDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery({
    queryKey: ['achievement', id],
    queryFn: () => getAchievement(id).then(r => r.data),
    enabled: !!id,
  })

  const achievement = data?.data || {}

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white text-ink pt-24 pb-24">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12">
          <div className="skeleton-shimmer space-y-4">
            <div className="h-4 w-48 bg-surface-soft rounded-sm mb-6" />
            <div className="h-10 w-3/4 bg-surface-soft rounded-sm mb-4" />
            <div className="h-64 bg-surface-soft rounded-md mb-6" />
            <div className="h-4 w-full bg-surface-soft rounded-sm mb-2" />
            <div className="h-4 w-full bg-surface-soft rounded-sm mb-2" />
            <div className="h-4 w-2/3 bg-surface-soft rounded-sm" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !achievement._id) {
    return (
      <div className="min-h-screen bg-white text-ink pt-24 pb-24">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 text-center">
          <p className="font-sans text-[14px] text-muted mb-4">Achievement not found.</p>
          <button onClick={() => navigate('/achievements')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-hairline bg-white text-ink font-sans text-[14px] font-medium">
            ← Back to Achievements
          </button>
        </div>
      </div>
    )
  }

  const title = achievement.title || ''
  const description = achievement.description || ''
  const date = achievement.date ? new Date(achievement.date) : null
  const image = achievement.image || ''
  const category = achievement.category || ''
  const year = date ? date.getFullYear() : ''
  const formattedDate = date ? date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''

  return (
    <div className="min-h-screen bg-white text-ink pt-24 pb-24">
      <SEO
        title={`${title} | Achievements | Electro Infinity`}
        description={description.slice(0, 160)}
      />

      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        <button
          onClick={() => navigate('/achievements')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-hairline bg-white text-ink hover:border-ink transition-colors mb-8 font-sans text-[14px] font-medium"
        >
          <ArrowLeft size={16} />
          Back to Achievements
        </button>

        <div className="max-w-3xl">
          {image && (
            <div className="rounded-lg overflow-hidden border border-hairline mb-8 bg-white">
              <ImageGuard className={`w-full ${NO_GRADIENTS}`}>
                <img
                  src={image}
                  alt={title}
                  className="w-full object-cover max-h-[500px]"
                />
              </ImageGuard>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 mb-4">
            {category && (
              <span className={`font-sans text-[11px] font-medium uppercase tracking-[0.16px] px-3 py-1 rounded-sm border ${
                category === 'student'
                  ? 'bg-signature-coral text-white border-signature-coral'
                  : category === 'faculty'
                    ? 'bg-signature-forest text-white border-signature-forest'
                    : 'bg-signature-mustard text-ink border-signature-mustard'
              }`}>
                {category}
              </span>
            )}
            {formattedDate && (
              <span className="font-sans text-[13px] text-muted flex items-center gap-1.5">
                <Calendar size={14} />
                {formattedDate}
              </span>
            )}
          </div>

          <h1 className="font-display text-[36px] md:text-[48px] font-normal tracking-[0] text-ink mb-6 leading-[1.2]">
            {title}
          </h1>

          <p className="font-sans text-[14px] text-body leading-[1.25] whitespace-pre-line">
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}
