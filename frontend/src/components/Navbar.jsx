import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useScrollLock } from '../context/LayoutContext';
import GlobalSearch from './GlobalSearch';
import NotificationBell from './NotificationBell';
import {
  Menu, X, Megaphone, Power,
  Download
} from 'lucide-react'
import {
  isHiddenRoute,
  getRoleBadge,
  mobileGroups,
  mobileStandaloneLinks,
} from './nav/navConfig'
import { useInstallApp } from './nav/useInstallApp'
import { useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { installPromptEvent, appInstalled,
          isIosDevice, handleInstallApp: promptInstall, dismissInstallBar, showFloatingInstallBar } = useInstallApp();
  const userRole = String(user?.role ?? '').trim().toLowerCase();

  if (isHiddenRoute(location.pathname)) {
    return null
  }

  /* This overlay only ever opens below lg, where the window is the scrollport,
     so the lock keeps the original body behaviour — it just goes through the
     shared, reference-counted lock instead of writing body styles directly
     (the unconditional reset on cleanup used to flash an unlock). */
  useScrollLock(menuOpen)

  // Desktop owns Ctrl+K (TopBar), so this listener only applies below lg.
  // Navbar stays mounted above lg for a clean CSS handoff, and a second
  // handler would open a duplicate GlobalSearch modal there.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onKey = (e) => {
      if (mq.matches) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [])

  const closeMenu = () => setMenuOpen(false)

  const handleLogout = () => {
    logout();
    navigate('/login');
  }

  // The shared hook only prompts the browser; the mobile overlay additionally
  // dismisses itself before installing.
  const handleInstallApp = async () => {
    closeMenu();
    await promptInstall();
  }

  const roleInfo = user ? getRoleBadge(userRole) : null

  return (
    <>
      <nav view-transition-name="navbar" className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-hairline lg:hidden">
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
      <div className={`fixed inset-0 z-40 flex flex-col bg-white overflow-hidden lg:hidden ${
        menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="fixed top-[72px] bottom-0 left-0 right-0 overflow-y-auto px-4 sm:px-6 py-6 pb-8 no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
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
                  <Link to={`/profile/${user._id}`} onClick={closeMenu} className="justify-center w-full button-secondary">
                  My Profile
                  </Link>
                  {user.role === 'faculty' && (
                    <>
                      <Link to="/faculty/dashboard" onClick={closeMenu} className="justify-center w-full button-secondary">
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

            {mobileGroups().map(group => (
              <div key={group.label}>
                <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted mb-2.5 px-1">{group.label}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {group.children.map(item => {
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

            {mobileStandaloneLinks().map(l => (
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
              <button onClick={() => { logout(); closeMenu() }} className="flex items-center w-full gap-3 p-3 mt-2 text-left transition-colors border rounded-lg border-signature-coral/20 bg-signature-coral/5 hover:bg-signature-coral/10">
                <span className="flex items-center justify-center flex-shrink-0 text-white rounded-lg w-9 h-9 bg-signature-coral">
                  <Power size={17} strokeWidth={2} />
                </span>
                <span className="font-sans text-[15px] font-medium text-signature-coral flex-1">Sign Out</span>
              </button>
            ) : (
              <Link to="/login" onClick={closeMenu} className="flex items-center w-full gap-3 p-3 mt-2 text-left transition-colors border rounded-lg border-primary/20 bg-primary/5 hover:bg-primary/10">
                <span className="flex items-center justify-center flex-shrink-0 text-white rounded-lg w-9 h-9 bg-primary">
                  <Power size={17} strokeWidth={2} />
                </span>
                <span className="font-sans text-[15px] font-medium text-primary flex-1">Sign In</span>
              </Link>
            )}

            {!appInstalled && (installPromptEvent || isIosDevice()) && (
              <div className="p-3 mt-2 border rounded-lg border-hairline bg-surface-soft">
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
                    <p className="flex items-center gap-2 mb-1 font-medium font-display text-ink">
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
        <div className="fixed z-40 bottom-4 left-4 right-4 md:hidden">
          <div className="flex items-center gap-3 p-3 pr-2 bg-white border rounded-lg shadow-lg border-hairline">
            <span className="flex items-center justify-center flex-shrink-0 w-10 h-10 text-white rounded-lg bg-primary">
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
              className="flex items-center justify-center flex-shrink-0 w-8 h-8 transition-colors rounded-full text-muted hover:bg-soft-stone"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

