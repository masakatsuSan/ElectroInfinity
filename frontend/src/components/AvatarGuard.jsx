export default function AvatarGuard({ children, className = '' }) {
  return <div className={`overflow-hidden ${className}`}>{children}</div>
}
