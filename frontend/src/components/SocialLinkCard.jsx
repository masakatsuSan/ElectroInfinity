import { ExternalLink } from 'lucide-react'

const platformConfig = {
  github:    { label: 'GitHub',    icon: 'github',    color: '#333' },
  linkedin:  { label: 'LinkedIn',  icon: 'linkedin',  color: '#0A66C2' },
  instagram: { label: 'Instagram', icon: 'instagram', color: '#E4405F' },
  facebook:  { label: 'Facebook',  icon: 'facebook',  color: '#1877F2' },
  twitter:   { label: 'X (Twitter)', icon: 'twitter', color: '#000' },
  discord:   { label: 'Discord',   icon: 'discord',   color: '#5865F2' },
  youtube:   { label: 'YouTube',   icon: 'youtube',   color: '#FF0000' },
  website:   { label: 'Website',   icon: 'globe',     color: '#666' },
  blog:      { label: 'Blog',      icon: 'book-open', color: '#666' },
}

export default function SocialLinkCard({ platform, username, url }) {
  const config = platformConfig[platform]
  if (!config || !username) return null

  const href = url || `https://${platform}.com/${username}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between p-4 border border-divider-soft bg-canvas rounded-2xl hover:border-slate/30 hover:shadow-sm transition-all group"
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-[12px] uppercase"
          style={{ backgroundColor: config.color }}
        >
          {config.label.charAt(0)}
        </div>
        <div>
          <p className="font-sans text-[14px] font-semibold text-ink">{config.label}</p>
          <p className="font-mono text-[12px] text-slate">@{username}</p>
        </div>
      </div>
      <ExternalLink size={16} className="text-slate group-hover:text-ink transition-colors" />
    </a>
  )
}
