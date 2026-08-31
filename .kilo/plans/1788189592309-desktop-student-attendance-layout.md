# Desktop Layout Plan: Student Attendance Page

## Problem
`StudentAttendance.jsx` uses `max-w-lg` (512px) container, making the page look narrow and mobile-like on desktop screens. The faculty attendance page already uses a proper desktop layout with `max-w-6xl` and multi-column grids.

## Goal
Transform the student attendance page into a responsive desktop layout while preserving the existing mobile experience.

## Tech Stack
- React + Tailwind CSS (utility-first)
- No new dependencies required
- Follow existing conventions from `FacultyAttendance.jsx`

## Layout Strategy

### Mobile (unchanged)
- Single column stack
- `max-w-lg mx-auto` container
- All sections stacked vertically with `space-y-6`

### Desktop (`lg:` breakpoint, ≥1024px)
- Main container: `max-w-6xl mx-auto`
- Two-column grid: `grid grid-cols-1 lg:grid-cols-12 gap-6`
  - **Left sidebar (`lg:col-span-4`):** Stats card, active session card, GPS debug card, info card
  - **Right main (`lg:col-span-8`):** Scanner controller, notifications, camera viewport
- Header spans full width inside the container

## Implementation Steps

### 1. Update main container in `StudentAttendance.jsx`

**Before:**
```jsx
<div className="min-h-screen bg-canvas text-ink pt-[48px] pb-16">
  {/* Success Overlay... */}
  <div className="max-w-lg px-6 py-8 mx-auto space-y-6">
```

**After:**
```jsx
<div className="min-h-screen bg-canvas text-ink pt-[48px] pb-16">
  {/* Success Overlay... */}
  <div className="max-w-6xl px-6 py-8 mx-auto">
    {/* Header */}
    <div className="flex items-center justify-between mb-6 lg:mb-8">
      {/* ... existing header content unchanged ... */}
    </div>

    {/* Permission banner */}
    <PermissionBanner permissions={['camera', 'location']} />

    {/* Desktop grid layout */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT SIDEBAR: Stats, Session, GPS, Info */}
      <div className="lg:col-span-4 space-y-6">
        {/* Stats card */}
        {stats && ( ... )}
        
        {/* Active session / No active lecture card */}
        {activeSession ? ( ... ) : ( ... )}
        
        {/* GPS debug card (when activeSession exists) */}
        {activeSession && (
          <div className="p-4 space-y-3 border border-divider-soft bg-surface-pearl rounded-2xl">
            {/* ... existing GPS debug content ... */}
          </div>
        )}
        
        {/* How Smart Attendance Works info card */}
        <div className="p-5 space-y-3 border shadow-sm border-divider-soft bg-surface-pearl rounded-2xl">
          {/* ... existing info content ... */}
        </div>
      </div>

      {/* RIGHT MAIN: Scanner, Notifications, Camera */}
      <div className="lg:col-span-8 space-y-6">
        {/* Notifications (verifying, success, error) */}
        {verifying && ( ... )}
        {msg && !verifying && ( ... )}
        {error && ( ... )}

        {/* Scanner Controller */}
        {!scanning ? ( ... ) : ( ... )}
      </div>
    </div>
  </div>
</div>
```

### 2. Specific component adjustments

**Stats card:** No structural changes, just move into sidebar column.

**Active Session card:** No structural changes, just move into sidebar column.

**No Active Lecture card:** No structural changes, just move into sidebar column.

**GPS Debug card:** Wrap existing content in a card container with `border border-divider-soft bg-surface-pearl rounded-2xl` if not already (check current code at line 773-816).

**Notifications (verifying, success, error):** Move into right main column. Keep full width within that column.

**Scanner Controller / Camera Viewport:** Move into right main column. The camera viewport gets more space on desktop. Keep `aspect-square` for the QR reader.

**How Smart Attendance Works:** Move into left sidebar, below GPS debug.

### 3. Header handling

The existing header structure at lines 487-508 stays intact but is moved outside the grid. On desktop, it should be left-aligned with the grid below it (within the same `max-w-6xl` container).

## Files to Edit
- `C:\Users\sumit\OneDrive\Desktop\electro-infinity\frontend\src\pages\attendance\StudentAttendance.jsx`

## Validation
- Verify `npm run lint` passes (if available)
- Manually test responsive behavior:
  - Mobile (<1024px): single column, unchanged appearance
  - Desktop (≥1024px): two-column layout with sidebar and main area
- Ensure scanner camera viewport still works correctly in both layouts
- Verify no z-index or overflow issues with the success overlay

## Risks
- Moving GPS debug card into sidebar may reduce its visibility; acceptable trade-off for cleaner desktop layout
- The `aspect-square` camera viewport may become very large on wide screens; consider `max-w-lg` on the viewport itself if needed
