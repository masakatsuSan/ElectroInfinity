import { Link } from 'react-router-dom'

export default function UploaderInfo({ user, size = 'w-6 h-6', className = '', children }) {
  const name = user?.name || 'Unknown'
  const initials =
    name.split(' ').filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase() || 'S'
  const hasId = user?._id

  const avatar = (
    <div
      className={`relative ${size} rounded-full overflow-hidden bg-white border border-hairline shrink-0`}
    >
      {user?.photo ? (
        <img src={user.photo} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="font-sans text-[9px] font-medium text-muted">{initials}</span>
        </div>
      )}
    </div>
  )

  const label = children ?? (
    <span className="font-sans text-[12px] text-muted truncate">{name}</span>
  )

  if (!hasId) {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        {avatar}
        {label}
      </div>
    )
  }

  return (
    <Link
      to={`/profile/${user._id}`}
      className={`flex items-center gap-2.5 hover:text-link transition-colors ${className}`}
    >
      {avatar}
      {label}
    </Link>
  )
}
