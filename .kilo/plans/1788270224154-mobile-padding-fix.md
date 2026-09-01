# Mobile Padding Fix Plan

## Problem Statement

The mobile view has inconsistent and oversized padding in several areas:
1. **Admin list rows** use hardcoded `px-6 py-4` with no responsive reduction on small screens
2. **Navbar mobile overlay** uses `px-6` which is too wide on 320–360px screens
3. **AdminLayout main content** uses `p-6 md:p-10` — no mobile-specific reduction
4. **Public page containers** use `px-6 md:px-12` while authenticated pages use `px-4 md:px-12` — inconsistent experience

## Target Standard

Adopt a consistent mobile-first padding scale across the app:
- **Page containers**: `px-4 sm:px-6 md:px-12` (16px → 24px → 48px)
- **List rows / cards**: `px-4 sm:px-6 py-3 sm:py-4` (16px → 24px horizontal, 12px → 16px vertical)
- **AdminLayout main**: `p-4 sm:p-6 md:p-10`
- **Navbar mobile overlay**: `px-4 sm:px-6`

## Files to Modify

### High Priority — Admin list rows with hardcoded `px-6 py-4`

Replace `px-6 py-4` with `px-4 sm:px-6 py-3 sm:py-4` in list row containers:

| File | Line | Current | Fix |
|---|---|---|---|
| `frontend/src/pages/admin/AdminStudents.jsx` | 238 | `px-6 py-4` | `px-4 sm:px-6 py-3 sm:py-4` |
| `frontend/src/pages/admin/AdminAnnouncements.jsx` | 162 | `px-6 py-4` | `px-4 sm:px-6 py-3 sm:py-4` |
| `frontend/src/pages/admin/AdminFaculty.jsx` | 109 | `px-6 py-4` | `px-4 sm:px-6 py-3 sm:py-4` |
| `frontend/src/pages/admin/AdminResources.jsx` | ~268 | `px-6 py-4` | `px-4 sm:px-6 py-3 sm:py-4` |
| `frontend/src/pages/admin/AdminLabs.jsx` | ~151 | `px-6 py-4` | `px-4 sm:px-6 py-3 sm:py-4` |
| `frontend/src/pages/admin/AdminAchievements.jsx` | ~172 | `px-6 py-4` | `px-4 sm:px-6 py-3 sm:py-4` |
| `frontend/src/pages/admin/AdminCalendar.jsx` | ~132 | `px-6 py-4` | `px-4 sm:px-6 py-3 sm:py-4` |
| `frontend/src/pages/admin/AdminContact.jsx` | ~58 | `px-6 py-4` | `px-4 sm:px-6 py-3 sm:py-4` |
| `frontend/src/pages/admin/AdminYTLectures.jsx` | ~307 | `px-6 py-4` | `px-4 sm:px-6 py-3 sm:py-4` |
| `frontend/src/pages/admin/AdminRoutines.jsx` | ~110 | `px-6` (th) | `px-4 sm:px-6` |

Also check `AdminCourses.jsx` (~247, 250) for similar patterns.

### Medium Priority — Layout containers

| File | Line | Current | Fix |
|---|---|---|---|
| `frontend/src/components/Navbar.jsx` | 494 | `px-6` (mobile overlay) | `px-4 sm:px-6` |
| `frontend/src/pages/admin/AdminLayout.jsx` | 140 | `p-6 md:p-10` | `p-4 sm:p-6 md:p-10` |

### Low Priority — Standardize public page container padding

Public pages using `px-6 md:px-12` (24px mobile) → align to `px-4 sm:px-6 md:px-12` for consistency:
- `Home.jsx`, `Faculty.jsx`, `Labs.jsx`, `Courses.jsx`, `Resources.jsx`, `Placements.jsx`, `Calendar.jsx`, `Gallery.jsx`, `Projects.jsx`, `SubjectDetails.jsx`, `Contact.jsx`, `Network.jsx`, `AchievementDetails.jsx`, `ProjectDetails.jsx`, `FacultyDashboard.jsx`

These already look good visually, so this is optional. The most impactful fixes are the admin list rows.

## Implementation Notes

- All changes are pure Tailwind class swaps — no logic changes
- Use `replaceAll` or targeted `edit` calls per file
- After edits, run `npm run lint` or `npx tailwindcss` build to verify no class errors
- Test on 320px, 375px, and 768px viewports

## Validation

1. Run the dev server: `npm run dev`
2. Open Chrome DevTools device emulation at 320px width (iPhone SE)
3. Check each admin list page — rows should have tighter padding
4. Check navbar mobile overlay — should not touch screen edges
5. Check AdminLayout content area — should have comfortable but not excessive padding
