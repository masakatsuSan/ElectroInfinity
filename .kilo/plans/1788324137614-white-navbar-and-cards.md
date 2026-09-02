# Plan: White Navbar, White Cards, Move Campus Directory

## Goal
1. Navbar background becomes pure white (currently `bg-canvas/95` cream `#F9F6F0`) so it pops against the cream body.
2. All page cards become pure white (`bg-white`) for a cleaner, more "game-like" feel against the cream canvas.
3. Move the "Campus Directory" (Students & CRs) panel from `Students.jsx` to `Profile.jsx`.

## Scope & Key Decisions

- **Navbar white**: Change `frontend/src/components/Navbar.jsx:191` from `bg-canvas/95` to `bg-white/95`. Keep the `border-hairline` and `shadow-card`. This alone gives the navbar clear visual separation from the cream body without changing the rest of the design.
- **Cards to white**: Project uses two near-identical white tokens: `bg-surface-pearl` (alias for `#ffffff`) and `bg-white`. The user wants the cards to read as "just white" with maximum contrast against the cream canvas. Standardize on `bg-white` everywhere the intent is "card surface":
  - `frontend/src/components/Students.jsx` is the main offender (line 176, 224, 668 area, etc.) — change `bg-surface-pearl` to `bg-white` on the directory panel, the tab pill row, and any other card containers.
  - `frontend/src/pages/Profile.jsx` — change `bg-surface-pearl` to `bg-white` on card containers (lines ~326, 355, 547, 597, 611, 640, 668, 768, 858). Keep `bg-soft-stone` for nested pills/tags (skills, interests chips) so they retain warmth.
  - `frontend/src/pages/Directory.jsx` — currently uses undefined dark classes (`bg-bg`, `text-vs`, `bg-violet`, `text-dim`) and looks broken on the cream theme. Convert it to the same white-card style so the moved directory is visually consistent.
  - Sweep any remaining `bg-surface-pearl` in other pages (Resources, Courses, Projects, Achievements, Forum, Faculty, Labs, etc.) — replace with `bg-white` on card containers only. Do NOT touch navbars, sidebars, footer, or pill-style buttons (those are intentionally non-card).
- **Do NOT change**: cream body background (`bg-canvas`), the `soft-stone` chips/tags, button colors, text colors. Cards become the only "pure white" surface.
- **Campus Directory move**:
  - From: `frontend/src/pages/Students.jsx` (the panel at lines 175–221, which lives on the `/students` route labeled "My Attendance & Dashboard" in the navbar dropdown).
  - To: `frontend/src/pages/Profile.jsx` — as a new section on the **own profile's About tab** (i.e. only visible when `isOwn === true` and `activeTab === 'about'`), placed after the existing About card or as a new fifth tab.
  - Recommended: add as a new tab `"directory"` in the `TABS` array (line 17) between `'gallery'` and end, so it doesn't crowd the About tab. Title it `"Campus Directory"` in the tab pill. Renders the same `BatchMateCard` grid (already imported in Students.jsx — extract or duplicate the small `BatchMateCard` component into `Profile.jsx`, or better, move it to `frontend/src/components/BatchMateCard.jsx` and import in both — but since Students.jsx is losing the section, only Profile.jsx needs the import).
  - Remove the directory panel from `Students.jsx` (lines 175–221), and remove now-unused state (`batchFilter`, `searchQuery`, `uniqueBatches`, `filteredBatchMates`, `batchMatesLoading`, and the `BatchMateCard` subcomponent if no longer used).
  - Add `/students` route label update in Navbar.jsx dropdown if desired — keep it as "My Attendance & Dashboard" since that's what the rest of the page is. (No label change required.)
- **Directory.jsx page**: leave as-is. It's a separate admin/faculty page and is not the same component as the "Campus Directory" panel being moved.

## Affected Files

- `frontend/src/components/Navbar.jsx` (1 line: bg color)
- `frontend/src/components/Students.jsx` (remove directory panel + state; change remaining `bg-surface-pearl` → `bg-white`)
- `frontend/src/pages/Profile.jsx` (add directory tab + panel; `bg-surface-pearl` → `bg-white` on cards)
- `frontend/src/pages/Directory.jsx` (rewrite broken dark classes to match the new white-card style)
- Sweep other pages for `bg-surface-pearl` on card containers → `bg-white`:
  - `frontend/src/pages/Resources.jsx`
  - `frontend/src/pages/Courses.jsx`
  - `frontend/src/pages/Projects.jsx`, `ProjectDetails.jsx`
  - `frontend/src/pages/Achievements.jsx`, `AchievementDetails.jsx`
  - `frontend/src/pages/Forum.jsx`
  - `frontend/src/pages/Faculty.jsx`
  - `frontend/src/pages/Labs.jsx`
  - `frontend/src/pages/Gallery.jsx`
  - `frontend/src/pages/Announcements.jsx`, `Calendar.jsx`, `Contact.jsx`, `Placements.jsx`, `About.jsx`
  - `frontend/src/pages/attendance/StudentAttendance.jsx`, `FacultyAttendance.jsx`
  - `frontend/src/pages/Search.jsx`, `Network.jsx`
  - `frontend/src/components/ProfileHeader.jsx`, `ProfileCompleteness.jsx`, `SocialLinkCard.jsx`, `ContributionGraph.jsx`, `ActivityTimeline.jsx`, `UserPopover.jsx`, `GalleryLightbox.jsx`, `NotificationDropdown.jsx`
  - Admin pages under `frontend/src/pages/admin/`

  Approach: do a project-wide grep for `bg-surface-pearl` and replace with `bg-white` only where it sits on a `rounded-*` card-like container. Do not touch navbar, footer, modals, or chips.

## Risks & Edge Cases

- **BatchMateCard component** lives inside `Students.jsx`. Moving it cleanly: copy its JSX into `Profile.jsx` (or extract to a new `components/BatchMateCard.jsx`). Easiest path: copy the component definition into `Profile.jsx` to keep this change minimal.
- **isOwn guard**: the Campus Directory in Students.jsx is shown to all logged-in students. On Profile, it should only appear on the own profile (`isOwn === true`) and on the new directory tab. Public profiles should not show a directory.
- **Search/filter state**: the Students.jsx panel has `searchQuery` and `batchFilter` that are not used elsewhere. They go away with the panel.
- **Directory.jsx rewrite**: be careful not to introduce new dependencies; keep it consistent with the rest of the cream-theme pages.
- **Visual side-effect**: changing `bg-surface-pearl` to `bg-white` is functionally identical today (both resolve to `#ffffff` per tailwind.config.js:41), but the rename makes the intent explicit and prevents future drift if `surface-pearl` is ever re-themed.

## Out of Scope

- Changing the cream `bg-canvas` body color.
- Changing the navbar shape, position, or shadow.
- Restructuring the Students page beyond removing the directory section.
- Mobile-specific redesign of the navbar.
- Adding a "game" animation system, XP, badges, or any gamification logic — only the visual treatment (pure white cards on cream) is in scope per the user's "just white" answer.

## Validation

- Run `npm run build` (or `npm run lint`) in `frontend/` to catch any broken class references.
- Manually load:
  - `/` Home, `/about`, `/courses`, `/projects`, `/achievements`, `/faculty` — confirm cards read as crisp white on cream.
  - `/profile/<ownId>` → "Campus Directory" tab → confirm grid renders.
  - `/students` → confirm directory panel is gone, rest of the page still works.
  - Navbar at top — confirm it is pure white with a hairline border, distinct from cream body.
- On any admin/faculty route, confirm white-card pages still look right (no missing styles).
