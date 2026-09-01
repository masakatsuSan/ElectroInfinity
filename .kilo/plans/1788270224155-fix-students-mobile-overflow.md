# Fix Mobile Overflow in Students Page Batch Mates Section

## Problem

On the `/students` page, the "Your batch" / "Batch Mates" cards overflow on mobile screens. Names and Follow buttons overflow their container, and the footer area is also affected.

## Root Cause

1. **Invalid HTML nesting**: Each batch mate card uses `<Link>` (renders as `<a>`) wrapping the entire card, including `<FollowButton>` (renders as `<button>`). Nesting interactive elements (`<a>` → `<button>`) is invalid HTML. Browsers auto-close the `<a>` before the `<button>`, breaking the flex row layout. On mobile this causes the button and text to escape their container.

2. **Tight mobile spacing**: Card uses `p-3` (12px) padding and `gap-3` (12px) gap with no mobile reduction. On 320px viewports, the fixed-width avatar + follow button + gaps exceed the available space.

## Fix

### File: `frontend/src/pages/Students.jsx`

1. Add `useNavigate` to the `react-router-dom` import (line 3)
2. Inside `Students()` component, add: `const navigate = useNavigate()`
3. Replace the `<Link>` card wrapper with a `<div>` that has `onClick` navigation and `cursor-pointer`
4. Reduce padding on mobile: `p-2 sm:p-3`
5. Reduce gap on mobile: `gap-2 sm:gap-3`
6. Reduce avatar size on mobile: `w-10 h-10 sm:w-12 sm:h-12`

This eliminates invalid HTML nesting and gives more breathing room on small screens while preserving the clickable-card behavior.

### Before (lines 177-201):
```jsx
{batchMates.map((mate) => (
  <Link key={mate._id} to={`/profile/${mate._id}`} className="flex items-center gap-3 p-3 border rounded-2xl border-divider-soft bg-canvas hover:bg-soft-stone/50 transition-colors">
    <div className="flex items-center justify-center w-12 h-12 overflow-hidden rounded-full bg-ink/5 text-ink-muted-80">
      ...
    </div>
    <div className="min-w-0 flex-1">
      ...
    </div>
    <FollowButton ... size="sm" showIcon={false} />
  </Link>
))}
```

### After:
```jsx
{batchMates.map((mate) => (
  <div key={mate._id} onClick={() => navigate(`/profile/${mate._id}`)} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border rounded-2xl border-divider-soft bg-canvas hover:bg-soft-stone/50 transition-colors cursor-pointer">
    <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 overflow-hidden rounded-full bg-ink/5 text-ink-muted-80">
      ...
    </div>
    <div className="min-w-0 flex-1">
      ...
    </div>
    <FollowButton userId={mate._id} isFollowing={mate.isFollowing} followsMe={mate.followsMe} size="sm" showIcon={false} />
  </div>
))}
```

## Validation

1. Run `npm run dev`
2. Open Chrome DevTools device emulation at 320px (iPhone SE)
3. Navigate to `/students`
4. Verify "Batch Mates" cards fit within viewport without horizontal scroll
5. Verify names truncate properly and Follow buttons are fully visible
6. Verify clicking anywhere on a card navigates to the profile
7. Verify clicking Follow button only toggles follow, doesn't navigate
