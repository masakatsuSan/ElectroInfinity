// Footer link configuration for Electro Infinity.
// Structure is data-driven so the Footer component just maps over it.
//
// Each entry in FOOTER_COLUMNS is a "column" that renders as a vertical stack
// of groups (heading + links). Two groups sit in one column with a larger gap
// between them.

// NOTE: lucide-react v1.31.0 (installed) does NOT export the brand icons
// Instagram / Linkedin / Facebook / Youtube / Github — importing them fails the
// build ("X is not exported by …lucide-react.mjs"). Until the dependency is
// upgraded (or a small inline-SVG set is added), render a null Icon so the
// SocialRow — which only mounts icons that have a real href — stays silent and
// the build stays green. Telegram's Send icon IS available.
import { Send } from 'lucide-react'

// Column 1 — Department + Academics
//   (placements moved here from Community; resource folders added)
export const FOOTER_COLUMNS = [
  [
    {
      heading: 'Department',
      links: [
        { to: '/about', label: 'About' },
        { to: '/faculty', label: 'Faculty Directory' },
        { to: '/laboratory', label: 'Laboratories' },
        { to: '/achievements', label: 'Achievements' },
        { to: '/placements', label: 'Placements' },
      ],
    },
    {
      heading: 'Academics',
      links: [
        { to: '/courses', label: 'Courses' },
        { to: '/resources', label: 'Study Materials' },
        { to: '/resources/folders', label: 'Resource Folders' },
        { to: '/calendar', label: 'Academic Calendar' },
      ],
    },
  ],
  // Column 2 — Community + Support
  //   (announcements de-duplicated into Community; not the duplicate "Notices Board")
  [
    {
      heading: 'Community',
      links: [
        { to: '/projects', label: 'Student Projects' },
        { to: '/gallery', label: 'Department Gallery' },
        { to: '/announcements', label: 'Announcements' },
      ],
    },
    {
      heading: 'Support',
      links: [
        { to: '/contact', label: 'Contact Department' },
        { to: '/terms-and-conditions', label: 'Terms & Conditions' },
      ],
    },
  ],
]

// Column 3 — Quick Links. Shown only when logged in; otherwise "Sign in".
export const QUICK_LINKS = {
  authenticated: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/network', label: 'Network' },
    { to: '/notifications', label: 'Notifications' },
  ],
  unauthenticated: [
    { to: '/login', label: 'Sign in' },
  ],
}

// Site-wide social links.
// There are currently NO configured URLs for the site/organisation (the matches
// elsewhere in the codebase are per-user profile fields and share-intent URLs).
// Per the redesign brief: do NOT invent URLs — only render icons that have a real
// href. Until these are populated, the social row renders nothing. Fill them
// in here (or source from env/config) before enabling.
export const SOCIAL_LINKS = [
  // Brand icons are `null` here because lucide-react v1.31.0 does not export
  // Instagram/Linkedin/Facebook/Youtube/Github. Replace null with the icon
  // (or an inline SVG) once available — see the import note above.
  { platform: 'instagram', Icon: null, href: null }, // TODO: set URL + icon
  { platform: 'linkedin',  Icon: null, href: null }, // TODO: set URL + icon
  { platform: 'facebook',  Icon: null, href: null }, // TODO: set URL + icon
  { platform: 'youtube',   Icon: null, href: null }, // TODO: set URL + icon
  { platform: 'github',    Icon: null, href: null }, // TODO: set URL + icon
  { platform: 'telegram',  Icon: Send, href: null }, // TODO: set URL
]

export const AGEMC_URL = 'https://agemc.ac.in/'
