# Syllabus Tab Redirect to Academic Curriculum

## Goal
When the **Syllabus** tab in the Resources & Bulletins page is clicked, redirect the user to the `/courses` route (Academic Curriculum) instead of fetching and displaying syllabus files.

## Context
- `Resources.jsx` currently renders 5 tabs: Study Materials, PYQs, Assignments, Lab Manuals, Syllabus.
- Clicking **Syllabus** triggers a `useQuery` for `type=syllabus` and renders a grid of uploaded syllabus files.
- The "Academic Curriculum" is the **Courses** page at route `/courses`.
- No new API changes or backend modifications are needed.

## Implementation Steps

1. **In `frontend/src/pages/Resources.jsx`:**
   - Import `useNavigate` from `react-router-dom`.
   - Initialize `const navigate = useNavigate()`.
   - In the `TABS.map` click handler, add a conditional: if `tab.id === 'syllabus'`, call `navigate('/courses')` and return early. Otherwise, call `setActiveTab(tab)` as before.

## Validation
- Run `npm run lint` and `npm run typecheck` in the `frontend` directory.
- Manually verify: on `/resources`, clicking the **Syllabus** pill navigates to `/courses` (the Academic Curriculum page).

## Risks / Notes
- The Syllabus tab will still appear in the tab bar; only its click behavior changes.
- If the user is on `/resources` and clicks Syllabus, they leave the Resources page. The browser back button will return them to `/resources`.
