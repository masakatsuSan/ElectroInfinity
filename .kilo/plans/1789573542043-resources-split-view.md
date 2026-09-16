# Resources Split-View Layout (Desktop)

## Context
When a user clicks "View" on a PDF resource in the Resources page, the current behavior opens a full-screen modal drawer (`ResourcePreviewDrawer`) that covers the entire screen. The user wants a desktop split-view layout where the PDF viewer occupies the left side and a sidebar of other resources is visible on the right.

## Requirements
- **Desktop**: When user clicks "View" on a resource, the page splits into two panels:
  - **Left (majority, ~70%)**: PDF/image viewer (iframe or img) — shows ONLY the selected file, nothing else inside this area
  - **Right (~30%)**: Sidebar list of other resources (same tab type) — clickable to swap the left viewer
- **Mobile**: Keep existing full-screen drawer modal behavior (no split view)
- The "View" button on the selected resource in the sidebar should be visually distinguished (highlighted)
- Closing the split view returns to the normal grid layout

## Files to Modify

### 1. `frontend/src/pages/Resources.jsx`
- Add `selectedResource` state (separate from `previewResource`)
- Detect viewport width to decide split-view vs drawer (use `window.innerWidth >= 1024` or CSS media query via a custom hook)
- When `selectedResource` is set on desktop: render split-view layout instead of grid + drawer
  - Left panel: inline PDF/image viewer (extracted from `ResourcePreviewDrawer`)
  - Right panel: scrollable list of other resources (filtered out the selected one), using `ResourceCard`-style items
- When `selectedResource` is set on mobile: fall back to existing `ResourcePreviewDrawer`
- Add a "Back to grid" / close button for the split view

### 2. `frontend/src/components/ResourcePreviewDrawer.jsx`
- No changes needed — keep as-is for mobile drawer behavior

### 3. New: `frontend/src/components/ResourceSplitView.jsx` (new file)
- Props: `selectedResource`, `resources` (full list), `onSelectResource`, `onClose`
- Left panel (`flex-1` or `flex-[3]`):
  - Header bar: resource title, filename, close button (X)
  - Viewer area: iframe for PDF, img for images, placeholder for other types (same logic as `ResourcePreviewDrawer`)
  - Loading spinner while iframe loads
- Right panel (`w-72` or `w-80`, fixed width, scrollable):
  - Header: "Other Resources"
  - List of resource cards (excluding selected one)
  - Each card: title, type badge, semester badge, subject
  - Clicking a card calls `onSelectResource(item)` to swap the left viewer
  - Selected card has highlighted border/background

## Key Implementation Details

### Viewport Detection
Use a simple `useState` + `useEffect` with `window.matchMedia('(min-width: 1024px)')` listener in `Resources.jsx` to track desktop vs mobile. Add/remove resize listener.

### Layout Structure in Resources.jsx (desktop + selectedResource)
```jsx
<div className="flex gap-0 h-[calc(100vh-12rem)]">
  <ResourceSplitView
    selectedResource={selectedResource}
    resources={data}
    onSelectResource={setSelectedResource}
    onClose={() => setSelectedResource(null)}
  />
</div>
```

### Right Panel Resource List
Filter: `resources.filter(r => r._id !== selectedResource._id)`
Use same card styling as the grid (`ResourceCard` component) but in a vertical list with smaller padding.

### State Management
- `selectedResource`: the currently viewed resource (drives split view)
- `previewResource`: kept for mobile drawer fallback
- When user clicks "View" on a card: set both `selectedResource` and `previewResource`
- When closing: clear both

## Mobile Fallback
On mobile (`window.innerWidth < 1024`), clicking "View" opens the existing `ResourcePreviewDrawer` modal as before. No split view on mobile.

## Verification
1. Start both backend (`cd backend && npm run dev`) and frontend (`cd frontend && npm run dev`) servers
2. Navigate to `/resources` on desktop (≥1024px)
3. Click "View" on any PDF resource → left panel shows PDF iframe, right panel shows other resources
4. Click a different resource in the right sidebar → left panel swaps to that PDF
5. Click close (X) → returns to grid view
6. Resize browser below 1024px → clicking "View" opens the full-screen drawer modal (existing behavior)
7. Verify non-PDF resources (images) also work in split view
8. Verify "other types" (non-PDF, non-image) show the "Preview not available" placeholder in left panel
