# Plan: Detail Pages for Projects & Achievements

## Problem
Project cards and achievement cards truncate content (140 chars for projects, `line-clamp-3` for achievements). Images in achievements are constrained to a fixed `h-48` card header. There's no way to view full content.

## Solution
Add dedicated detail pages at `/projects/:id` and `/achievements/:id`, and make cards navigable.

---

## Files to Create

### 1. `frontend/src/pages/ProjectDetails.jsx`
- New page following the `SubjectDetails` pattern.
- Reads `id` from `useParams`, fetches via `getProject(id)`.
- Shows full title, full description, all tech stack tags, author name, images (if any), GitHub/demo links, like count, like/unlike button.
- Includes a "Back to Projects" button using `useNavigate()`.
- Wrapped in `<AnimatedRoute>` via route definition.

### 2. `frontend/src/pages/AchievementDetails.jsx`
- New page following the `SubjectDetails` pattern.
- Reads `id` from `useParams`, fetches via `getAchievement(id)`.
- Shows full title, full description, date, full-size image, category badge.
- Includes a "Back to Achievements" button.
- Wrapped in `<AnimatedRoute>` via route definition.

---

## Files to Modify

### 3. `frontend/src/api/achievements.js`
- Add `getAchievement(id)` function: `api.get('/achievements/${id}')`

### 4. `backend/src/routes/achievements.js`
- Add `router.get('/:id', ...)` endpoint (public, no auth required):
  - Find achievement by `_id`
  - Return `{ success: true, data: achievement }` or 404

### 5. `frontend/src/pages/Projects.jsx`
- Import `Link` from `react-router-dom`
- Wrap the `ProjectCard` outer `<div>` in a `<Link to={`/projects/${project._id}`}>` so the entire card is clickable.
- Keep existing buttons (Like, GitBranch, ExternalLink) working by stopping event propagation on those links/buttons, OR make only the card body clickable and keep action buttons as-is (they are already inside the card - need to ensure clicking Like/GitHub doesn't navigate). Best approach: wrap the card `<div>` with `<Link>`, and add `e.stopPropagation()` / `e.preventDefault()` on the Like button and external links so they don't trigger navigation.

### 6. `frontend/src/pages/Achievements.jsx`
- Import `Link` from `react-router-dom`
- In `formatAch`, preserve `_id`: add `id: a._id` to the returned object.
- Wrap `AchCard` in a `<Link to={`/achievements/${item.id}`}>`
- Ensure external/interactive elements inside the card don't trigger navigation (there are none currently, so this is straightforward).

### 7. `frontend/src/App.jsx`
- Add imports for `ProjectDetails` and `AchievementDetails`
- Add routes:
  - `<Route path="/projects/:id" element={<AnimatedRoute><ProjectDetails /></AnimatedRoute>} />`
  - `<Route path="/achievements/:id" element={<AnimatedRoute><AchievementDetails /></AnimatedRoute>} />`
- Place them near their list routes (`/projects` and `/achievements`)

---

## Order of Implementation

1. Backend: Add `GET /api/achievements/:id` endpoint
2. Frontend API: Add `getAchievement(id)`
3. Frontend: Create `ProjectDetails.jsx`
4. Frontend: Create `AchievementDetails.jsx`
5. Frontend: Update `App.jsx` with new routes
6. Frontend: Make `ProjectCard` clickable in `Projects.jsx`
7. Frontend: Make `AchCard` clickable in `Achievements.jsx`
