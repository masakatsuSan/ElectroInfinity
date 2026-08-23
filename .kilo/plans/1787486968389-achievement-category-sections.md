# Plan: Admin-uploaded achievements categorized by the 3 display sections

## Goal
Make the admin panel upload achievements directly into one of the three "Pride of the
Department" sections shown on the public Achievements page:
**Student Achievements**, **Faculty Achievements**, **Awards & Certificates**.

Currently the admin dropdown uses 4 abstract categories (`academic`, `sports`, `cultural`,
`other`), and `Achievements.jsx` awkwardly remaps them into the 3 sections. We replace those
4 values with 3 canonical section slugs so the admin chooses the target section directly and
the display filters 1:1.

## Canonical categories (slug values)
- `student`  → "Student Achievements"
- `faculty`  → "Faculty Achievements"
- `awards`   → "Awards & Certificates"

## Changes

### 1. Backend model — `backend/src/models/Achievement.js`
- Change `category` enum from `['academic','sports','cultural','other']` to
  `['student','faculty','awards']` and default from `'academic'` to `'student'`.

### 2. Backend route — `backend/src/routes/achievements.js`
- In `POST /` default `category || 'student'`.
- `PUT /:id` already accepts `category` as-is; no structural change, but it will now only
  accept the new enum values (Mongoose validation). Keep as-is.

### 3. Data migration (important — existing docs use old values)
Add a one-off script `backend/scripts/migrateAchievementCategories.js`:
- Map old → new: `academic`→`student`, `sports`→`student`, `cultural`→`awards`, `other`→`faculty`.
- Use `Achievement.updateMany({ category: <old> }, { $set: { category: <new> } })` per value,
  and a catch-all for any unexpected value → `student`.
- Run once against the DB, then can be removed.

### 4. Admin panel — `frontend/src/pages/admin/AdminAchievements.jsx`
- Replace `CATS = ['academic','sports','cultural','other']` with a labeled list:
  ```
  const CATS = [
    { value: 'student', label: 'Student Achievements' },
    { value: 'faculty', label: 'Faculty Achievements' },
    { value: 'awards',  label: 'Awards & Certificates' },
  ]
  ```
- `BLANK.category` → `'student'`.
- `openEdit` fallback `a.category || 'academic'` → `a.category || 'student'`.
- Render options using `value={c.value}` / label text.
- (Optional polish) Show a friendly label in the list badge instead of the raw slug.

### 5. Public display — `frontend/src/pages/Achievements.jsx`
Replace the hacky filters:
- `STUDENT_ACH = allAchievements.filter(a => a.category === 'student').map(formatAch)`
- `FACULTY_ACH = allAchievements.filter(a => a.category === 'faculty').map(formatAch)`
- `AWARDS = allAchievements.filter(a => a.category === 'awards').map(formatAch)`
- Remove the placeholder comments.

## Edge cases / risks
- After the enum change, any un-migrated doc with an old value will fail Mongoose validation
  on edit/save. The migration script must run before/with deploy.
- Items whose `category` is somehow still missing will simply not appear in any section until
  migrated; default `student` covers new entries.
- Keep the `students` (comma-separated) field for all categories (harmless for faculty/awards).

## Validation
- Start backend + frontend, open Admin → Achievements, confirm the dropdown shows the 3
  sections; create one achievement in each and confirm it appears under the correct section on
  the public Achievements page.
- Edit an existing (migrated) achievement and save — confirm no validation error.
- Confirm deletes still work.
- `git diff`/lint as per repo before completing.
