# Plan: Fix multi-scroll / scroll chaining on mobile overlays

## Objective
Prevent background page scroll when the mobile menu or notification dropdown is open, while keeping the overlay panels themselves scrollable and scrollbar-free.

## Root Cause
Hiding scrollbars does not stop scroll chaining. On mobile, swiping inside `overflow-y-auto` panels can bubble up and scroll the `<body>` behind them. The notification dropdown also has this issue because it is not a full-screen overlay.

## Current State
- `Navbar.jsx` already toggles `document.body.style.overflow` for the mobile menu
- `index.css` hides scrollbars globally and via a mobile media query
- Neither fix stops scroll chaining on touch devices

## Required Fixes

### 1. Add `overscroll-behavior: contain` to scrollable mobile panels
Update the `.no-scrollbar` utility in `frontend/src/index.css` to also include:
```css
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
  overscroll-behavior: contain;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
```
This stops scroll chaining at the panel boundary without affecting normal touch scroll inside the panel.

### 2. Ensure body scroll lock is complete for the mobile menu
In `Navbar.jsx`, the existing `document.body.style.overflow = menuOpen ? 'hidden' : ''` is good, but add `position: fixed` lock as a fallback for iOS Safari:
- When `menuOpen` becomes true, also set `document.body.style.position = 'fixed'` and store the current scroll Y
- When `menuOpen` becomes false, restore `position` and `overflow`, then `window.scrollTo(0, savedY)`

### 3. Lock body scroll when notification dropdown is open
`NotificationBell.jsx` / `NotificationDropdown.jsx` currently do not lock body scroll.
- Add `isOpen` state awareness to the dropdown
- When open, apply the same body scroll lock pattern
- When closed, restore it

### 4. Keep `.no-scrollbar` on the two known overflow containers
- `Navbar.jsx` mobile menu overlay
- `NotificationDropdown.jsx` scrollable list

## Files to Modify
1. `frontend/src/index.css` — update `.no-scrollbar` with `overscroll-behavior: contain`
2. `frontend/src/components/Navbar.jsx` — strengthen body scroll lock for mobile menu
3. `frontend/src/components/NotificationBell.jsx` — add body scroll lock when dropdown opens
4. `frontend/src/components/NotificationDropdown.jsx` — ensure `no-scrollbar` stays applied

## Validation
- Open mobile menu, swipe inside it → only menu scrolls, background stays fixed
- Close mobile menu, swipe page → page scrolls normally
- Open notification dropdown on mobile, swipe inside it → only dropdown scrolls, background stays fixed
- Close notification dropdown, swipe page → page scrolls normally
- No visible scrollbars on any mobile overflow container

## Out of Scope
- Global scroll chaining fixes for desktop
- Changing notification dropdown from absolute to full-screen on mobile
