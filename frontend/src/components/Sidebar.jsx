import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronsLeft, ChevronsRight, Download, LogIn, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useInstallApp } from './nav/useInstallApp'
import { useSidebarStateContext } from './nav/SidebarStateContext'
import {
  HOME_LINK,
  NAV_GROUPS,
  STANDALONE_LINKS,
  TERMS_LINK,
  findGroupForPathname,
  mostSpecificActive,
  resolveMySpaceLinks,
} from './nav/navConfig'
import { cn } from '../utils/cn'
import { useAnchorRect, RailTooltip } from './sidebar/SidebarFlyout'
import { itemClass, iconClass, iconWrapClass, labelClass } from './sidebar/SidebarItem'
import { SidebarGroup } from './sidebar/SidebarGroup'
import { BRAND_NAME } from '../config/brand'
import BrandLogo from './BrandLogo'

function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(hover: hover)')
    setIsTouch(!mq.matches)
    const handler = (e) => setIsTouch(!e.matches)
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])
  return isTouch
}

function InstallFooterItem({ collapsed, installPromptEvent, onInstall, open, onToggle }) {
  const anchorRef = useRef(null)
  const rect = useAnchorRect(anchorRef, open && !installPromptEvent)

  const flyoutWidth = 256
  const flyoutStyle = useMemo(() => {
    if (!rect) return { top: 0, left: 0 }
    const rightEdge = rect.left + flyoutWidth
    if (rightEdge > window.innerWidth) {
      return { top: rect.top, left: rect.left - flyoutWidth }
    }
    return { top: rect.top, left: rect.left }
  }, [rect])

  const button = (
    <button
      ref={anchorRef}
      type="button"
      onClick={() => (installPromptEvent ? onInstall() : onToggle())}
      aria-expanded={installPromptEvent ? undefined : open}
      aria-label={collapsed ? 'Install App' : undefined}
      className={itemClass({ collapsed, isActive: false })}
    >
      <span className={iconWrapClass}>
        <Download size={20} strokeWidth={1.75} className={iconClass(false)} />
      </span>
      <span className={cn('font-sans text-[14px]', labelClass(collapsed))}>
        Install App
      </span>
    </button>
  )

  return (
    <>
      {collapsed ? <RailTooltip label="Install App">{button}</RailTooltip> : button}
      {open &&
        !installPromptEvent &&
        rect &&
        createPortal(
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            onMouseEnter={onToggle}
            onMouseLeave={onToggle}
            style={flyoutStyle}
            className="fixed z-50 w-64 rounded-xl border border-hairline bg-surface-soft p-3 shadow-modal"
          >
            <p className="mb-1 flex items-center gap-2 font-display text-[13px] font-medium text-ink">
              <Download size={14} strokeWidth={2} /> Install App
            </p>
            <p className="font-sans text-[12px] leading-relaxed text-muted">
              Tap the <span className="font-medium">Share</span> button, then choose{' '}
              <span className="font-medium">&quot;Add to Home Screen&quot;</span> to install {BRAND_NAME} on your
              iPhone.
            </p>
          </motion.div>,
          document.body
        )}
    </>
  )
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { collapsed, setCollapsed, toggle, profileDropdownOpen } = useSidebarStateContext()
  const { installPromptEvent, appInstalled, canInstall, handleInstallApp } = useInstallApp()

  const [openGroups, setOpenGroups] = useState([])
  const [openFlyout, setOpenFlyout] = useState(null)
  const [showIosHelp, setShowIosHelp] = useState(false)
  const isTouchDevice = useIsTouchDevice()

  const hoverTimeoutRef = useRef(null)
  const closeTimeoutRef = useRef(null)

  const pathname = location.pathname
  const isCollapsed = collapsed

  const mySpaceLinks = useMemo(() => resolveMySpaceLinks(user), [user])

  const activeTo = useMemo(() => {
    const candidates = [
      HOME_LINK,
      ...STANDALONE_LINKS,
      TERMS_LINK,
      ...(user ? mySpaceLinks : []),
      ...NAV_GROUPS.flatMap((g) => g.children),
    ]
    return mostSpecificActive(pathname, candidates)
  }, [pathname, user, mySpaceLinks])

  useEffect(() => {
    const group = findGroupForPathname(pathname)
    if (!group) return
    setOpenGroups((prev) => (prev.includes(group.label) ? prev : [...prev, group.label]))
  }, [pathname])

  useEffect(() => {
    setCollapsed(true)
  }, [location.pathname, setCollapsed])

  useEffect(() => {
    if (!collapsed) {
      const handlePointerDown = (e) => {
        const sidebar = document.querySelector('[data-ei-sidebar]')
        if (sidebar && !sidebar.contains(e.target)) {
          setCollapsed(true)
        }
      }
      document.addEventListener('pointerdown', handlePointerDown)
      return () => document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [collapsed, setCollapsed])

  useEffect(() => {
    if (!openFlyout && !showIosHelp) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpenFlyout(null)
        setShowIosHelp(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openFlyout, showIosHelp])

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    }
  }, [])

  const toggleGroup = (label) =>
    setOpenGroups((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]))

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleMouseEnter = () => {
    if (isTouchDevice) return
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    if (collapsed) {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = setTimeout(() => {
        setCollapsed(false)
      }, 100)
    }
  }

  const handleMouseLeave = () => {
    if (isTouchDevice) return
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    closeTimeoutRef.current = setTimeout(() => {
      if (!openFlyout && !profileDropdownOpen) {
        setCollapsed(true)
      }
    }, 150)
  }

  const handleAsideClick = () => {
    if (isTouchDevice && collapsed) {
      setCollapsed(false)
    }
  }

  const renderPlainLink = (link) => {
    const active = activeTo === link.to

    const el = (
      <NavLink
        to={link.to}
        end
        aria-current={active ? 'page' : undefined}
        aria-label={isCollapsed ? link.label : undefined}
        className={itemClass({ collapsed: isCollapsed, isActive: active })}
        onClick={() => {
          setOpenFlyout(null)
          setShowIosHelp(false)
        }}
      >
        <span className={iconWrapClass}>
          <link.icon size={20} strokeWidth={1.75} className={iconClass(active)} />
        </span>
        <span className={cn('font-sans text-[14px]', labelClass(isCollapsed))}>
          {link.label}
        </span>
      </NavLink>
    )

    if (!isCollapsed) return <li key={link.to}>{el}</li>
    return (
      <li key={link.to}>
        <RailTooltip label={link.label}>{el}</RailTooltip>
      </li>
    )
  }

  const brand = (
    <div className="flex h-16 w-full items-center px-3 overflow-hidden">
      {isCollapsed ? (
        <BrandLogo variant="mark" className="flex-1 justify-center" />
      ) : (
        <BrandLogo variant="full" expanded style={{ marginLeft: '4px' }} />
      )}

      {!isCollapsed && (
        <button
          type="button"
          onClick={toggle}
          aria-label="Collapse sidebar"
          aria-expanded={!collapsed}
          className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors duration-200 hover:bg-surface-soft hover:text-ink focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <ChevronsLeft size={18} strokeWidth={1.75} />
        </button>
      )}
    </div>
  )

  const termsItem = (
    <NavLink
      to={TERMS_LINK.to}
      end
      aria-current={activeTo === TERMS_LINK.to ? 'page' : undefined}
      aria-label={isCollapsed ? TERMS_LINK.label : undefined}
      className={cn(
        itemClass({ collapsed: isCollapsed, isActive: false }),
        activeTo === TERMS_LINK.to && 'bg-surface-strong text-ink'
      )}
    >
      <span className={iconWrapClass}>
        <TERMS_LINK.icon size={isCollapsed ? 20 : 16} strokeWidth={1.75} className="shrink-0" />
      </span>
      <span className={cn('font-sans text-[13px]', labelClass(isCollapsed))}>
        {TERMS_LINK.label}
      </span>
    </NavLink>
  )

  const signOutItem = (
    <button
      type="button"
      onClick={handleLogout}
      aria-label={isCollapsed ? 'Sign out' : undefined}
      className={cn(
        itemClass({ collapsed: isCollapsed, isActive: false }),
        'bg-signature-coral/5 text-signature-coral hover:bg-signature-coral/10'
      )}
    >
      <span className={iconWrapClass}>
        <LogOut size={isCollapsed ? 20 : 17} strokeWidth={1.75} className="shrink-0" />
      </span>
      <span className={cn('font-sans text-[14px]', labelClass(isCollapsed))}>
        Sign out
      </span>
    </button>
  )

  const withTooltip = (node, label) => (isCollapsed ? <RailTooltip label={label}>{node}</RailTooltip> : node)

  const footer = (
    <div className="space-y-1 border-t border-hairline px-3 pt-2">
      {canInstall &&
        !appInstalled && (
          <InstallFooterItem
            collapsed={isCollapsed}
            installPromptEvent={installPromptEvent}
            onInstall={handleInstallApp}
            open={showIosHelp}
            onToggle={() => setShowIosHelp((v) => !v)}
          />
        )}

      {withTooltip(termsItem, TERMS_LINK.label)}

      {user ? (
        withTooltip(signOutItem, 'Sign out')
      ) : isCollapsed ? (
        <Link to="/login" aria-label="Sign in" className="button-primary h-11 w-full !justify-center !p-0">
          <span className={iconWrapClass}>
            <LogIn size={20} strokeWidth={1.75} />
          </span>
        </Link>
      ) : (
        <div className="px-1">
          <Link to="/login" className="button-primary w-full !justify-center !py-2 !text-[13px]">
            Sign in
          </Link>
        </div>
      )}
    </div>
  )

  return (
    <aside
      data-ei-sidebar
      aria-label="Main"
      style={{
        /* Inset by the shell frame gutter. Width uses the CSS vars the shell
           wrapper publishes from SIDEBAR_DIMENSIONS, so the rail and the Main
           panel's left offset can never drift apart. */
        top: 'var(--shell-gap)',
        bottom: 'var(--shell-gap)',
        left: 'var(--shell-gap)',
        width: isCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-expanded)',
      }}
      className={cn(
        'fixed z-40 hidden flex-col rounded-2xl border border-hairline bg-white shadow-modal lg:flex',
        'transition-[width] duration-200 ease-in-out'
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleAsideClick}
    >
      {/* Clips the scrolling nav to the card's rounded corners. The rail itself
          stays overflow-visible so the expand handle can sit outside its edge. */}
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-2xl">
        {brand}

        <nav className="flex-1 min-h-0 space-y-3 overflow-y-auto overflow-x-hidden px-3 pb-3 no-scrollbar">
          <ul className="space-y-0.5">
            {renderPlainLink(HOME_LINK)}
            {NAV_GROUPS.map((group) => (
              <SidebarGroup
                key={group.label}
                group={group}
                collapsed={isCollapsed}
                pathname={pathname}
                activeTo={activeTo}
                open={openGroups.includes(group.label)}
                onToggle={() => toggleGroup(group.label)}
                openFlyout={openFlyout}
                setOpenFlyout={setOpenFlyout}
                isTouchDevice={isTouchDevice}
              />
            ))}
            {STANDALONE_LINKS.map(renderPlainLink)}
          </ul>

          {user && mySpaceLinks.length > 0 && (
            <div>
                <div className="px-3 pb-3 pt-3">
                <div className="h-px w-full bg-hairline" />
                {!isCollapsed && (
                  <p className="pt-3 font-mono text-[10px] font-bold uppercase tracking-widest text-muted">My Space</p>
                )}
              </div>
              <ul className="space-y-0.5">{mySpaceLinks.map(renderPlainLink)}</ul>
            </div>
          )}
        </nav>

        <div className="pb-2">{footer}</div>

        {isCollapsed && (
          <button
            type="button"
            onClick={toggle}
            aria-label="Expand sidebar"
            aria-expanded={!collapsed}
            className="absolute -right-3 top-1/2 z-50 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-hairline bg-white text-muted shadow-card transition-colors duration-200 hover:bg-surface-soft hover:text-ink focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <ChevronsRight size={15} strokeWidth={2} />
          </button>
        )}
      </div>
    </aside>
  )
}
