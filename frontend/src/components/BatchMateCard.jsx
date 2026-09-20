import AvatarGuard from './AvatarGuard'
import FriendActionButton from './FriendActionButton'
import { User } from 'lucide-react'
import { motion } from 'framer-motion'

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

  const displayName = mate.name || `${mate.rollNumber || 'S'}`
  const initials = mate.name
    ? mate.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : mate.rollNumber?.substring(0, 2).toUpperCase() || 'S'

  return (
    <motion.div
      onClick={onClick}
      className="group relative flex flex-col items-center gap-3 p-4 transition-all border rounded-xl border-hairline bg-white hover:shadow-md cursor-pointer"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
        <AvatarGuard className="w-full h-full">
          {mate.photo ? (
            <img src={mate.photo} alt={mate.name} className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-display text-[22px] font-bold text-gray-500">
                {initials}
              </span>
            </div>
          )}
        </AvatarGuard>
        {mate.role === 'cr' && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-white">
            CR
          </span>
        )}
      </div>

      <div className="text-center min-w-0">
        <p className="truncate font-sans text-[15px] font-semibold text-gray-900">{displayName}</p>
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-gray-500">{mate.rollNumber || 'Roll —'}</p>
      </div>

      {activeSocials.length > 0 && (
        <motion.div
          className="flex items-center gap-1.5"
          initial={{ opacity: 0, y: 4 }}
          whileHover={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        >
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
        </motion.div>
      )}

      <div className="mt-1" onClick={(e) => e.stopPropagation()}>
        <FriendActionButton userId={mate._id} friendStatus={mate.friendStatus} size="sm" showIcon={false} />
      </div>
    </motion.div>
  )
}
