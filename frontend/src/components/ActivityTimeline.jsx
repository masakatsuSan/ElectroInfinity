import { FileText, Upload, MessageSquare, Award, Trophy, User } from 'lucide-react'

const typeConfig = {
  project_shared:       { icon: FileText,  color: 'text-blue-600', bg: 'bg-blue-50', label: 'Shared Project' },
  resource_uploaded:    { icon: Upload,    color: 'text-green-600', bg: 'bg-green-50', label: 'Uploaded Resource' },
  forum_post:           { icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Forum Post' },
  badge_earned:         { icon: Award,     color: 'text-amber-600', bg: 'bg-amber-50', label: 'Earned Badge' },
  achievement_completed:{ icon: Trophy,    color: 'text-coral', bg: 'bg-red-50', label: 'Achievement' },
  profile_updated:      { icon: User,      color: 'text-slate', bg: 'bg-gray-50', label: 'Updated Profile' },
}

export default function ActivityTimeline({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="py-12 text-center border border-divider-soft rounded-2xl bg-surface-pearl">
        <p className="font-sans text-[15px] text-ink-muted-80">No activity yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const config = typeConfig[activity.type] || typeConfig.profile_updated
        const Icon = config.icon

        return (
          <div
            key={activity._id}
            className="flex gap-4 p-5 border border-divider-soft bg-surface-pearl rounded-2xl hover:shadow-sm transition-shadow"
          >
            <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={18} className={config.color} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-sans text-[14px] font-semibold text-ink">{activity.title}</p>
                  {activity.description && (
                    <p className="font-sans text-[13px] text-ink-muted-80 mt-1">{activity.description}</p>
                  )}
                </div>
                <span className="font-mono text-[11px] text-ink-muted-48 whitespace-nowrap">
                  {new Date(activity.createdAt).toLocaleDateString()}
                </span>
              </div>
              {activity.link && (
                <a href={activity.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-sans text-[13px] text-action-blue hover:underline mt-2">
                  View Details
                </a>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
