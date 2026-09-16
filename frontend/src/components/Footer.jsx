import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

const HIDDEN_ROUTES = [
  '/admin',
  '/forum',
  '/login',
  '/faculty/login',
  '/faculty/activate',
  '/activate',
  '/forgot-password',
]

const isHiddenRoute = (pathname) => {
  if (HIDDEN_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
    return true
  }
  return false
}

const FOOTER_LINKS = [
  {
    title: 'Department',
    links: [
      { to: '/about', label: 'About' },
      { to: '/faculty', label: 'Faculty Directory' },
      { to: '/laboratory', label: 'Laboratories' },
      { to: '/achievements', label: 'Achievements' },
    ]
  },
  {
    title: 'Academics',
    links: [
      { to: '/courses', label: 'Courses' },
      { to: '/resources', label: 'Study Materials' },
      { to: '/announcements', label: 'Announcements' },
      { to: '/calendar', label: 'Academic Calendar' },
    ]
  },
  {
    title: 'Community',
    links: [
      { to: '/forum', label: 'Discussion Forum' },
      { to: '/projects', label: 'Student Projects' },
      { to: '/gallery', label: 'Department Gallery' },
      { to: '/placements', label: 'Placements' },
    ]
  },
  {
    title: 'Support',
    links: [
      { to: '/contact', label: 'Contact Department' },
      { to: '/announcements', label: 'Official Announcements' },
      { to: '/terms-and-conditions', label: 'Terms & Conditions' },
    ]
  },
]

export default function Footer() {
  const location = useLocation()

  if (isHiddenRoute(location.pathname)) {
    return null
  }
  return (
    <footer className="bg-white text-body border-t border-hairline">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-6 xl:px-10">
        <div className="py-10 sm:py-16 md:py-24 grid grid-cols-2 gap-6 sm:gap-8 md:gap-10 md:grid-cols-4">
          {FOOTER_LINKS.map((group) => (
            <div key={group.title}>
              <h4 className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider mb-5">
                {group.title}
              </h4>
              <ul className="flex flex-col gap-3.5">
                {group.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="font-sans text-[14px] text-muted hover:text-ink transition-colors duration-200"
                      style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="py-8 border-t border-hairline flex flex-col md:flex-row justify-between items-center gap-4 text-[13px] font-sans text-muted">
          <div className="flex items-center gap-4">
            <span>© {new Date().getFullYear()} Electro Infinity · AGEMC</span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://agemc.ac.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-muted hover:text-ink transition-colors duration-200"
              style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
            >
              AGEMC Official <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
