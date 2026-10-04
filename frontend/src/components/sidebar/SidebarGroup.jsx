import { useCallback, useEffect, useRef } from 'react'
import { ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAnchorRect, SidebarFlyout, RailTooltip } from './SidebarFlyout'
import { ChildLink, itemClass, iconClass, iconWrapClass, labelClass } from './SidebarItem'
import { isGroupActive } from '../nav/navConfig'
import { cn } from '../../utils/cn'

export function SidebarGroup({
  group,
  collapsed,
  pathname,
  activeTo,
  open,
  onToggle,
  openFlyout,
  setOpenFlyout,
  isTouchDevice,
}) {
  const Icon = group.icon
  const active = isGroupActive(pathname, group)
  const flyoutOpen = openFlyout === group.label

  const anchorRef = useRef(null)
  const rect = useAnchorRect(anchorRef, collapsed && flyoutOpen)

  const hoverTimeoutRef = useRef(null)
  const closeTimeoutRef = useRef(null)

  const handleTriggerEnter = useCallback(() => {
    if (!collapsed || isTouchDevice) return
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    hoverTimeoutRef.current = setTimeout(() => {
      setOpenFlyout(group.label)
    }, 100)
  }, [collapsed, isTouchDevice, group.label, setOpenFlyout])

  const handleTriggerLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    closeTimeoutRef.current = setTimeout(() => {
      setOpenFlyout(null)
    }, 150)
  }, [setOpenFlyout])

  const handleFlyoutEnter = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }, [])

  const handleFlyoutLeave = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => {
      setOpenFlyout(null)
    }, 150)
  }, [setOpenFlyout])

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    }
  }, [])

  const button = (
    <button
      ref={anchorRef}
      type="button"
      onClick={collapsed ? () => setOpenFlyout((cur) => (cur === group.label ? null : group.label)) : onToggle}
      onMouseEnter={handleTriggerEnter}
      onMouseLeave={handleTriggerLeave}
      aria-expanded={collapsed ? flyoutOpen : open}
      aria-haspopup={collapsed ? 'true' : undefined}
      aria-controls={collapsed ? undefined : `sidebar-group-${group.label}`}
      aria-label={collapsed ? group.label : undefined}
      className={itemClass({ collapsed, isActive: active })}
    >
      <span className={iconWrapClass}>
        <Icon size={20} strokeWidth={1.75} className={iconClass(active)} />
      </span>
      <span className={cn('font-sans text-[14px]', labelClass(collapsed))}>
        {group.label}
      </span>
      {!collapsed && (
        <ChevronRight
          size={16}
          strokeWidth={1.75}
          className={cn('ml-auto flex-shrink-0 text-muted transition-transform duration-200', open && 'rotate-90')}
        />
      )}
    </button>
  )

  if (collapsed) {
    return (
      <li>
        <RailTooltip label={group.label}>{button}</RailTooltip>
        {flyoutOpen && rect && (
          <SidebarFlyout
            anchorRect={rect}
            flyoutWidth={240}
            onMouseEnter={handleFlyoutEnter}
            onMouseLeave={handleFlyoutLeave}
          >
            <p className="px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-muted">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.children.map((child) => (
                <ChildLink
                  key={child.to}
                  child={child}
                  activeTo={activeTo}
                  onNavigate={() => setOpenFlyout(null)}
                />
              ))}
            </div>
          </SidebarFlyout>
        )}
      </li>
    )
  }

  return (
    <li>
      {button}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            id={`sidebar-group-${group.label}`}
            initial={{ gridTemplateRows: '0fr' }}
            animate={{ gridTemplateRows: '1fr' }}
            exit={{ gridTemplateRows: '0fr' }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="overflow-hidden">
              <div className="ml-[27px] mt-1 space-y-0.5 border-l border-hairline pl-2">
                {group.children.map((child) => (
                  <ChildLink key={child.to} child={child} activeTo={activeTo} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}
