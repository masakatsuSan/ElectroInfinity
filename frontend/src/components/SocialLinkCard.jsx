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

function detectPlatformFromUrl(url) {
  if (!url) return null
  const lower = url.toLowerCase()

  if (lower.includes('github.com')) return 'github'
  if (lower.includes('linkedin.com') || lower.includes('linkedin.in')) return 'linkedin'
  if (lower.includes('instagram.com')) return 'instagram'
  if (lower.includes('facebook.com') || lower.includes('fb.com')) return 'facebook'
  if (lower.includes('twitter.com') || lower.includes('x.com')) return 'twitter'
  if (lower.includes('discord.com') || lower.includes('discord.gg')) return 'discord'
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube'
  if (lower.includes('blog.') || lower.includes('/blog')) return 'blog'

  return null
}

export default function SocialLinkCard({ platform, username, url }) {
  const displayUrl = url || username
  const detectedPlatform = detectPlatformFromUrl(displayUrl)
  const activePlatform = detectedPlatform || platform
  const config = platformConfig[activePlatform]

  if (!config || !displayUrl) return null

  const href = displayUrl.startsWith('http') ? displayUrl : `https://${displayUrl}`

  let displayText
  try {
    if (displayUrl.startsWith('http')) {
      const urlObj = new URL(displayUrl)
      displayText = urlObj.hostname + urlObj.pathname
    } else {
      displayText = `@${displayUrl}`
    }
  } catch {
    displayText = displayUrl
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between p-4 border border-hairline bg-white rounded-xl group hover:bg-black/5 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white font-medium text-[12px] uppercase"
          style={{ backgroundColor: config.color }}
        >
          {config.label.charAt(0)}
        </div>
        <div>
          <p className="font-sans text-[14px] font-medium text-ink">{config.label}</p>
          <p className="font-sans text-[12px] text-gray-500 truncate max-w-[180px]">
            {displayText}
          </p>
        </div>
      </div>
      <ExternalLink size={16} className="text-gray-400 group-hover:text-ink transition-colors" />
    </a>
  )
}
