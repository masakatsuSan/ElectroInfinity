import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
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
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const isLightNav = menuOpen;

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

  const closeMenu = () => setMenuOpen(false);

  const navLinkClass = (isActive) =>
    `relative px-5 py-2.5 rounded-[999px] text-[15px] font-sans font-medium tracking-tight transition-colors ${
      isActive
        ? isLightNav ? 'text-[#141413]' : 'text-ink'
        : isLightNav ? 'text-[#141413]/70 hover:text-[#141413]' : 'text-ink-muted-80 hover:text-ink'
    }`;

  const iconBtnClass = isLightNav
    ? 'text-[#141413] hover:text-[#141413]/70 transition-colors p-2'
    : 'text-ink hover:text-ink-muted-48 transition-colors p-2';

  return (
    <>
      <nav className={`fixed top-6 left-0 right-0 z-50 flex justify-center px-4 md:px-8 pointer-events-none transition-all duration-300`}>
        <div className={`w-full max-w-[1280px] rounded-[999px] px-6 md:px-10 py-3 md:py-4 flex items-center justify-between pointer-events-auto border transition-all duration-300 ${
          isLightNav
            ? 'bg-white/95 border-black/15 shadow-[0_8px_32px_rgba(0,0,0,0.15)]'
            : 'bg-white/85 dark:bg-[#141413]/85 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] border-black/10 dark:border-white/10'
        }`}>
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group" onClick={closeMenu}>
            <div className="flex flex-col">
              <span className={`font-display font-extrabold text-[20px] md:text-[24px] leading-none tracking-tight ${
                isLightNav ? 'text-[#141413]' : 'text-ink'
              }`}>Electro Infinity</span>
            </div>
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(l => (
              <NavLink key={l.to} to={l.to}
                className={({ isActive }) => navLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <span className="relative z-10">{l.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="nav-active-pill"
                        className={`absolute inset-0 rounded-[999px] -z-10 ${
                          isLightNav 
                            ? 'bg-black/10' 
                            : 'bg-surface-pearl border border-divider-soft shadow-sm dark:bg-white/10 dark:border-white/5'
                        }`}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Right controls */}
          <div className="hidden md:flex items-center gap-4">
            <button onClick={toggleTheme}
              className={iconBtnClass} aria-label="Toggle Theme">
              {theme === 'light' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              )}
            </button>
            <button onClick={() => setSearchOpen(true)}
              className={iconBtnClass} aria-label="Search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>

            {user ? (
              <div className="flex items-center gap-1.5 ml-1">
                {(user.role === 'cr' || user.role === 'admin') && (
                  <Link to="/admin"
                    className="button-dark-utility whitespace-nowrap !px-3 !py-1.5 !text-[13px]">
                    {user.role === 'admin' ? 'Admin Dashboard' : 'CR Panel'}
                  </Link>
                )}
                {(user.role === 'student' || user.role === 'cr' || user.role === 'admin') && (
                  <>
                    <Link to="/forum"
                      className="button-dark-utility whitespace-nowrap !px-3 !py-1.5 !text-[13px]">
                      Forum
                    </Link>
                    <Link to="/students"
                      className="button-dark-utility whitespace-nowrap !px-3 !py-1.5 !text-[13px]">
                      Dashboard
                    </Link>
                  </>
                )}
                <button onClick={logout}
                  className="whitespace-nowrap text-[13px] font-sans font-medium text-ink-muted-48 hover:text-ink transition-colors ml-1.5">
                  Log out
                </button>
              </div>
            ) : (
              <Link to="/login"
                className="button-primary ml-2">
                Sign in
              </Link>
            )}
          </div>

          {/* Mobile: search + burger */}
          <div className="lg:hidden flex items-center gap-4">
            <button onClick={() => setSearchOpen(true)} aria-label="Search"
              className={isLightNav ? 'text-[#141413] hover:text-[#141413]/70 transition-colors' : 'text-ink hover:text-ink-muted-48 transition-colors'}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
            <button aria-label="Toggle menu" aria-expanded={menuOpen}
              onClick={() => setMenuOpen(o => !o)}
              className={`transition-colors rounded-full p-2 ${
                isLightNav
                  ? 'text-[#141413] hover:text-[#141413]/70 bg-black/5'
                  : 'text-ink hover:text-ink-muted-48 bg-surface-tile-1'
              }`}>
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

      {/* Full-screen overlay menu */}
      <div className={`fixed inset-0 z-40 bg-dark-gray flex flex-col px-6 transition-opacity duration-300 lg:hidden ${
        menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="pt-[120px] flex-1 overflow-y-auto pb-8">
          <nav className="flex flex-col space-y-4 py-8">
            {NAV_LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} onClick={closeMenu}
                className={({ isActive }) =>
                  `font-display text-[28px] font-semibold tracking-normal transition-colors border-b border-divider-soft pb-4 ${
                    isActive ? 'text-primary' : 'text-ink hover:text-primary'
                  }`
                }>
                {l.label}
              </NavLink>
            ))}
            
            <div className="pt-8">
              {user ? (
                <div className="flex flex-col gap-4">
                  {(user.role === 'cr' || user.role === 'admin') && (
                    <Link to="/admin" onClick={closeMenu}
                      className="font-display text-[24px] font-semibold tracking-normal text-ink-muted-80 hover:text-ink transition-colors">
                      {user.role === 'admin' ? 'Admin Dashboard' : 'CR Panel'}
                    </Link>
                  )}
                  {(user.role === 'student' || user.role === 'cr' || user.role === 'admin') && (
                    <>
                      <Link to="/forum" onClick={closeMenu}
                        className="font-display text-[24px] font-semibold tracking-normal text-ink-muted-80 hover:text-ink transition-colors">
                        Forum
                      </Link>
                      <Link to="/students" onClick={closeMenu}
                        className="font-display text-[24px] font-semibold tracking-normal text-ink-muted-80 hover:text-ink transition-colors">
                        Dashboard
                      </Link>
                    </>
                  )}
                  <button onClick={() => { logout(); closeMenu() }} className="font-display text-[24px] font-semibold tracking-normal text-ink-muted-80 hover:text-ink transition-colors text-left">
                    Log out
                  </button>
                </div>
              ) : (
                <Link to="/login" onClick={closeMenu} className="font-display text-[24px] font-semibold tracking-normal text-primary hover:text-primary-focus transition-colors">
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
