import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion'
import GlobalSearch from './GlobalSearch';
import NotificationBell from './NotificationBell';
import {
  LayoutGrid, School, Contact, MessagesSquare,
  CalendarClock, Search, ChevronDown, ChevronRight,
  Power, Menu, X, Megaphone, BookOpen, FlaskConical,
  Briefcase, Rocket, Image, UserCheck, FolderOpen, GraduationCap,
  Beaker, FileText, Download, Bell
} from 'lucide-react'
import { DROPDOWN_VARIANTS, DROPDOWN_TRANSITION, MODAL_VARIANTS, MODAL_TRANSITION, EASE } from '../utils/motion'

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

const NAV_GROUPS = [
  {
    label: 'Academics',
    items: [
      { to: '/about', label: 'About', icon: School },
      { to: '/faculty', label: 'Faculty', icon: UserCheck },
      { to: '/courses', label: 'Courses', icon: BookOpen },
    ]
  },
  {
    label: 'Resources',
    items: [
      { to: '/laboratory', label: 'Labs', icon: FlaskConical },
      { to: '/resources', label: 'Study Materials', icon: FolderOpen },
      { to: '/gallery', label: 'Gallery', icon: Image },
    ]
  },
  {
    label: 'Community',
    items: [
      { to: '/forum', label: 'Forum', icon: MessagesSquare, flip: true },
      { to: '/projects', label: 'Projects', icon: Rocket },
      { to: '/announcements', label: 'Announcements', icon: Megaphone },
      { to: '/calendar', label: 'Calendar', icon: CalendarClock },
    ]
  },
]

const STANDALONE_LINKS = [
  { to: '/contact', label: 'Contact' }
]

export default function Navbar({ onForumFlip }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [appInstalled, setAppInstalled] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(false);
  const profileRef = useRef(null);
  const dropdownRefs = useRef({});
  const userRole = String(user?.role ?? '').trim().toLowerCase();

  if (isHiddenRoute(location.pathname)) {
    return null
  }

  useEffect(() => {
    if (menuOpen) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.overflow = 'hidden'
      document.body.style.width = '100%'
    }
    return () => {
      const scrollY = parseInt(document.body.style.top || '0', 10)
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.overflow = ''
      document.body.style.width = ''
      if (menuOpen) {
        window.scrollTo(0, scrollY)
      }
    }
  }, [menuOpen])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [])

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };
    const onAppInstalled = () => {
      setAppInstalled(true);
      setInstallPromptEvent(null);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setAppInstalled(true);
    }
    setIsAndroid(isAndroidDevice());
    try {
      if (localStorage.getItem('ei_install_dismissed') === '1') {
        setInstallDismissed(true);
      }
    } catch (_) {}
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, [])

  const isIosDevice = () => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    return /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  }

  const isAndroidDevice = () => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    return /Android/i.test(ua);
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (dropdownOpen && dropdownRefs.current[dropdownOpen] && !dropdownRefs.current[dropdownOpen].contains(e.target)) {
        setDropdownOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen])

  const closeMenu = () => setMenuOpen(false)

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate('/login');
  }

  const handleInstallApp = async () => {
    if (!installPromptEvent) return;
    closeMenu();
    setProfileOpen(false);
    try {
      installPromptEvent.prompt();
      const choice = await installPromptEvent.userChoice;
      if (choice?.outcome === 'accepted') {
        setInstallPromptEvent(null);
      }
    } catch (_) {
      setInstallPromptEvent(null);
    }
  }

  const dismissInstallBar = () => {
    setInstallDismissed(true);
    try { localStorage.setItem('ei_install_dismissed', '1') } catch (_) {}
  }

  const showFloatingInstallBar = !appInstalled && !installDismissed && isAndroid && installPromptEvent

  const getRoleBadge = (role) => {
    switch (role) {
      case 'faculty':
        return { label: 'Faculty', color: 'bg-signature-forest text-white' };
      case 'admin':
      case 'super_admin':
        return { label: 'Admin', color: 'bg-primary text-white' };
      case 'cr':
        return { label: 'CR', color: 'bg-signature-coral text-white' };
      default:
        return { label: 'Student', color: 'bg-signature-mint text-primary border border-signature-mint/30' };
    }
  }

  const roleInfo = user ? getRoleBadge(userRole) : null

  const navLinkClass = (isActive) =>
    `inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[14px] font-sans font-medium transition-colors ${
      isActive
        ? 'text-ink bg-soft-stone'
        : 'text-muted hover:text-ink hover:bg-soft-stone/60'
    }`

  const dropdownItemClass = (isActive) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-sans font-medium transition-all ${
      isActive
        ? 'text-ink bg-soft-stone'
        : 'text-muted hover:text-ink hover:bg-soft-stone'
    }`

  const iconTileClass = (isActive) =>
    `w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
      isActive
        ? 'bg-primary text-white'
        : 'bg-soft-stone text-muted'
    }`
  const iconTileStyle = { transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }

  const featuredCard = (group) => {
    if (group.label === 'Academics') {
      return (
        <div className="hidden lg:flex flex-col w-60 p-3 rounded-xl bg-surface-soft border border-hairline">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-signature-coral mb-1">Featured Section</span>
          <p className="font-display font-medium text-[16px] text-ink leading-snug mb-1">Explore the Curriculum</p>
          <p className="font-sans text-[12px] text-muted leading-relaxed mb-2">Semester-wise subjects, labs, and study materials in one place.</p>
          <NavLink to="/courses" onClick={() => setDropdownOpen(null)} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline">
            View All Courses <ChevronRight size={14} />
          </NavLink>
        </div>
      );
    }
    if (group.label === 'Community') {
      return (
        <div className="hidden lg:flex flex-col w-60 p-3 rounded-xl bg-surface-soft border border-hairline">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-signature-coral mb-1">What's Happening</span>
          <p className="font-display font-medium text-[16px] text-ink leading-snug mb-1">Join the Conversation</p>
          <p className="font-sans text-[12px] text-muted leading-relaxed mb-2">Latest discussions, projects, and announcements from peers.</p>
          <NavLink to="/forum" onClick={() => setDropdownOpen(null)} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline">
            Open Forum <ChevronRight size={14} />
          </NavLink>
        </div>
      );
    }
    if (group.label === 'Resources') {
      return (
        <div className="hidden lg:flex flex-col w-60 p-3 rounded-xl bg-surface-soft border border-hairline">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-signature-coral mb-1">Resources</span>
          <p className="font-display font-medium text-[16px] text-ink leading-snug mb-1">Tools & Materials</p>
          <p className="font-sans text-[12px] text-muted leading-relaxed mb-2">Access labs, study materials, and the gallery in one place.</p>
          <NavLink to="/resources" onClick={() => setDropdownOpen(null)} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline">
            Browse Resources <ChevronRight size={14} />
          </NavLink>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      <nav className="fixed left-0 right-0 z-50 top-0 bg-white border-b border-hairline">
        <div className="w-full max-w-[1440px] mx-auto px-4 md:px-6 xl:px-10 h-16 flex items-center justify-between">
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-1">
            <Link to="/" className="flex items-center gap-2" onClick={closeMenu}>
              <div className="flex items-center gap-2">
                <span className="font-display font-medium text-[18px] tracking-tight text-ink">
                  Electro Infinity
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Navigation links */}
          <div className="items-center hidden gap-1 lg:flex">
            {NAV_GROUPS.map(group => (
              <div
                key={group.label}
                ref={el => dropdownRefs.current[group.label] = el}
                className="relative py-2"
              >
                <button
                  onClick={() => setDropdownOpen(dropdownOpen === group.label ? null : group.label)}
                  className={`relative flex items-center gap-1 px-3 py-1.5 rounded-full text-[14px] font-sans font-medium transition-colors duration-200 ${
                    dropdownOpen === group.label
                      ? 'text-ink bg-soft-stone'
                      : 'text-muted hover:text-ink hover:bg-soft-stone/60'
                  }`}
                  style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
                >
                  <span className="relative z-10">{group.label}</span>
                  <ChevronDown size={14} className={`relative z-10 transition-transform duration-200 ${dropdownOpen === group.label ? 'rotate-180' : ''}`} style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }} />
                </button>

                <AnimatePresence>
                  {dropdownOpen === group.label && (
                    <motion.div
                      key={group.label}
                      className="absolute top-full left-1/2 -translate-x-1/2 w-[500px] bg-white border border-hairline rounded-xl shadow-sm py-0 z-50 origin-top"
                      initial="hidden"
                      animate="visible"
                      exit="exiting"
                      variants={DROPDOWN_VARIANTS}
                      transition={DROPDOWN_TRANSITION}
                    >
                      <div className="flex gap-2 p-2">
                        <div className="flex-1 min-w-0">
                          {group.items.map(item => {
                            const Icon = item.icon
                            return (
                              <NavLink
                                key={item.to}
                                to={item.to}
                                onClick={(e) => {
                                  if (item.flip && user && typeof onForumFlip === 'function') {
                                    e.preventDefault()
                                    const el = e.currentTarget
                                    const rect = el.getBoundingClientRect()
                                    const borderRadius = getComputedStyle(el).borderRadius
                                    setDropdownOpen(null)
                                    onForumFlip({ rect, borderRadius })
                                  } else {
                                    setDropdownOpen(null)
                                  }
                                }}
                                className={({ isActive }) => `group flex items-center gap-3 px-2.5 py-2 rounded-lg transition-all duration-200 ${dropdownItemClass(isActive)}`}
                                style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
                              >
                                <span className={iconTileClass(item.to === '/courses' || item.to === '/forum')}>
                                  {Icon && <Icon size={18} strokeWidth={1.75} />}
                                </span>
                                <span className="flex-1">
                                  <span className="block text-[14px] font-normal">{item.label}</span>
                                </span>
                                <ChevronRight size={14} className="text-muted opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }} />
                              </NavLink>
                            )
                          })}
                        </div>
                        {featuredCard(group)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            {STANDALONE_LINKS.map(l => (
              <NavLink key={l.to} to={l.to} className={({ isActive }) => navLinkClass(isActive)}>
                {l.label}
              </NavLink>
            ))}
          </div>

          {/* Right: Search & Profile Button Dropdown */}
          <div className="items-center hidden gap-3 md:flex">
            <button
              onClick={() => setSearchOpen(true)}
              className="text-muted hover:text-ink transition-colors p-1.5 rounded-full hover:bg-soft-stone"
              aria-label="Search (Ctrl+K)"
            >
              <Search size={18} />
            </button>

            {user && <NotificationBell />}

            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className={`flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full border transition-all ${
                    profileOpen
                      ? 'border-primary bg-soft-stone'
                      : 'border-hairline hover:border-muted bg-white hover:bg-soft-stone/50'
                  }`}
                  aria-expanded={profileOpen}
                >
                  <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-display font-medium text-[12px] flex-shrink-0">
                    {user.photo ? (
                      <img src={user.photo} alt={user.name} className="object-cover w-full h-full rounded-full" />
                    ) : (
                      user.name?.charAt(0)?.toUpperCase() || 'U'
                    )}
                  </div>

                  <div className="hidden leading-tight text-left sm:block">
                    <p className="font-sans text-[13px] font-medium text-ink truncate max-w-[120px]">
                      {user.name?.split(' ')[0]}
                    </p>
                  </div>

                  <ChevronDown size={12} className={`text-muted transition-transform duration-200 ${profileOpen ? 'rotate-180 text-ink' : ''}`} style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }} />
                </button>

                {profileOpen && (
                  <motion.div
                    className="absolute right-0 z-50 p-2 mt-2 border w-72 bg-white text-ink border-hairline rounded-xl shadow-lg"
                    initial="hidden"
                    animate="visible"
                    exit="exiting"
                    variants={MODAL_VARIANTS}
                    transition={MODAL_TRANSITION}
                  >
                    <div className="p-3 mb-2 bg-soft-stone rounded-lg">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-display font-medium text-[15px] text-ink truncate">{user.name}</p>
                        {roleInfo && (
                          <span className={`font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${roleInfo.color}`}>
                            {roleInfo.label}
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-[12px] text-muted truncate">
                        {user.rollNumber || user.email}
                      </p>
                      {user.batch && (
                        <p className="font-sans text-[11px] text-muted mt-0.5">
                          Batch {user.batch}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1 text-[13px] font-sans font-medium">
                      {userRole === 'faculty' && (
                        <>
                          <Link
                            to={`/profile/${user._id}`}
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-ink font-medium hover:bg-soft-stone transition-colors"
                          >
                            <UserCheck size={17} strokeWidth={1.75} /> My Profile
                          </Link>
                          <Link
                            to="/faculty/dashboard"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-ink font-medium hover:bg-soft-stone transition-colors"
                          >
                            <LayoutGrid size={17} strokeWidth={1.75} /> Faculty Dashboard
                          </Link>
                        </>
                      )}

                      {(userRole === 'student' || userRole === 'cr') && (
                        <>
                          <Link
                            to={`/profile/${user._id}`}
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-ink font-medium hover:bg-soft-stone transition-colors"
                          >
                            <UserCheck size={17} strokeWidth={1.75} /> My Profile
                          </Link>
                          <Link
                            to="/students"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-ink hover:bg-soft-stone transition-colors"
                          >
                            <CalendarClock size={17} strokeWidth={1.75} /> Deadlines & Routine
                          </Link>
                          <Link
                            to="/forum"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-ink hover:bg-soft-stone transition-colors"
                          >
                            <MessagesSquare size={17} strokeWidth={1.75} /> Discussion Forum
                          </Link>
                        </>
                      )}

                      {userRole === 'cr' && (
                        <Link
                          to="/admin"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-signature-coral font-medium hover:bg-signature-coral/10 transition-colors"
                        >
                          <LayoutGrid size={17} strokeWidth={1.75} /> CR Control Panel
                        </Link>
                      )}

                      {(userRole === 'admin' || userRole === 'super_admin') && (
                        <>
                          <Link
                            to="/admin"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-ink font-medium hover:bg-soft-stone transition-colors"
                          >
                            <LayoutGrid size={17} strokeWidth={1.75} /> Admin Console
                          </Link>
                          <Link
                            to="/admin/faculty"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-ink hover:bg-soft-stone transition-colors"
                          >
                            <UserCheck size={17} strokeWidth={1.75} /> Faculty Directory
                          </Link>
                          <Link
                            to="/admin/students"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-ink hover:bg-soft-stone transition-colors"
                          >
                            <Contact size={17} strokeWidth={1.75} /> Student Directory
                          </Link>
                          <Link
                            to="/forum"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-ink hover:bg-soft-stone transition-colors"
                          >
                            <MessagesSquare size={17} strokeWidth={1.75} /> Discussion Forum
                          </Link>
                        </>
                      )}

                      <div className="h-px my-1 bg-hairline"></div>

                      {!appInstalled && (installPromptEvent || isIosDevice()) && (
                        <div className="mx-1 my-1">
                          {installPromptEvent ? (
                            <button
                              onClick={handleInstallApp}
                              className="w-full flex items-center gap-2.5 p-3 rounded-lg border border-primary/20 bg-surface-soft hover:bg-soft-stone transition-colors text-left"
                            >
                              <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white flex-shrink-0">
                                <Download size={15} strokeWidth={2} />
                              </span>
                              <span className="flex-1 font-sans text-[13px] font-medium text-ink">Install App</span>
                            </button>
                          ) : (
                            <div className="p-3 rounded-lg border border-hairline bg-surface-soft text-[12px] font-sans text-ink leading-relaxed">
                              <p className="font-display font-medium text-ink mb-1 flex items-center gap-2 text-[13px]">
                                <Download size={14} strokeWidth={2} /> Install App
                              </p>
                              <p>Tap the <span className="font-medium">Share</span> button, then <span className="font-medium">"Add to Home Screen"</span>.</p>
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 p-3 mt-1 rounded-lg border border-signature-coral/20 bg-signature-coral/5 hover:bg-signature-coral/10 transition-colors text-left"
                      >
                        <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-signature-coral text-white flex-shrink-0">
                          <Power size={15} strokeWidth={2} />
                        </span>
                        <span className="flex-1 font-sans text-[13px] font-medium text-signature-coral">Sign Out</span>
                       </button>
                     </div>
                   </motion.div>
                 )}
              </div>
            ) : (
              <Link to="/login" className="button-primary !py-1.5 !px-4 !text-[13px]">
                Sign in
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex items-center gap-2 lg:hidden">
            {user && <NotificationBell />}
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="p-2 rounded-full text-ink hover:bg-soft-stone"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
            <button
              aria-label="Toggle menu"
              onClick={() => setMenuOpen(o => !o)}
              className="p-2 rounded-full text-ink hover:bg-soft-stone"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay menu */}
      <div className={`fixed inset-0 z-40 bg-white ${
        menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="absolute top-[72px] bottom-0 left-4 right-4 sm:left-6 sm:right-6 overflow-y-auto pb-8 no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
          {user && (
            <div className="p-4 mb-6 border bg-soft-stone rounded-xl border-hairline">
              <div className="flex items-center justify-between mb-1">
                <p className="font-display font-medium text-[18px] text-ink">{user.name}</p>
                {roleInfo && (
                  <span className={`font-mono text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${roleInfo.color}`}>
                    {roleInfo.label}
                  </span>
                )}
              </div>
              <p className="font-mono text-[13px] text-muted">{user.rollNumber || user.email}</p>
            </div>
          )}

          <nav className="flex flex-col gap-6">
            {user && (
              <div className="p-4 bg-white border border-hairline rounded-xl">
                <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted mb-3">Quick Actions</h3>
                <div className="flex flex-col gap-2">
                  <Link to={`/profile/${user._id}`} onClick={closeMenu} className="button-secondary w-full justify-center">
                  My Profile
                  </Link>
                  {user.role === 'faculty' && (
                    <>
                      <Link to="/faculty/dashboard" onClick={closeMenu} className="button-secondary w-full justify-center">
                        <Megaphone size={16} /> Faculty Dashboard
                      </Link>
                    </>
                  )}
                  {(user.role === 'cr' || user.role === 'admin') && (
                    <Link to="/admin" onClick={closeMenu} className="justify-center w-full button-secondary">
                      {user.role === 'admin' ? 'Admin Dashboard' : 'CR Panel'}
                    </Link>
                  )}
                  {(user.role === 'student' || user.role === 'cr') && (
                    <div className="grid grid-cols-2 gap-2.5">
                      <Link to="/students" onClick={closeMenu} className="button-secondary justify-center col-span-2 !rounded-lg">
                        My Dashboard
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {NAV_GROUPS.map(group => (
              <div key={group.label}>
                <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted mb-2.5 px-1">{group.label}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {group.items.map(item => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={closeMenu}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-3 py-3 rounded-lg border transition-all ${
                            isActive
                              ? 'bg-soft-stone border-hairline text-ink font-medium'
                              : 'bg-white border-hairline text-muted hover:text-ink'
                          }`
                        }
                      >
                        {Icon && <Icon size={18} strokeWidth={1.75} className="flex-shrink-0" />}
                        <span className="font-sans text-[13px] font-medium truncate">{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}

            {STANDALONE_LINKS.map(l => (
              <div key={l.to}>
                <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted mb-2.5 px-1">More</h3>
                <NavLink
                  to={l.to}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-3 rounded-lg border transition-all ${
                      isActive
                        ? 'bg-soft-stone border-hairline text-ink font-medium'
                        : 'bg-white border-hairline text-muted hover:text-ink'
                    }`
                  }
                >
                  <span className="font-sans text-[13px] font-medium">{l.label}</span>
                </NavLink>
              </div>
            ))}

            {user ? (
              <button onClick={() => { logout(); closeMenu() }} className="w-full flex items-center gap-3 p-3 rounded-lg border border-signature-coral/20 bg-signature-coral/5 hover:bg-signature-coral/10 transition-colors text-left mt-2">
                <span className="w-9 h-9 flex items-center justify-center rounded-lg bg-signature-coral text-white flex-shrink-0">
                  <Power size={17} strokeWidth={2} />
                </span>
                <span className="font-sans text-[15px] font-medium text-signature-coral flex-1">Sign Out</span>
              </button>
            ) : (
              <Link to="/login" onClick={closeMenu} className="w-full flex items-center gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors text-left mt-2">
                <span className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary text-white flex-shrink-0">
                  <Power size={17} strokeWidth={2} />
                </span>
                <span className="font-sans text-[15px] font-medium text-primary flex-1">Sign In</span>
              </Link>
            )}

            {!appInstalled && (installPromptEvent || isIosDevice()) && (
              <div className="mt-2 p-3 rounded-lg border border-hairline bg-surface-soft">
                {installPromptEvent ? (
                  <button
                    onClick={handleInstallApp}
                    className="w-full flex items-center justify-center gap-2.5 px-3 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-active transition-colors"
                  >
                    <Download size={18} strokeWidth={1.75} />
                    <span className="font-sans text-[14px]">Install App</span>
                  </button>
                ) : (
                  <div className="text-[13px] font-sans text-muted leading-relaxed">
                    <p className="font-display font-medium text-ink mb-1 flex items-center gap-2">
                      <Download size={16} strokeWidth={1.75} /> Install App
                    </p>
                    <p>Tap the <span className="font-medium">Share</span> button, then choose <span className="font-medium">"Add to Home Screen"</span> to install Electro Infinity on your iPhone.</p>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>
      </div>

      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}

      {showFloatingInstallBar && (
        <div className="fixed bottom-4 left-4 right-4 z-40 md:hidden">
          <div className="flex items-center gap-3 p-3 pr-2 rounded-lg border border-hairline bg-white shadow-lg">
            <span className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary text-white flex-shrink-0">
              <Download size={18} strokeWidth={2} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-display font-medium text-[13px] text-ink leading-tight">Install Electro Infinity</p>
              <p className="font-sans text-[11px] text-muted leading-tight">Tap to install the app on your device</p>
            </div>
            <button
              onClick={handleInstallApp}
              className="px-3 py-2 rounded-lg bg-primary text-white font-sans text-[12px] font-medium hover:bg-primary-active transition-colors"
            >
              Install
            </button>
            <button
              onClick={dismissInstallBar}
              aria-label="Dismiss install hint"
              className="w-8 h-8 flex items-center justify-center rounded-full text-muted hover:bg-soft-stone transition-colors flex-shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
