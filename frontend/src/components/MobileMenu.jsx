import { Link } from 'react-router-dom'
import {
  Building2, UserCheck, BookOpen, FlaskConical,
  FolderOpen, Image as ImageIcon, MessagesSquare, Rocket,
} from 'lucide-react'

const quickActions = [
  { label: 'My Profile', to: '/profile/me' },
  { label: 'My Dashboard', to: '/dashboard' },
]

const sections = [
  {
    title: 'Academics',
    items: [
      { label: 'About', to: '/about', icon: Building2 },
      { label: 'Faculty', to: '/faculty', icon: UserCheck },
      { label: 'Courses', to: '/courses', icon: BookOpen },
    ],
  },
  {
    title: 'Resources',
    items: [
      { label: 'Labs', to: '/laboratory', icon: FlaskConical },
      { label: 'Study Materials', to: '/resources', icon: FolderOpen },
      { label: 'Gallery', to: '/gallery', icon: ImageIcon },
    ],
  },
  {
    title: 'Community',
    items: [
      { label: 'Forum', to: '/forum', icon: MessagesSquare },
      { label: 'Projects', to: '/projects', icon: Rocket },
    ],
  },
]

export default function MobileMenu({ user = { name: 'Sumith Kumar', rollNumber: '4001', role: 'student' } }) {
  const roleBadge =
    user.role === 'faculty'
      ? { label: 'Faculty', className: 'bg-signature-forest text-white' }
      : user.role === 'admin'
      ? { label: 'Admin', className: 'bg-primary text-white' }
      : { label: 'Student', className: 'bg-signature-mint text-primary' }

  return (
    <div className="min-h-screen bg-[#f5f5f5] px-4 py-5">
      {/* User Card */}
      <div className="bg-white rounded-xl border border-hairline p-4 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-[18px] font-normal text-gray-900 leading-tight">
              {user.name}
            </p>
            <p className="font-mono text-[13px] text-gray-500 mt-0.5">
              {user.rollNumber}
            </p>
          </div>
          <span className={`inline-flex items-center rounded-full px-3 py-1 font-mono text-[10px] font-normal uppercase tracking-wider ${roleBadge.className}`}>
            {roleBadge.label}
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-hairline p-4 mb-5">
        <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">
          Quick Actions
        </h3>
        <div className="flex flex-col gap-2">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className="flex items-center justify-center w-full py-3.5 bg-white border border-hairline rounded-xl font-sans text-[15px] font-normal text-gray-900 hover:bg-gray-50 transition-colors"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Sections */}
      {sections.map((section) => (
        <div key={section.title} className="mb-5">
          <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2.5 px-1">
            {section.title}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {section.items.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className="flex items-center gap-2.5 px-3 py-3 bg-white border border-hairline rounded-xl font-sans text-[13px] font-normal text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <Icon size={17} strokeWidth={1.75} className="flex-shrink-0 text-gray-600" />
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
