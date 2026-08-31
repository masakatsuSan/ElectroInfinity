# Resources Edit, Global Visibility, Semester & Subject Filters

## Summary
Add edit functionality for CR/admin-uploaded resources, remove batch restrictions so all batches can view resources, add a subject dropdown (sourced from existing courses/subjects) in the admin upload/edit forms, and add a subject filter dropdown on the public Resources page.

## Decisions

1. **Visibility change**: CR/admin uploads will default to `visibility: 'GLOBAL'` instead of `BATCH`. The `batchId` field remains populated for CRs but has no visibility effect since all resources become globally visible.

2. **No batch isolation on GET**: The GET `/api/resources` endpoint must return ALL resources to ALL users (authenticated or not). The `semester` and `subject` fields are used purely for user-side filtering, not access control. Remove the `$or` batch-isolation logic entirely.

3. **Subject field as dropdown**: The `Resource.subject` field (String) will store the subject `name` (e.g., "Power System-I"), consistent with how other parts of the system reference subjects as plain strings. The admin upload/edit forms will replace the free-text Subject input with a `<select>` dropdown populated from `GET /api/subjects`. The dropdown is filtered by the form's selected `semester` (if any); if no semester is selected, all approved subjects are shown.

4. **Edit scope**: CRs can edit their own uploads; admins/super_admins can edit any resource. The edit form supports updating title, type, semester, subject, dueDate, and optionally replacing the file.

5. **Semester filter**: Added as a dropdown on the public `/resources` page (`Resources.jsx`). Passes `?semester=<number>` to the existing API. Options: All, 1–8.

6. **Subject filter on public page**: Added as a dropdown on the public `/resources` page (`Resources.jsx`). Fetches approved subjects from `GET /api/subjects`. Passes `?subject=<name>` to the API. Options: All Subjects, then individual subject names.

7. **Backend GET filter extension**: Add `subject` to the GET `/api/resources` filter in addition to `type` and `semester`.

## Files to Modify

### Backend
- `backend/src/routes/resources.js`
  - Change POST `/` visibility default: `visibility: 'GLOBAL'` for CR and admin uploads
  - Modify GET `/` to remove batch isolation entirely — return all resources to all users (no `$or`, no `visibility` filter). Keep `?type=`, `?semester=`, and add `?subject=` filters.
  - Add PUT `/:id` endpoint:
    - `protect` + `guard('cr', 'super_admin', 'admin')`
    - Loads resource, enforces CR own-batch rule (keeps existing delete behavior consistent)
    - Updates `title`, `type`, `semester`, `subject`, `dueDate`, `visibility` from body
    - If `req.file` present, deletes old Cloudinary file and uploads replacement
    - Returns updated resource

### Frontend API
- `frontend/src/api/resources.js`
  - Add `updateResource(id, formData)` — `api.put(`/resources/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })`
- `frontend/src/api/subjects.js`
  - No changes needed — `getSubjects(params)` already exists and supports `?semester=` filtering

### Frontend Admin
- `frontend/src/pages/admin/AdminResources.jsx`
  - Import `getSubjects` from `../../api/subjects`
  - Add state: `subjects` (fetched list), `subjectsLoading`, `subjectsError`
  - Fetch subjects on mount (and when `semester` changes) via `useQuery` calling `getSubjects({ semester: form.semester || undefined })`
  - Replace the free-text Subject `<input>` with a `<select>` dropdown:
    - Options: "— select subject —" + fetched subjects (showing `name`)
    - Value stored is subject `name`
    - If no semester selected, fetch all subjects (`getSubjects({})`)
  - Apply same dropdown change to the Edit form
  - Import `updateResource`
  - Add edit state: `editingId`, `editForm` (title, type, semester, subject), `editFile`, `editError`, `editSaving`
  - Add `openEdit(resource)` to pre-fill form
  - Add `handleEditUpdate()` to call `updateResource`
  - Render Edit modal (same style as upload form) with "Save Changes" button
  - Add `Edit` button next to each resource's `View`/`Delete` buttons

### Frontend Public
- `frontend/src/pages/Resources.jsx`
  - Add `semesterFilter` state
  - Add `<select>` dropdown above tabs: "All Semesters", "Semester 1" … "Semester 8"
  - Include `semester` in `getResources` params when selected
  - Add `subjectFilter` state
  - Fetch approved subjects via `useQuery` calling `getSubjects({})`
  - Add `<select>` dropdown: "All Subjects" + fetched subject names
  - Include `subject` in `getResources` params when selected
  - Update `queryKey` to include both `semesterFilter` and `subjectFilter`

## Validation / Edge Cases
- Edit form: CR editing another batch's resource → 403 (enforced backend)
- Edit without file change → file remains intact
- Edit with new file → old Cloudinary file deleted, new one uploaded
- Semester filter "All" → no `semester` query param sent
- Subject filter "All Subjects" → no `subject` query param sent
- All resources are visible to all users regardless of batch — `batchId` is recorded but not used for access control
- Existing BATCH resources are now visible to everyone after GET endpoint change
- Subject dropdown in admin form: if no semester selected, fetch all subjects; if semester selected, fetch only subjects for that semester
- Subject stored as plain string (subject name) in Resource, consistent with existing plain-string references across the codebase
