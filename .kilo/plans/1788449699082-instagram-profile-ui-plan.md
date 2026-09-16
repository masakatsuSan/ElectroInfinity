# Instagram-like Profile UI Redesign Plan

## Goal
Redesign the public profile page (`/profile/:id`) to feel like Instagram's profile UI while keeping all existing Electro Infinity functionality (upload photos, files, achievements; search users; follow system).

## Decisions Made
- **Grid layout**: Single combined "Posts" tab showing gallery photos + achievements + projects in a unified square grid, keeping existing detail tabs.

## Files to Modify

### 1. `frontend/src/components/ProfileHeader.jsx` — Redesign header
- Make layout compact: avatar left (80-96px), name+stats+buttons right
- Add stats row: **Posts** (total uploads count) | **Followers** | **Following** (clickable, navigate to followers/following lists)
- Replace large cover area with a smaller cover banner (Instagram-style: full-width but shorter, ~180px)
- Add action buttons row: Follow/Following/Edit Profile/Message/Share
- Keep existing cover photo and profile photo upload functionality
- Keep status display and activity indicator

### 2. `frontend/src/components/ProfileGrid.jsx` — New component
- Square grid layout: `aspect-square` items in a responsive grid (2 cols mobile → 3 cols tablet → 4 cols desktop)
- Each item shows a thumbnail (image) with a hover overlay:
  - Top-right corner: type badge (📷 Photo / 🏆 Achievement / 💻 Project) using Lucide icons
  - Bottom: title + date
  - For non-image items (achievements/projects without images): show a colored placeholder with the type icon
- Clicking opens a lightbox/modal showing full details

### 3. `frontend/src/components/ProfileGridLightbox.jsx` — New component
- Replaces/extends `GalleryLightbox` to handle mixed content types
- Shows: image (if available), title, description, date, type badge, links (GitHub/demo/certificate)
- Keyboard navigation (Escape to close, arrows if multiple images)
- Framer Motion enter/exit animations

### 4. `frontend/src/pages/Profile.jsx` — Update tabs and add Posts grid
- Change `TABS` array: `['posts', 'about', 'directory', 'projects', 'achievements', 'gallery', 'uploads']` (add `posts` as first tab)
- Add new `activeTab === 'posts'` section:
  - Fetches gallery + achievements + projects in parallel
  - Combines into a single sorted array (by date, newest first)
  - Renders using new `ProfileGrid` component
  - For own profile: show upload button (floating or in header)
- Update existing `gallery` tab to also use `ProfileGrid` component (filtered to gallery only)
- Keep all other tabs unchanged
- Update stats to include `posts` count (total of gallery + achievements + projects)

### 5. `frontend/src/api/profile.js` — Add helper (optional)
- Optionally add a `getProfilePosts(userId)` helper that fetches gallery + achievements + projects combined
- Or handle the combination in the component using existing API calls

## Backend Changes
- **None required** — all data already exists via existing endpoints:
  - `GET /api/gallery?author=:id`
  - `GET /api/achievements?author=:id`
  - `GET /api/projects?author=:id`
  - The public profile endpoint already returns counts for projects/forumPosts/resources

## Styling Details
- Grid gap: `gap-1` or `gap-2` (tight like Instagram)
- Grid item: `aspect-square overflow-hidden relative`
- Hover overlay: `absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity`
- Font: keep existing Space Grotesk for headings, Inter for body
- Colors: keep existing `ink`, `canvas`, `soft-stone` palette
- Stats: use the existing pill-style buttons or simple text links

## Upload Flow Enhancement
- In the new "Posts" tab, add a visible upload area when `isOwn`:
  - For photos: show a "+" tile that opens the existing `GallerySubmitModal`
  - For achievements: show achievement upload button (existing)
  - For projects: show project upload button (existing)
- Or add a floating action button (FAB) in bottom-right corner for own profile

## Search Feature
- The existing `/search` page already has user search with trending/suggested sections
- Optionally add a search icon in the profile header that navigates to `/search`
- No changes needed to search functionality itself

## Rollout Plan
1. Create `ProfileGrid.jsx` and `ProfileGridLightbox.jsx` (new components)
2. Update `ProfileHeader.jsx` with Instagram-style compact layout
3. Update `Profile.jsx` tabs and add `posts` tab with `ProfileGrid`
4. Update existing `gallery` tab to use `ProfileGrid`
5. Test: view own profile, view other's profile, upload photos/achievements/projects, verify grid renders correctly
6. Verify responsive behavior on mobile/tablet/desktop

## Open Questions / Out of Scope
- Story highlights: User model has `highlights` field but no backend routes. Deferring to future work.
- Like/comment system: Not requested, not in scope.
- Followers/following list pages: Clicking stats navigates to potential future pages, currently could show a modal or alert.
