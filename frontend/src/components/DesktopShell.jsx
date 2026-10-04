import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { SidebarStateProvider, SIDEBAR_DIMENSIONS } from './nav/SidebarStateContext'
import { isHiddenRoute } from './nav/navConfig'
import { useLayout } from '../context/LayoutContext'

/**
 * Desktop (lg+) chrome: two independent panels inside a framed viewport.
 *
 * `children` is rendered into exactly one of two wrappers, picked from
 * `isDesktop`: a plain in-flow column below 1024px, or the framed panel above
 * it. Only one copy is ever mounted — rendering both and hiding one with CSS
 * would mount every page twice (double queries, observers, socket listeners)
 * and would put two elements with the same view-transition-name in the DOM,
 * which breaks the page transition outright. The panel ref lives on the desktop
 * copy only, so useLayout() reports `mainPanel === null` (window scroll) on
 * mobile.
 *
 * CSS variables:
 *   --shell-gap         8px    grey frame gutter (defined once in index.css)
 *   --shell-frame              colour of that gutter
 *   --topbar-h          56px   sticky top bar height inside the Main panel
 *   --sidebar-collapsed 72px   rail width, also the Main panel's left offset
 *   --sidebar-expanded  272px  overlay width (does NOT move the Main panel)
 *
 * Sidebar width values come from SIDEBAR_DIMENSIONS so the rail, the Main
 * panel offset and TopBar can never drift apart.
 *
 * The Main panel is the scroll container above 1024px: it has a definite
 * height, scrolls vertically on its own and clips horizontally. The page
 * wrapper no longer pads for the top bar on desktop — the top bar is
 * sticky inside the panel with a cancelling negative margin, so it still
 * overlays content exactly as the old `fixed` bar did and every page's
 * existing pt-* compensation lands in the same place.
 *
 * Chrome-free routes (login, admin, activate …) keep their bare layout but
 * still scroll inside the Main panel, so admin pages share one scroll
 * region with everything else instead of falling back to the window.
 */
function ShellLayout({ children }) {
  const location = useLocation()
  const { isDesktop, setMainPanelRef, setMainContentRef } = useLayout()
  const chrome = !isHiddenRoute(location.pathname)

  // Below 1024px there is no shell at all: no sidebar, no top bar, no framed
  // panel — the window scrolls and the page content is a plain column in the
  // document flow. The framed div is `hidden lg:block`, so it must not be the
  // only place `children` is rendered or mobile gets an empty body. The
  // `lg:hidden` / `hidden lg:block` pairs also cover the one frame where
  // isDesktop has not caught up with a resize.
  if (!isDesktop) {
    return (
      <div data-ei-mobile-shell="" className="flex min-h-0 flex-1 flex-col lg:hidden">
        {children}
      </div>
    )
  }

  return (
    <div
      data-ei-desktop-shell=""
      className="relative hidden h-dvh lg:block"
      style={{
        '--sidebar-collapsed': `${SIDEBAR_DIMENSIONS.widthCollapsed}px`,
        '--sidebar-expanded': `${SIDEBAR_DIMENSIONS.width}px`,
        padding: 'var(--shell-gap)',
        backgroundColor: 'var(--shell-frame)',
      }}
    >
      {chrome && <Sidebar />}

      <div
        ref={setMainPanelRef}
        data-ei-main-panel=""
        className="h-full overflow-y-auto overflow-x-hidden rounded-2xl border border-hairline bg-white shadow-modal"
        /* Static offset from the *collapsed* width: the Main panel must
           never move when the sidebar expands over it. */
        style={{ marginLeft: chrome ? 'var(--sidebar-collapsed)' : 0 }}
      >
        {chrome && <TopBar />}
        <div ref={setMainContentRef} data-ei-main-content="" className="flex min-h-full flex-col">
          {children}
        </div>
      </div>
    </div>
  )
}

export default function DesktopShell({ children }) {
  return (
    <SidebarStateProvider>
      <ShellLayout>{children}</ShellLayout>
    </SidebarStateProvider>
  )
}
