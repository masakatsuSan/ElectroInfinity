export default function AvatarGuard({ children, className = '' }) {
  return <div className={`overflow-hidden rounded-full ${className}`}>{children}</div>
}
