import { FileText, Upload, MessageSquare, Award, Trophy, User } from 'lucide-react'

const typeConfig = {
  project_shared:       { icon: FileText,  color: 'text-link', bg: 'bg-surface-soft', label: 'Shared Project' },
  resource_uploaded:    { icon: Upload,    color: 'text-signature-forest', bg: 'bg-signature-mint', label: 'Uploaded Resource' },
  forum_post:           { icon: MessageSquare, color: 'text-signature-mustard', bg: 'bg-signature-cream', label: 'Forum Post' },
  badge_earned:         { icon: Award,     color: 'text-signature-mustard', bg: 'bg-signature-yellow', label: 'Earned Badge' },
  achievement_completed:{ icon: Trophy,    color: 'text-signature-coral', bg: 'bg-signature-peach', label: 'Achievement' },
  profile_updated:      { icon: User,      color: 'text-muted', bg: 'bg-surface-strong', label: 'Updated Profile' },
}

export default function ActivityTimeline({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="border border-hairline bg-white py-12 text-center rounded-lg">
        <p className="font-sans text-[15px] text-muted">No activity yet.</p>
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
            className="flex gap-4 border border-hairline bg-white p-5 rounded-lg"
          >
            <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={18} className={config.color} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-sans text-[14px] font-medium text-ink">{activity.title}</p>
                  {activity.description && (
                    <p className="font-sans text-[13px] text-muted mt-1">{activity.description}</p>
                  )}
                </div>
                  <span className="font-sans text-[11px] text-muted whitespace-nowrap">
                  {new Date(activity.createdAt).toLocaleDateString()}
                </span>
              </div>
              {activity.link && (
                <a href={activity.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-sans text-[13px] text-link mt-2">
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
