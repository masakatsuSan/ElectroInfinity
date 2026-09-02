import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlobalSearch from './GlobalSearch';
import NotificationBell from './NotificationBell';
import { LayoutGrid, School, Contact, MessagesSquare, QrCode, BarChart3, CalendarClock, ScanQrCode, Search, ChevronDown, ChevronRight, Power, Menu, X, Megaphone, Zap, Camera, BookOpen, FlaskConical, Briefcase, Rocket, Image, UserCheck, FolderOpen, GraduationCap, Beaker, FileText, Download } from 'lucide-react'

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
];

const STANDALONE_LINKS = [
  { to: '/contact', label: 'Contact' },
]

export default function Navbar({ onForumFlip }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [appInstalled, setAppInstalled] = useState(false);
  const profileRef = useRef(null);
  const dropdownRefs = useRef({});
  const userRole = String(user?.role ?? '').trim().toLowerCase();

  useEffect(() => {
    if (menuOpen || profileOpen || dropdownOpen) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.overflow = 'hidden'
      document.body.style.width = '100%'
    } else {
      const scrollY = parseInt(document.body.style.top || '0', 10)
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.overflow = ''
      document.body.style.width = ''
      window.scrollTo(0, scrollY)
    }
    return () => {
      const scrollY = parseInt(document.body.style.top || '0', 10)
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.overflow = ''
      document.body.style.width = ''
      window.scrollTo(0, scrollY)
    }
  }, [menuOpen, profileOpen, dropdownOpen])

  // Open search with Cmd/Ctrl+K
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Capture PWA install prompt
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
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const isIosDevice = () => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    return /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  };

  // Close profile dropdown when clicking outside
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
  }, [dropdownOpen]);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate('/login');
  };

  const handleInstallApp = async () => {
    if (!installPromptEvent) return;
    closeMenu();
    try {
      installPromptEvent.prompt();
      const choice = await installPromptEvent.userChoice;
      if (choice?.outcome === 'accepted') {
        setInstallPromptEvent(null);
      }
    } catch (_) {
      setInstallPromptEvent(null);
    }
  };

  const navLinkClass = (isActive) =>
    `block px-3 py-2 rounded-lg text-[14px] font-sans font-medium transition-colors ${
      isActive
        ? 'text-ink bg-soft-stone font-semibold'
        : 'text-body-muted hover:text-ink hover:bg-soft-stone/60'
    }`;

  // Role badge helper
  const getRoleBadge = (role) => {
    switch (role) {
      case 'faculty':
        return { label: 'Faculty', color: 'bg-deep-green text-white' };
      case 'admin':
      case 'super_admin':
        return { label: 'Admin', color: 'bg-primary text-white' };
      case 'cr':
        return { label: 'CR (Class Rep)', color: 'bg-coral text-white' };
      default:
        return { label: 'Student', color: 'bg-pale-green text-deep-green border border-green-200' };
    }
  };

  const roleInfo = user ? getRoleBadge(userRole) : null;

  const dropdownItemClass = (isActive) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-sans font-medium transition-all ${
      isActive
        ? 'text-ink bg-soft-stone font-semibold'
        : 'text-body-muted hover:text-ink hover:bg-soft-stone'
    }`;

  const iconTileClass = (isActive) =>
    `w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
      isActive
        ? 'bg-primary text-white shadow-md scale-105'
        : 'bg-soft-stone text-body-muted group-hover:bg-primary group-hover:text-white group-hover:shadow-md group-hover:scale-105'
    }`;

  const featuredCard = (group) => {
    if (group.label === 'Academics') {
      return (
        <div className="hidden lg:flex flex-col w-60 p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-canvas border border-hairline">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-coral mb-2">Featured Section</span>
          <p className="font-display font-bold text-[16px] text-ink leading-snug mb-1">Explore the Curriculum</p>
          <p className="font-sans text-[12px] text-body-muted leading-relaxed mb-4">Semester-wise subjects, labs, and study materials in one place.</p>
          <NavLink to="/courses" onClick={() => setDropdownOpen(null)} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline">
            View All Courses <ChevronRight size={14} />
          </NavLink>
        </div>
      );
    }
    if (group.label === 'Community') {
      return (
        <div className="hidden lg:flex flex-col w-60 p-5 rounded-2xl bg-gradient-to-br from-coral/10 to-canvas border border-hairline">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-coral mb-2">What's Happening</span>
          <p className="font-display font-bold text-[16px] text-ink leading-snug mb-1">Join the Conversation</p>
          <p className="font-sans text-[12px] text-body-muted leading-relaxed mb-4">Latest discussions, projects, and announcements from peers.</p>
          <NavLink to="/forum" onClick={() => setDropdownOpen(null)} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline">
            Open Forum <ChevronRight size={14} />
          </NavLink>
        </div>
      );
    }
    if (group.label === 'Resources') {
      return (
        <div className="hidden lg:flex flex-col w-60 p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-canvas border border-hairline">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-coral mb-2">Resources</span>
          <p className="font-display font-bold text-[16px] text-ink leading-snug mb-1">Tools & Materials</p>
          <p className="font-sans text-[12px] text-body-muted leading-relaxed mb-4">Access labs, study materials, and the gallery in one place.</p>
          <NavLink to="/resources" onClick={() => setDropdownOpen(null)} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline">
            Browse Resources <ChevronRight size={14} />
          </NavLink>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <nav className="fixed left-0 right-0 z-50 flex justify-center px-4 transition-all duration-200 pointer-events-none top-4">
        <div className="w-full max-w-[1280px] rounded-full px-6 py-2.5 flex items-center justify-between pointer-events-auto bg-white/95 backdrop-blur-md border border-hairline shadow-card">
          
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-1">
            <Link to="/" className="flex items-center gap-2" onClick={closeMenu}>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-[18px] tracking-tight text-ink">
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
                onMouseEnter={() => setDropdownOpen(group.label)}
                onMouseLeave={() => setDropdownOpen(null)}
              >
                <button
                  onClick={() => setDropdownOpen(dropdownOpen === group.label ? null : group.label)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[14px] font-sans font-bold transition-colors ${
                    dropdownOpen === group.label
                      ? 'text-ink bg-soft-stone'
                      : 'text-body-muted hover:text-ink hover:bg-soft-stone/60'
                  }`}
                >
                  {group.label}
                  <ChevronDown size={14} className={`transition-transform duration-200 ${dropdownOpen === group.label ? 'rotate-180' : ''}`} />
                </button>
                
                {dropdownOpen === group.label && (
                   <div 
                     className="absolute top-full left-1/2 -translate-x-1/2 w-[620px] bg-white border border-hairline rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] py-2 z-50"
                     onMouseEnter={() => setDropdownOpen(group.label)}
                     onMouseLeave={() => setDropdownOpen(null)}
                   >
                    <div className="flex gap-2 p-2">
                      <div className="flex-1">
                        {group.items.map(item => (
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
                            className={({ isActive }) => `group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${dropdownItemClass(isActive)}`}
                          >
                            <span className={iconTileClass(item.to === '/courses' || item.to === '/forum')}>
                              {item.icon && <item.icon size={18} strokeWidth={1.75} />}
                            </span>
                            <span className="flex-1">
                              <span className="block text-[14px] font-normal">{item.label}</span>
                            </span>
                            <ChevronRight size={14} className="text-slate opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                          </NavLink>
                        ))}
                      </div>
                      {featuredCard(group)}
                    </div>
                  </div>
                )}
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
               className="text-body-muted hover:text-ink transition-colors p-1.5 rounded-full hover:bg-soft-stone"
               aria-label="Search (Ctrl+K)"
             >
               <Search size={18} />
            </button>

            {user && <NotificationBell />}

            {user ? (
              /* Profile Button with Interactive Dropdown */
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className={`flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full border transition-all ${
                    profileOpen
                      ? 'border-primary bg-soft-stone shadow-sm'
                      : 'border-hairline hover:border-slate bg-canvas hover:bg-soft-stone/50'
                  }`}
                  aria-expanded={profileOpen}
                >
                  {/* User Initial Avatar */}
                  <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-display font-bold text-[12px] flex-shrink-0">
                    {user.photo ? (
                      <img src={user.photo} alt={user.name} className="object-cover w-full h-full rounded-full" />
                    ) : (
                      user.name?.charAt(0)?.toUpperCase() || 'U'
                    )}
                  </div>
                  
                  <div className="hidden leading-tight text-left sm:block">
                    <p className="font-sans text-[13px] font-semibold text-ink truncate max-w-[120px]">
                      {user.name?.split(' ')[0]}
                    </p>
                  </div>

                  <ChevronDown size={12} className={`text-slate transition-transform duration-200 ${profileOpen ? 'rotate-180 text-ink' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {profileOpen && (
                  <div className="absolute right-0 z-50 p-2 mt-2 duration-150 border w-72 bg-white text-ink border-hairline rounded-2xl shadow-modal animate-in fade-in zoom-in-95">
                    {/* Header info */}
                    <div className="p-3 mb-2 bg-soft-stone rounded-xl">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-display font-bold text-[15px] text-ink truncate">{user.name}</p>
                        {roleInfo && (
                          <span className={`font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${roleInfo.color}`}>
                            {roleInfo.label}
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-[12px] text-slate truncate">
                        {user.rollNumber || user.email}
                      </p>
                      {user.batch && (
                        <p className="font-sans text-[11px] text-body-muted mt-0.5">
                          Batch {user.batch}
                        </p>
                      )}
                    </div>

                    {/* Navigation Actions based on Role */}
                    <div className="space-y-1 text-[13px] font-sans font-medium">
                                                {/* Faculty actions */}
                      {userRole === 'faculty' && (
                        <>
                          <Link
                            to={`/profile/${user._id}`}
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-ink font-semibold hover:bg-soft-stone transition-colors"
                          >
                            <UserCheck size={17} strokeWidth={1.75} /> My Profile
                          </Link>
                          <Link
                            to="/faculty/dashboard"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-ink font-semibold hover:bg-soft-stone transition-colors"
                          >
                            <LayoutGrid size={17} strokeWidth={1.75} /> Faculty Dashboard
                          </Link>
                          <Link
                            to="/attendance/faculty"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-deep-green font-semibold hover:bg-pale-green transition-colors"
                          >
                            <ScanQrCode size={17} strokeWidth={1.75} /> Take Attendance (Live QR)
                          </Link>
                          <Link
                            to="/attendance/faculty"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-ink hover:bg-soft-stone transition-colors"
                          >
                             My Classes & Rosters
                          </Link>
                        </>
                      )}

                      {/* Student & CR actions */}
                      {(userRole === 'student' || userRole === 'cr') && (
                        <>
                          <Link
                            to={`/profile/${user._id}`}
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-ink font-semibold hover:bg-soft-stone transition-colors"
                          >
                            <UserCheck size={17} strokeWidth={1.75} /> My Profile
                          </Link>
                          <Link
                            to="/scan-qr"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-ink font-semibold hover:bg-soft-stone transition-colors"
                          >
                            <ScanQrCode size={17} strokeWidth={1.75} /> Scan Profile QR
                          </Link>
                          <Link
                            to="/attendance/student"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-ink font-semibold hover:bg-soft-stone transition-colors"
                          >
                            <QrCode size={17} strokeWidth={1.75} /> Scan Attendance QR
                          </Link>
                          <Link
                            to="/students"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-ink hover:bg-soft-stone transition-colors"
                          >
                            <BarChart3 size={17} strokeWidth={1.75} /> My Attendance & Stats
                          </Link>
                          <Link
                            to="/students"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-ink hover:bg-soft-stone transition-colors"
                          >
                             <CalendarClock size={17} strokeWidth={1.75} />Deadlines & Routine
                          </Link>
                          <Link
                            to="/forum"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-ink hover:bg-soft-stone transition-colors"
                          >
                            <MessagesSquare size={17} strokeWidth={1.75} />Discussion Forum
                          </Link>
                        </>
                      )}

                      {/* CR Panel Link */}
                      {userRole === 'cr' && (
                        <Link
                          to="/admin"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-coral font-semibold hover:bg-coral/10 transition-colors"
                        >
                          <LayoutGrid size={17} strokeWidth={1.75} /> CR Control Panel
                        </Link>
                      )}

                      {/* Admin actions */}
                      {(userRole === 'admin' || userRole === 'super_admin') && (
                        <>
                          <Link
                            to="/admin"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-ink font-semibold hover:bg-soft-stone transition-colors"
                          >
                            <LayoutGrid size={17} strokeWidth={1.75} /> Admin Console
                          </Link>
                          <Link
                            to="/admin/attendance"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-ink hover:bg-soft-stone transition-colors"
                          >
                            <School size={17} strokeWidth={1.75} /> Faculty & Attendance
                          </Link>
                          <Link
                            to="/admin/students"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-ink hover:bg-soft-stone transition-colors"
                          >
                            <Contact size={17} strokeWidth={1.75} /> Student Directory
                          </Link>
                          <Link
                            to="/forum"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-ink hover:bg-soft-stone transition-colors"
                          >
                            <MessagesSquare size={17} strokeWidth={1.75} /> Discussion Forum
                          </Link>
                        </>
                      )}

                      <div className="h-px my-1 bg-hairline"></div>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 p-3 mt-1 rounded-xl border border-error/20 bg-gradient-to-br from-error/5 to-white hover:from-error/10 hover:to-white transition-colors text-left"
                      >
                        <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-error text-white flex-shrink-0">
                          <Power size={15} strokeWidth={2} />
                        </span>
                        <span className="flex-1 font-sans text-[13px] font-semibold text-error">Sign Out</span>
                      </button>
                    </div>
                  </div>
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
      <div className={`fixed inset-0 z-40 bg-canvas flex flex-col px-4 sm:px-6 transition-opacity duration-200 lg:hidden no-scrollbar ${
        menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="pt-[100px] flex-1 overflow-y-auto pb-8">
          {user && (
            <div className="p-4 mb-6 border bg-soft-stone rounded-2xl border-hairline">
              <div className="flex items-center justify-between mb-1">
                <p className="font-display font-bold text-[18px] text-ink">{user.name}</p>
                {roleInfo && (
                  <span className={`font-mono text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${roleInfo.color}`}>
                    {roleInfo.label}
                  </span>
                )}
              </div>
              <p className="font-mono text-[13px] text-slate">{user.rollNumber || user.email}</p>
            </div>
          )}

          <nav className="flex flex-col gap-6">
            {user && (
              <div className="p-4 bg-white border border-divider-soft rounded-2xl">
                <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted-80 mb-3">Quick Actions</h3>
                <div className="flex flex-col gap-2">
                  <Link to={`/profile/${user._id}`} onClick={closeMenu} className="button-secondary w-full justify-center">
                    <UserCheck size={16} /> My Profile
                  </Link>
                  {(user.role === 'faculty') && (
                    <>
                      <Link to="/faculty/dashboard" onClick={closeMenu} className="button-secondary w-full justify-center">
                        <Megaphone size={16} /> Faculty Dashboard
                      </Link>
                      <Link to="/attendance/faculty" onClick={closeMenu} className="button-primary w-full justify-center !bg-deep-green">
                        <Zap size={16} /> Take Attendance
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
                      <Link to="/scan-qr" onClick={closeMenu} className="button-primary justify-center !rounded-2xl !py-3 !px-3 text-[13px]">
                        <ScanQrCode size={15} /> Scan Profile QR
                      </Link>
                      <Link to="/attendance/student" onClick={closeMenu} className="button-primary justify-center !rounded-2xl !py-3 !px-3 text-[13px]">
                        <Camera size={15} /> Scan Class QR
                      </Link>
                      <Link to="/students" onClick={closeMenu} className="button-secondary justify-center col-span-2 !rounded-2xl">
                        My Dashboard & Attendance
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {NAV_GROUPS.map(group => (
              <div key={group.label}>
                <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted-80 mb-2.5 px-1">{group.label}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {group.items.map(item => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={closeMenu}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-3 py-3 rounded-xl border transition-all ${
                            isActive
                              ? 'bg-soft-stone border-divider-soft text-ink font-semibold'
                              : 'bg-white border-transparent text-body-muted hover:border-divider-soft hover:text-ink'
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
                <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted-80 mb-2.5 px-1">More</h3>
                <NavLink
                  to={l.to}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-3 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-soft-stone border-divider-soft text-ink font-semibold'
                        : 'bg-white border-transparent text-body-muted hover:border-divider-soft hover:text-ink'
                    }`
                  }
                >
                  <span className="font-sans text-[13px] font-medium">{l.label}</span>
                </NavLink>
              </div>
            ))}

            <button onClick={() => { logout(); closeMenu() }} className="w-full flex items-center gap-3 p-3 rounded-2xl border border-error/20 bg-gradient-to-br from-error/5 to-white hover:from-error/10 transition-colors text-left mt-2">
              <span className="w-9 h-9 flex items-center justify-center rounded-xl bg-error text-white flex-shrink-0">
                <Power size={17} strokeWidth={2} />
              </span>
              <span className="font-sans text-[15px] font-semibold text-error flex-1">Sign Out</span>
            </button>

            {!appInstalled && (installPromptEvent || isIosDevice()) && (
              <div className="mt-2 p-3 rounded-2xl border border-hairline bg-gradient-to-br from-primary/10 to-canvas">
                {installPromptEvent ? (
                  <button
                    onClick={handleInstallApp}
                    className="w-full flex items-center justify-center gap-2.5 px-3 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
                  >
                    <Download size={18} strokeWidth={1.75} />
                    <span className="font-sans text-[14px]">Install App</span>
                  </button>
                ) : (
                  <div className="text-[13px] font-sans text-body-muted leading-relaxed">
                    <p className="font-display font-bold text-ink mb-1 flex items-center gap-2">
                      <Download size={16} strokeWidth={1.75} /> Install App
                    </p>
                    <p>Tap the <span className="font-semibold">Share</span> button, then choose <span className="font-semibold">"Add to Home Screen"</span> to install Electro Infinity on your iPhone.</p>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>
      </div>

      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
    </>
  );
}
