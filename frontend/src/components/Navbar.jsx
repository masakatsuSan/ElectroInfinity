import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlobalSearch from './GlobalSearch';

const NAV_LINKS = [
  { to: '/about',      label: 'About'      },
  { to: '/faculty',    label: 'Faculty'    },
  { to: '/laboratory', label: 'Labs'       },
  { to: '/courses',    label: 'Courses'    },
  { to: '/resources',  label: 'Resources'  },
  { to: '/events',     label: 'Events'     },
  { to: '/gallery',    label: 'Gallery'    },
  { to: '/contact',    label: 'Contact'    },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

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

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate('/login');
  };

  const navLinkClass = (isActive) =>
    `relative px-3.5 py-1.5 rounded-full text-[14px] font-sans font-medium transition-colors ${
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

  const roleInfo = user ? getRoleBadge(user.role) : null;

  return (
    <>
      <nav className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none transition-all duration-200">
        <div className="w-full max-w-[1280px] rounded-full px-6 py-2.5 flex items-center justify-between pointer-events-auto bg-canvas/95 backdrop-blur-md border border-hairline shadow-card">
          
          {/* Left: Brand Logo */}
          <Link to="/" className="flex items-center gap-2" onClick={closeMenu}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-deep-green"></span>
              <span className="font-display font-bold text-[18px] tracking-tight text-ink">
                Electro Infinity
              </span>
            </div>
          </Link>

          {/* Center: Navigation links */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(l => (
              <NavLink key={l.to} to={l.to} className={({ isActive }) => navLinkClass(isActive)}>
                {l.label}
              </NavLink>
            ))}
          </div>

          {/* Right: Search & Profile Button Dropdown */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="text-body-muted hover:text-ink transition-colors p-1.5 rounded-full hover:bg-soft-stone"
              aria-label="Search (Ctrl+K)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>

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
                      <img src={user.photo} alt={user.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      user.name?.charAt(0)?.toUpperCase() || 'U'
                    )}
                  </div>
                  
                  <div className="text-left leading-tight hidden sm:block">
                    <p className="font-sans text-[13px] font-semibold text-ink truncate max-w-[120px]">
                      {user.name?.split(' ')[0]}
                    </p>
                  </div>

                  <svg
                    width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    className={`text-slate transition-transform duration-200 ${profileOpen ? 'rotate-180 text-ink' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-canvas text-ink border border-hairline rounded-2xl shadow-modal p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    {/* Header info */}
                    <div className="p-3 bg-soft-stone rounded-xl mb-2">
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
                          Batch {user.batch} {user.section && `· Sec ${user.section}`}
                        </p>
                      )}
                    </div>

                    {/* Navigation Actions based on Role */}
                    <div className="space-y-1 text-[13px] font-sans font-medium">
                      
                      {/* Faculty actions */}
                      {user.role === 'faculty' && (
                        <>
                          <Link
                            to="/attendance/faculty"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-deep-green font-semibold hover:bg-pale-green transition-colors"
                          >
                            <span>⚡</span> Take Attendance (Live QR)
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
                      {(user.role === 'student' || user.role === 'cr') && (
                        <>
                          <Link
                            to="/attendance/student"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-ink font-semibold hover:bg-soft-stone transition-colors"
                          >
                            <span>📷</span> Scan Attendance QR
                          </Link>
                          <Link
                            to="/students"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-ink hover:bg-soft-stone transition-colors"
                          >
                             My Attendance & Stats
                          </Link>
                          <Link
                            to="/students"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-ink hover:bg-soft-stone transition-colors"
                          >
                            Deadlines & Routine
                          </Link>
                          <Link
                            to="/forum"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-ink hover:bg-soft-stone transition-colors"
                          >
                             Discussion Forum
                          </Link>
                        </>
                      )}

                      {/* CR Panel Link */}
                      {user.role === 'cr' && (
                        <Link
                          to="/admin"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-coral font-semibold hover:bg-coral/10 transition-colors"
                        >
                          <span>⊞</span> CR Control Panel
                        </Link>
                      )}

                      {/* Admin actions */}
                      {(user.role === 'admin' || user.role === 'super_admin') && (
                        <>
                          <Link
                            to="/admin"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-ink font-semibold hover:bg-soft-stone transition-colors"
                          >
                            <span>⊞</span> Admin Console
                          </Link>
                          <Link
                            to="/admin/attendance"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-ink hover:bg-soft-stone transition-colors"
                          >
                            <span>👨‍🏫</span> Faculty & Attendance
                          </Link>
                          <Link
                            to="/admin/students"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-ink hover:bg-soft-stone transition-colors"
                          >
                            <span>👥</span> Student Directory
                          </Link>
                          <Link
                            to="/forum"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-ink hover:bg-soft-stone transition-colors"
                          >
                             Discussion Forum
                          </Link>
                        </>
                      )}

                      <div className="h-px bg-hairline my-1"></div>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-error hover:bg-red-50 transition-colors text-left font-medium"
                      >
                        <span>⏻</span> Sign Out
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
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="text-ink p-2 hover:bg-soft-stone rounded-full"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
            <button
              aria-label="Toggle menu"
              onClick={() => setMenuOpen(o => !o)}
              className="text-ink p-2 hover:bg-soft-stone rounded-full"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay menu */}
      <div className={`fixed inset-0 z-40 bg-canvas flex flex-col px-6 transition-opacity duration-200 lg:hidden ${
        menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="pt-[100px] flex-1 overflow-y-auto pb-8">
          {user && (
            <div className="p-4 bg-soft-stone rounded-2xl mb-6 border border-hairline">
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

          <nav className="flex flex-col space-y-3 py-2">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `font-display text-[20px] font-semibold border-b border-hairline pb-2.5 transition-colors ${
                    isActive ? 'text-deep-green' : 'text-ink hover:text-deep-green'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            
            <div className="pt-4 space-y-2">
              {user ? (
                <div className="flex flex-col gap-2">
                  {user.role === 'faculty' && (
                    <Link to="/attendance/faculty" onClick={closeMenu} className="button-primary w-full justify-center !bg-deep-green">
                      ⚡ Take Attendance
                    </Link>
                  )}
                  {(user.role === 'cr' || user.role === 'admin') && (
                    <Link to="/admin" onClick={closeMenu} className="button-secondary w-full justify-center">
                      {user.role === 'admin' ? 'Admin Dashboard' : 'CR Panel'}
                    </Link>
                  )}
                  {(user.role === 'student' || user.role === 'cr') && (
                    <>
                      <Link to="/attendance/student" onClick={closeMenu} className="button-primary w-full justify-center">
                        📷 Scan Class QR
                      </Link>
                      <Link to="/students" onClick={closeMenu} className="button-secondary w-full justify-center">
                        My Dashboard & Attendance
                      </Link>
                    </>
                  )}
                  <button onClick={() => { logout(); closeMenu() }} className="font-sans text-[15px] text-error font-semibold text-left py-2">
                    Sign out
                  </button>
                </div>
              ) : (
                <Link to="/login" onClick={closeMenu} className="button-primary w-full justify-center">
                  Sign in
                </Link>
              )}
            </div>
          </nav>
        </div>
      </div>

      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
    </>
  );
}
