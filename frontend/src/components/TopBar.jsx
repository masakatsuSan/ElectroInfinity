import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Contact,
  Download,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Network,
  User,
  UserCheck,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import NotificationBell from './NotificationBell'
import TopBarSearch from './TopBarSearch'
import { useInstallApp } from './nav/useInstallApp'
import { useSidebarStateContext } from './nav/SidebarStateContext'
import { getRoleBadge, normalizeRole } from './nav/navConfig'
import { EASE, useReducedMotion } from '../utils/motion'
import { useMainScroll } from '../context/LayoutContext'
import { cn } from '../utils/cn'
import { BRAND_NAME } from '../config/brand'

/* The site is branded "College Connect" everywhere (index.html, Footer,
   Sidebar). */

const CARD_WIDTH = 340
const TRIGGER_GAP = 8
const VIEWPORT_PAD = 8

const AVATAR_SIZE = 72
const RING_PADDING = 6
const RING_STROKE = 4

/**
 * Same eight fields the backend scores in computeCompleteness()
 * (backend/src/routes/profile.js) so the ring shows the same number the
 * profile page reports — read off the already-loaded user, no extra request.
 * Returns null when the user carries none of them (ring is then hidden).
 */
const COMPLETENESS_CHECKS = [
  (u) => !!u.name,
  (u) => !!u.profile?.bio?.trim(),
  (u) => !!u.profile?.department?.trim(),
  (u) => !!u.semester,
  (u) => (u.profile?.skills?.length || 0) > 0,
  (u) => !!u.photo,
  (u) => !!u.profile?.coverPhoto,
  (u) => !!u.collegeEmail?.trim(),
]

function profileCompletion(user) {
  if (!user) return null
  const hasTrackedFields =
    COMPLETENESS_CHECKS.some((check) => check(user)) || 'profile' in user || 'semester' in user || 'collegeEmail' in user
  if (!hasTrackedFields) return null
  const filled = COMPLETENESS_CHECKS.filter((check) => check(user)).length
  return Math.round((filled / COMPLETENESS_CHECKS.length) * 100)
}

/* AnimatePresence only keeps children that pass React's isValidElement, and a
   portal is not a valid element — React tags it REACT_PORTAL_TYPE rather than
   REACT_ELEMENT_TYPE. A createPortal() returned *directly* as AnimatePresence's
   child is therefore filtered out and never mounts, so the dropdown stayed
   permanently empty. Wrapping the portal in a real element gives AnimatePresence
   something it can track; React context still flows through the portal, so the
   card below keeps its exit animation. */
function Portal({ children }) {
  return createPortal(children, document.body)
}

function CompletionAvatar({ user, percentage }) {
  const ringSize = AVATAR_SIZE + RING_PADDING * 2
  const radius = (ringSize - RING_STROKE) / 2
  const circumference = 2 * Math.PI * radius
  const filled = Math.min(100, Math.max(0, percentage ?? 0))
  const hasRing = percentage !== null && percentage !== undefined

  const avatar = (
    <span
      className="flex items-center justify-center overflow-hidden rounded-full bg-primary font-display font-medium text-white"
      style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, fontSize: 26 }}
    >
      {user.photo ? (
        <img src={user.photo} alt="" className="h-full w-full object-cover" />
      ) : (
        user.name?.charAt(0)?.toUpperCase() || 'U'
      )}
    </span>
  )

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative flex items-center justify-center"
        style={{ width: hasRing ? ringSize : AVATAR_SIZE, height: hasRing ? ringSize : AVATAR_SIZE }}
      >
        {hasRing && (
          <svg
            width={ringSize}
            height={ringSize}
            viewBox={`0 0 ${ringSize} ${ringSize}`}
            className="pointer-events-none absolute left-0 top-0 -rotate-90 text-primary"
            aria-hidden="true"
            focusable="false"
          >
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              strokeWidth={RING_STROKE}
              className="stroke-surface-strong"
            />
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={`${(filled / 100) * circumference} ${circumference}`}
            />
          </svg>
        )}
        {avatar}
      </div>

      {hasRing && (
        <span className="mt-1 font-mono text-[11px] font-medium text-muted">{percentage}%</span>
      )}
    </div>
  )
}

export default function TopBar() {
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()
  const location = useLocation()
  const { profileDropdownOpen, setProfileDropdownOpen, setCollapsed } = useSidebarStateContext()
  const { installPromptEvent, appInstalled, canInstall, handleInstallApp } = useInstallApp()
  const reduceMotion = useReducedMotion()
  const mainScroll = useMainScroll()

  const profileRef = useRef(null)
  const triggerRef = useRef(null)
  const dropdownRef = useRef(null)
  const itemRefs = useRef([])
  const [cardPosition, setCardPosition] = useState(null)

  const userRole = normalizeRole(user)
  const roleInfo = user ? getRoleBadge(userRole) : null

  /* Ctrl+K / Cmd+K now focuses the inline TopBarSearch field (handled there). */

  /* Track the trigger's viewport rect plus the portalled card's own size so the
     menu can be placed fixed, right-aligned and clamped inside the viewport
     regardless of ancestor overflow. */
  useLayoutEffect(() => {
    if (!profileDropdownOpen) return
    const update = () => {
      const el = profileRef.current
      if (!el) return setCardPosition(null)
      const r = el.getBoundingClientRect()
      const card = dropdownRef.current
      const cardHeight = card ? card.offsetHeight : 0
      const cardWidth = card ? card.offsetWidth : CARD_WIDTH
      const top = Math.max(
        VIEWPORT_PAD,
        Math.min(r.bottom + TRIGGER_GAP, window.innerHeight - cardHeight - VIEWPORT_PAD)
      )
      const right = Math.max(
        VIEWPORT_PAD,
        Math.min(window.innerWidth - r.right, window.innerWidth - cardWidth - VIEWPORT_PAD)
      )
      /* Returning `prev` when the coordinates are unchanged is what makes
         `cardPosition` safe as a dependency: the first pass necessarily
         measures with no card mounted (height 0), the second pass re-clamps
         against the real card now that it is in the DOM, and the third pass
         is a no-op instead of a render loop. */
      setCardPosition((prev) =>
        prev && prev.top === top && prev.right === right ? prev : { top, right }
      )
    }
    update()
    /* Anchor to whichever element actually scrolls (Main panel on desktop,
       window on mobile) so the portalled card re-measures on panel scroll. */
    mainScroll?.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      mainScroll?.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [profileDropdownOpen, mainScroll, cardPosition])

  /* Close on route change. */
  useEffect(() => {
    setProfileDropdownOpen(false)
  }, [location.pathname, setProfileDropdownOpen])

  useEffect(() => {
    if (!profileDropdownOpen) return
    const onPointerDown = (e) => {
      if (profileRef.current && profileRef.current.contains(e.target)) return
      if (dropdownRef.current && dropdownRef.current.contains(e.target)) return
      setProfileDropdownOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setProfileDropdownOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [profileDropdownOpen, setProfileDropdownOpen])

  const handleLogout = () => {
    setProfileDropdownOpen(false)
    setCollapsed(true)
    logout()
    navigate('/login')
  }

  /* Every row navigates, closes the menu and puts an expanded sidebar back on
     its rail. */
  const closeMenu = () => {
    setProfileDropdownOpen(false)
    setCollapsed(true)
  }

  /* Every link the dropdown ships today, in display order, filtered by role.
     Same targets and same role gates as before — only the order changed. */
  const menuItems = useMemo(() => {
    if (!user) return []
    const items = [
      { to: `/profile/${user._id}`, label: 'My Profile', icon: User },
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/network', label: 'Network', icon: Network },
    ]

    if (userRole === 'student' || userRole === 'cr') {
      items.push({ to: '/students', label: 'Deadlines & Routine', icon: CalendarClock })
    }

    items.push({ to: '/notifications', label: 'Notifications', icon: Bell, badge: unreadCount })

    if (userRole === 'faculty') {
      items.push({ to: '/faculty/dashboard', label: 'Faculty Dashboard', icon: LayoutGrid })
    }

    if (userRole === 'cr') {
      items.push({ to: '/admin', label: 'CR Control Panel', icon: LayoutGrid, tone: 'coral' })
    }

    if (userRole === 'admin' || userRole === 'super_admin') {
      items.push(
        { to: '/admin', label: 'Admin Console', icon: LayoutGrid },
        { to: '/admin/faculty', label: 'Faculty Directory', icon: UserCheck },
        { to: '/admin/students', label: 'Student Directory', icon: Contact }
      )
    }

    return items
  }, [user, userRole, unreadCount])

  /* Real counters only — both live on the user document the app already holds.
     Omitted entirely when the fields are absent. */
  const stats = useMemo(() => {
    if (!user) return []
    const cells = []
    if (Array.isArray(user.friends)) cells.push({ label: 'Connections', value: user.friends.length })
    if (Array.isArray(user.badges)) cells.push({ label: 'Badges', value: user.badges.length })
    return cells
  }, [user])

  const completion = useMemo(() => profileCompletion(user), [user])

  const focusableItems = () => itemRefs.current.filter(Boolean)

  /* Moves focus `offset` rows away from the focused one, wrapping around.
     With focus still on the trigger, ArrowDown lands on the first row and
     ArrowUp on the last. */
  const focusItemAt = (offset) => {
    const items = focusableItems()
    if (!items.length) return
    const current = items.findIndex((el) => el === document.activeElement)
    if (current === -1) {
      items[offset < 0 ? items.length - 1 : 0]?.focus()
      return
    }
    items[(current + offset + items.length) % items.length]?.focus()
  }

  const onMenuKeyDown = (event) => {
    const items = focusableItems()
    if (!items.length) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusItemAt(1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusItemAt(-1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      items[0]?.focus()
    } else if (event.key === 'End') {
      event.preventDefault()
      items[items.length - 1]?.focus()
    }
  }

  const onTriggerKeyDown = (event) => {
    if (!profileDropdownOpen) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      focusItemAt(event.key === 'ArrowDown' ? 1 : -1)
    }
  }

  const menuItemClass =
    'flex h-11 w-full items-center gap-3 rounded-lg px-3 font-sans text-[14px] font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary/40'

  const cardVariants = {
    hidden: { opacity: 0, y: -4 },
    visible: { opacity: 1, y: 0 },
    exiting: { opacity: 0, y: -4 },
  }

  const installIndex = menuItems.length
  const logoutIndex = menuItems.length + 1

  return (
    <>
      <header
        /* Sticky inside the Main panel instead of fixed to the window. The
           negative bottom margin cancels its own height so it overlays the
           first --topbar-h of content, exactly like the old `fixed` bar —
           which means every page's existing pt-* compensation still resolves
           to the same offset and no page needed editing. */
        className="sticky top-0 z-30 hidden h-[var(--topbar-h)] -mb-[var(--topbar-h)] items-center border-b border-hairline bg-white px-4 lg:flex"
      >
        <div className="ml-auto flex items-center gap-3">
          <TopBarSearch />

          {user && <NotificationBell />}

          {user ? (
              <div ref={profileRef}>
                <button
                  ref={triggerRef}
                  type="button"
                  onClick={() => setProfileDropdownOpen((v) => !v)}
                  onKeyDown={onTriggerKeyDown}
                  aria-expanded={profileDropdownOpen}
                  aria-haspopup="menu"
                  className={cn(
                    'flex items-center gap-2.5 rounded-full border py-1.5 pl-2 pr-3 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-white',
                    profileDropdownOpen ? 'border-primary bg-soft-stone' : 'border-hairline bg-white hover:border-muted hover:bg-soft-stone/50'
                  )}
                >
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary font-display text-[12px] font-medium text-white">
                    {user.photo ? (
                      <img src={user.photo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      user.name?.charAt(0)?.toUpperCase() || 'U'
                    )}
                  </span>
                  <span className="hidden max-w-[120px] truncate font-sans text-[13px] font-medium text-ink sm:block">
                    {user.name?.split(' ')[0]}
                  </span>
                  <ChevronDown
                    size={12}
                    className={cn(
                      'text-muted transition-transform duration-200',
                      profileDropdownOpen && 'rotate-180 text-ink'
                    )}
                  />
                </button>

                <AnimatePresence>
                  {profileDropdownOpen && cardPosition && (
                    <Portal>
                      <motion.div
                        key="profile-card"
                        ref={dropdownRef}
                        initial="hidden"
                        animate="visible"
                        exit="exiting"
                        variants={cardVariants}
                        transition={reduceMotion ? { duration: 0 } : { duration: 0.15, ease: EASE.mac }}
                        style={{
                          position: 'fixed',
                          top: cardPosition.top,
                          right: cardPosition.right,
                        }}
                        className="z-50 flex w-[340px] max-h-[calc(100vh-16px)] flex-col rounded-2xl border border-hairline bg-white p-4 shadow-modal"
                      >
                     {/* 1 — Header: avatar + completion ring, edit-profile pill */}
                     <div className="flex shrink-0 items-start justify-between gap-3">
                       <CompletionAvatar user={user} percentage={completion} />

                       <Link
                         to={`/profile/${user._id}`}
                         onClick={closeMenu}
                         className="mt-1 inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-soft px-3 py-1.5 font-sans text-[12px] font-medium text-ink transition-colors duration-150 hover:bg-surface-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                       >
                         Edit Profile
                         <ChevronRight size={13} strokeWidth={2} className="text-muted" />
                       </Link>
                     </div>

                     {/* 2 + 3 — Name, email, role badge */}
                     <div className="mt-3 shrink-0">
                       <div className="flex items-center gap-2">
                         <p className="min-w-0 truncate font-display text-xl font-semibold text-ink">{user.name}</p>
                         {roleInfo && (
                           <span
                             className={cn(
                               'flex-shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider',
                               roleInfo.color
                             )}
                           >
                             {roleInfo.label}
                           </span>
                         )}
                       </div>
                       <p className="truncate font-sans text-sm text-muted">{user.email || user.rollNumber}</p>
                       {(user.rollNumber || user.batch) && (
                         <p className="mt-0.5 truncate font-mono text-[11px] text-muted">
                           {[user.rollNumber, user.batch ? `Batch ${user.batch}` : null].filter(Boolean).join(' · ')}
                         </p>
                       )}
                     </div>

                     {/* 4 — Stats strip (real counts only) */}
                     {stats.length > 0 && (
                       <div
                         className={cn(
                           'mt-3 grid shrink-0 divide-x divide-hairline rounded-xl border border-hairline bg-gradient-to-r from-primary/5 to-primary/0',
                           stats.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
                         )}
                       >
                         {stats.map((stat) => (
                           <div key={stat.label} className="px-3 py-2.5 text-center">
                             <p className="font-display text-[18px] font-medium leading-none text-ink">{stat.value}</p>
                             <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted">
                               {stat.label}
                             </p>
                           </div>
                         ))}
                       </div>
                     )}

                     <div className="my-3 h-px shrink-0 bg-hairline" />

                     {/* 5 — Menu list */}
                     <div
                       role="menu"
                       aria-label="Account"
                       onKeyDown={onMenuKeyDown}
                       className="min-h-0 flex-1 overflow-y-auto font-sans"
                     >
                       {menuItems.map((item, index) => (
                         <Link
                           key={`${item.label}-${item.to}`}
                           ref={(el) => {
                             itemRefs.current[index] = el
                           }}
                           to={item.to}
                           role="menuitem"
                           onClick={closeMenu}
                           className={cn(
                             menuItemClass,
                             item.tone === 'coral'
                               ? 'text-signature-coral hover:bg-signature-coral/10'
                               : 'text-ink hover:bg-surface-soft'
                           )}
                         >
                           <item.icon size={20} strokeWidth={1.75} className="flex-shrink-0 text-muted" />
                           <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
                           {item.badge > 0 && (
                             <span className="flex h-5 min-w-[20px] flex-shrink-0 items-center justify-center rounded-full bg-signature-coral px-1.5 font-mono text-[10px] font-bold text-white">
                               {item.badge > 9 ? '9+' : item.badge}
                             </span>
                           )}
                         </Link>
                       ))}

                       {canInstall && !appInstalled &&
                         (installPromptEvent ? (
                           <button
                             ref={(el) => {
                               itemRefs.current[installIndex] = el
                             }}
                             type="button"
                             role="menuitem"
                             onClick={handleInstallApp}
                             className={cn(menuItemClass, 'text-ink hover:bg-surface-soft')}
                           >
                             <Download size={20} strokeWidth={1.75} className="flex-shrink-0 text-muted" />
                             <span className="flex-1 text-left">Install App</span>
                           </button>
                         ) : (
                           <div role="none">
                             <div className="flex items-center gap-3 px-3 py-1 font-sans text-[14px] font-medium text-ink">
                               <Download size={20} strokeWidth={1.75} className="flex-shrink-0 text-muted" />
                               <span>Install App</span>
                             </div>
                             <p className="px-3 pb-1 pl-11 font-sans text-[11px] leading-relaxed text-muted">
                               Tap the <span className="font-medium">Share</span> button, then{' '}
                               <span className="font-medium">&quot;Add to Home Screen&quot;</span>.
                             </p>
                           </div>
                         ))}

                       <div role="separator" className="my-1 h-px bg-hairline" />

                       {/* 6 — Logout */}
                       <button
ref={(el) => {
                            itemRefs.current[logoutIndex] = el
                          }}
                          type="button"
                          role="menuitem"
                          onClick={handleLogout}
                          className={cn(menuItemClass, 'text-signature-coral hover:bg-signature-coral/10')}
                       >
                         <LogOut size={20} strokeWidth={1.75} className="flex-shrink-0" />
                         <span className="flex-1 text-left">Logout</span>
                       </button>
                     </div>

                     {/* 7 — Brand line */}
                     <div className="mt-3 shrink-0 border-t border-hairline pt-3 text-center">
                       <p className="font-display text-[11px] font-medium text-muted">{BRAND_NAME}</p>
                     </div>
                      </motion.div>
                    </Portal>
                  )}
                </AnimatePresence>
              </div>
            ) : (
             <Link to="/login" className="button-primary !py-1.5 !px-4 !text-[13px]">
               Sign in
             </Link>
           )}
        </div>
      </header>
    </>
  )
}