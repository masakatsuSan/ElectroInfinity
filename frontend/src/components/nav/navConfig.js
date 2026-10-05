import {
  Home,
  School,
  Info,
  UserCheck,
  BookOpen,
  Briefcase,
  FlaskConical,
  FolderOpen,
  Folder,
  Image,
  Users,
  Rocket,
  Megaphone,
  CalendarClock,
  Award,
  Mail,
  LayoutDashboard,
  Network,
  Clock,
  Bell,
  User,
  GraduationCap,
  Shield,
  FileText,
} from 'lucide-react'

/* ── Routes where the site chrome (navbar / sidebar / topbar) is hidden ──── */
export const HIDDEN_ROUTES = [
  '/admin',
  '/login',
  '/faculty/login',
  '/faculty/activate',
  '/activate',
  '/forgot-password',
]

export const isHiddenRoute = (pathname) =>
  HIDDEN_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`))

/* ── Public (always visible) navigation ──────────────────────────────────── */

/**
 * Single source of truth for both the desktop sidebar and the mobile overlay.
 *
 * `mobile: false` marks a link that the desktop sidebar shows but the mobile
 * overlay deliberately hides. The mobile menu is frozen to the set it shipped
 * with before the sidebar landed; these three were sidebar-only additions and
 * must not leak into the hamburger menu. The sidebar renders every link
 * regardless of the flag.
 */
export const HOME_LINK = { to: '/', label: 'Home', icon: Home }

export const NAV_GROUPS = [
  {
    label: 'Academics',
    icon: School,
    children: [
      { to: '/about', label: 'About', icon: Info },
      { to: '/faculty', label: 'Faculty', icon: UserCheck },
      { to: '/courses', label: 'Courses', icon: BookOpen },
      { to: '/placements', label: 'Placements', icon: Briefcase, mobile: false },
    ],
  },
  {
    label: 'Resources',
    icon: FolderOpen,
    children: [
      { to: '/laboratory', label: 'Labs', icon: FlaskConical },
      { to: '/resources', label: 'Study Materials', icon: FolderOpen },
      { to: '/resources/folders', label: 'Resource Folders', icon: Folder, mobile: false },
      { to: '/gallery', label: 'Gallery', icon: Image },
    ],
  },
  {
    label: 'Community',
    icon: Users,
    children: [
      { to: '/projects', label: 'Projects', icon: Rocket },
      { to: '/announcements', label: 'Announcements', icon: Megaphone },
      { to: '/calendar', label: 'Calendar', icon: CalendarClock },
      { to: '/achievements', label: 'Achievements', icon: Award, mobile: false },
    ],
  },
]

export const STANDALONE_LINKS = [
  { to: '/blog', label: 'Blog', icon: BookOpen },
  { to: '/contact', label: 'Contact', icon: Mail },
]

/** Children the mobile overlay menu is allowed to render. */
export const mobileGroups = () => NAV_GROUPS.map((g) => ({ ...g, children: g.children.filter((c) => c.mobile !== false) }))

/** Standalone links the mobile overlay menu is allowed to render. */
export const mobileStandaloneLinks = () => STANDALONE_LINKS.filter((l) => l.mobile !== false)

export const TERMS_LINK = { to: '/terms-and-conditions', label: 'Terms & Conditions', icon: FileText }

/* ── "My Space" — only rendered for a signed-in user ─────────────────────── */
/* `roles: null` means "every signed-in user". Otherwise the signed-in role   */
/* must be listed. 'student' matches any non faculty/cr/admin account.        */

export const MY_SPACE_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: null },
  { to: '/network', label: 'Network', icon: Network, roles: null },
  { to: '/students', label: 'Deadlines & Routine', icon: Clock, roles: ['student', 'cr'] },
  { to: '/notifications', label: 'Notifications', icon: Bell, roles: null },
  { to: '/profile', label: 'My Profile', icon: User, roles: null, profile: true },
  { to: '/faculty/dashboard', label: 'Faculty Dashboard', icon: GraduationCap, roles: ['faculty'] },
  { to: '/admin', label: 'CR Control Panel', icon: Shield, roles: ['cr'] },
  { to: '/admin', label: 'Admin Console', icon: Shield, roles: ['admin', 'super_admin'] },
  { to: '/admin/faculty', label: 'Faculty Directory', icon: UserCheck, roles: ['admin', 'super_admin'] },
  { to: '/admin/students', label: 'Student Directory', icon: Users, roles: ['admin', 'super_admin'] },
]

/* ── Role helpers ─────────────────────────────────────────────────────────── */

export const normalizeRole = (user) => {
  const role = String(user?.role ?? '').trim().toLowerCase()
  if (!role || role === 'user') return 'student'
  return role
}

export const getRoleBadge = (role) => {
  switch (String(role ?? '').trim().toLowerCase()) {
    case 'faculty':
      return { label: 'Faculty', color: 'bg-signature-forest text-white' }
    case 'admin':
    case 'super_admin':
      return { label: 'Admin', color: 'bg-primary text-white' }
    case 'cr':
      return { label: 'CR', color: 'bg-signature-coral text-white' }
    default:
      return { label: 'Student', color: 'bg-signature-mint text-primary border border-signature-mint/30' }
  }
}

/**
 * Resolves MY_SPACE_LINKS for the given user. Items whose role is not allowed
 * are dropped. The "My Profile" entry is rewritten to the concrete
 * /profile/:id path so it matches the id logic the profile dropdown uses.
 */
export const resolveMySpaceLinks = (user) => {
  if (!user) return []
  const role = normalizeRole(user)
  return MY_SPACE_LINKS
    .filter((link) => {
      if (!link.roles) return true
      if (link.roles.includes(role)) return true
      // A plain student account may carry no explicit role.
      return link.roles.includes('student') && role === 'student'
    })
    .map((link) => {
      if (link.profile) {
        return { ...link, to: `/profile/${user._id}`, profileId: user._id }
      }
      return link
    })
}

/* ── Route matching helpers ──────────────────────────────────────────────── */

/** Active when the pathname is the link target or nested underneath it. */
export const isLinkActive = (pathname, to) => {
  if (!to) return false
  if (to === '/') return pathname === '/'
  return pathname === to || pathname.startsWith(`${to}/`)
}

/**
 * Picks the single most specific match among several link targets.
 *
 * Plain prefix matching is ambiguous for nested routes: on /resources/folders
 * both "/resources" (Study Materials) and "/resources/folders" (Resource
 * Folders) match, so both would be highlighted. The longest match is the
 * meaningful one.
 *
 * @param candidates array of link objects (each with a `to`), or of strings
 * @returns the winning link's `to`, or undefined when nothing matches
 */
export const mostSpecificActive = (pathname, candidates) => {
  let best
  let bestLength = -1
  for (const candidate of candidates) {
    const to = typeof candidate === 'string' ? candidate : candidate?.to
    if (!isLinkActive(pathname, to)) continue
    // Later duplicates (e.g. CR panel and Admin Console both point at /admin)
    // must not win over each other, so only swap on a strictly longer match.
    if (to.length > bestLength) {
      best = to
      bestLength = to.length
    }
  }
  return best
}

/** A parent group is highlighted when any of its children is active. */
export const isGroupActive = (pathname, group) =>
  group.children.some((child) => isLinkActive(pathname, child.to))

/** Collects the groups that contain the current route (used for auto-open). */
export const groupsForPathname = (pathname, groups = NAV_GROUPS) =>
  groups.filter((group) => group.children.some((child) => isLinkActive(pathname, child.to))).map((g) => g.label)

export const findGroupForPathname = (pathname, groups = NAV_GROUPS) =>
  groups.find((group) => group.children.some((child) => isLinkActive(pathname, child.to)))