import { NavLink } from 'react-router-dom'
import { cn } from '../../utils/cn'

/*
 * Width lives on the item as `w-full`. The rail pads itself with px-3, so a
 * collapsed item is exactly 48px wide and its icon cell centres on the rail's
 * mid-line. `overflow-hidden` keeps the sliding label inside the rounded
 * highlight box.
 */
export const ITEM_BASE =
  'group relative flex h-11 w-full items-center rounded-xl overflow-hidden transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-white'

export const ITEM_EXPANDED = 'justify-start gap-3 px-3'
export const ITEM_COLLAPSED = 'justify-center gap-0 px-0'

export const itemClass = ({ collapsed, isActive }) =>
  cn(
    ITEM_BASE,
    collapsed ? ITEM_COLLAPSED : ITEM_EXPANDED,
    isActive ? 'bg-surface-strong text-ink font-medium' : 'text-muted hover:bg-surface-soft hover:text-ink'
  )

export const iconClass = (isActive) =>
  cn(
    'flex flex-shrink-0 items-center justify-center transition-colors duration-200',
    isActive ? 'text-ink' : 'text-muted group-hover:text-ink'
  )

/* 24×24 icon cell — every rail icon is the same size and sits on one vertical
   line, centred inside the item. */
export const iconWrapClass = 'flex h-6 w-6 shrink-0 items-center justify-center'

/*
 * Label: collapsed removes it from layout (max-w-0), not just fades it, so it
 * no longer pushes the icon off-centre. No flex-1, so max-w-0 actually
 * collapses the box (overflow-hidden zeroes the automatic minimum size).
 * Expanded slides open to 200px.
 */
export const labelClass = (collapsed) =>
  cn(
    'whitespace-nowrap overflow-hidden transition-[opacity,max-width] duration-200',
    collapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'
  )

export const CHILD_LINK_CLASS =
  'flex items-center gap-2.5 rounded-lg py-2 pl-3 pr-2 font-sans text-[13px] transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/40'

export function ChildLink({ child, activeTo, onNavigate }) {
  const active = activeTo === child.to
  return (
    <NavLink
      to={child.to}
      end
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        CHILD_LINK_CLASS,
        active ? 'bg-surface-strong font-medium text-ink' : 'text-muted hover:bg-surface-soft hover:text-ink'
      )}
    >
      <child.icon size={16} strokeWidth={1.75} className={iconClass(active)} />
      <span className="truncate">{child.label}</span>
    </NavLink>
  )
}
