import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'ei_sidebar_collapsed'

const SIDEBAR_WIDTH = 272
const SIDEBAR_WIDTH_COLLAPSED = 72
const SIDEBAR_GUTTER = 12
const TOPBAR_HEIGHT = 56

const SidebarStateContext = createContext(null)

function useSidebarState() {
  const [collapsed, setCollapsed] = useState(true)

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === '0') setCollapsed(false)
    } catch (_) {}
  }, [])

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch (_) {}
      return next
    })
  }, [])

  return { collapsed, setCollapsed, toggle }
}

export function SidebarStateProvider({ children }) {
  const { collapsed, setCollapsed, toggle } = useSidebarState()
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

  const value = useMemo(() => {
    return {
      collapsed,
      setCollapsed,
      toggle,
      profileDropdownOpen,
      setProfileDropdownOpen,
      collapsedWidth: SIDEBAR_WIDTH_COLLAPSED,
      expandedWidth: SIDEBAR_WIDTH,
      topBarHeight: TOPBAR_HEIGHT,
    }
  }, [collapsed, toggle, profileDropdownOpen])

  return <SidebarStateContext.Provider value={value}>{children}</SidebarStateContext.Provider>
}

export function useSidebarStateContext() {
  const ctx = useContext(SidebarStateContext)
  if (!ctx) throw new Error('useSidebarStateContext must be used inside SidebarStateProvider')
  return ctx
}

export const SIDEBAR_DIMENSIONS = {
  width: SIDEBAR_WIDTH,
  widthCollapsed: SIDEBAR_WIDTH_COLLAPSED,
  gutter: SIDEBAR_GUTTER,
  topBarHeight: TOPBAR_HEIGHT,
}
