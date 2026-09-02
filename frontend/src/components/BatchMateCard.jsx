import ImageGuard from './ImageGuard'
import FollowButton from './FollowButton'

const SOCIAL_PLATFORMS = [
  { key: 'github', label: 'GitHub', color: '#333' },
  { key: 'linkedin', label: 'LinkedIn', color: '#0A66C2' },
  { key: 'instagram', label: 'Instagram', color: '#E4405F' },
  { key: 'facebook', label: 'Facebook', color: '#1877F2' },
  { key: 'twitter', label: 'X', color: '#000' },
  { key: 'youtube', label: 'YouTube', color: '#FF0000' },
  { key: 'website', label: 'Web', color: '#666' },
];

export default function BatchMateCard({ mate, onClick }) {
  const socials = (mate.socialLinks || mate.profile?.socialLinks || {});
  const activeSocials = SOCIAL_PLATFORMS.filter((p) => socials[p.key]);

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col items-center gap-3 p-5 transition-all border rounded-2xl border-divider-soft bg-white hover:border-ink/20 hover:shadow-lg cursor-pointer"
    >
      {/* Avatar */}
      <div className="relative w-20 h-20 rounded-full overflow-hidden bg-ink/5 flex-shrink-0">
        <ImageGuard className="w-full h-full">
          {mate.photo ? (
            <img src={mate.photo} alt={mate.name} className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-display text-[22px] font-bold text-ink-muted-48">
                {(mate.name || 'S').split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()}
              </span>
            </div>
          )}
        </ImageGuard>
        {mate.role === 'cr' && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-white whitespace-nowrap">
            CR
          </span>
        )}
      </div>

      {/* Name & Roll */}
      <div className="text-center min-w-0">
        <p className="truncate font-sans text-[15px] font-semibold text-ink">{mate.name}</p>
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-muted-80">{mate.rollNumber || 'Roll —'}</p>
      </div>

      {/* Social Icons Row — visible on hover */}
      {activeSocials.length > 0 && (
        <div className="flex items-center gap-1.5 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
          {activeSocials.map((platform) => (
            <a
              key={platform.key}
              href={socials[platform.key].startsWith('http') ? socials[platform.key] : `https://${platform.key}.com/${socials[platform.key]}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-7 h-7 flex items-center justify-center rounded-full text-white text-[10px] font-bold hover:scale-110 transition-transform"
              style={{ backgroundColor: platform.color }}
              title={platform.label}
            >
              {platform.label.charAt(0)}
            </a>
          ))}
        </div>
      )}

      {/* Follow Button */}
      <div className="mt-1" onClick={(e) => e.stopPropagation()}>
        <FollowButton userId={mate._id} isFollowing={mate.isFollowing} followsMe={mate.followsMe} size="sm" showIcon={false} />
      </div>
    </div>
  );
}
