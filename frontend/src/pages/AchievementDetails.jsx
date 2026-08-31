import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getAchievement } from '../api/achievements'
import ImageGuard from '../components/ImageGuard'
import { ArrowLeft, Calendar } from 'lucide-react'
import SEO from '../components/SEO'

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
      <div className="min-h-screen bg-canvas text-ink pt-36 pb-28">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-soft-stone rounded mb-6" />
            <div className="h-10 w-3/4 bg-soft-stone rounded mb-4" />
            <div className="h-64 bg-soft-stone rounded-2xl mb-6" />
            <div className="h-4 w-full bg-soft-stone rounded mb-2" />
            <div className="h-4 w-full bg-soft-stone rounded mb-2" />
            <div className="h-4 w-2/3 bg-soft-stone rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !achievement._id) {
    return (
      <div className="min-h-screen bg-canvas text-ink pt-36 pb-28">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 text-center">
          <p className="text-body-muted text-lg mb-4">Achievement not found.</p>
          <button onClick={() => navigate('/achievements')} className="text-primary hover:underline font-semibold">
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
    <div className="min-h-screen bg-canvas text-ink pt-36 pb-28">
      <SEO
        title={`${title} | Achievements | Electro Infinity`}
        description={description.slice(0, 160)}
      />

      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        <button
          onClick={() => navigate('/achievements')}
          className="inline-flex items-center gap-2 text-slate hover:text-ink transition-colors mb-8 font-sans text-[14px] font-medium"
        >
          <ArrowLeft size={16} />
          Back to Achievements
        </button>

        <div className="max-w-3xl">
          {image && (
            <div className="rounded-2xl overflow-hidden border border-hairline mb-8 bg-canvas">
              <ImageGuard className="w-full">
                <img
                  src={image}
                  alt={title}
                  className="w-full object-cover max-h-[500px]"
                />
              </ImageGuard>
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            {category && (
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                {category}
              </span>
            )}
            {formattedDate && (
              <span className="font-sans text-[13px] text-slate flex items-center gap-1.5">
                <Calendar size={14} />
                {formattedDate}
              </span>
            )}
          </div>

          <h1 className="font-display text-[36px] md:text-[48px] font-normal tracking-tight text-ink mb-6 leading-tight">
            {title}
          </h1>

          <p className="font-sans text-[16px] text-body-muted leading-relaxed whitespace-pre-line">
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}
