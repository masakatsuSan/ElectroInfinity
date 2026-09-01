# Gallery & Achievements Upload & Approval Plan

## Current State
- Backend routes exist for `gallery` and `achievements` (registered in `backend/server.js`).
- Frontend pages exist: `Gallery.jsx`, `Achievements.jsx`, `admin/AdminGallery.jsx`, `admin/AdminAchievements.jsx`.
- Profile page (`Profile.jsx`) has an achievements upload modal but **no gallery upload modal**.
- Admin/CR gallery uploads currently go to `pending` instead of being auto-approved.
- Profile page achievements list has **no edit/delete** for own items.
- CRs do not have `achievements` in their allowed admin sections (`AdminLayout.jsx`).

## Goal
1. Admin can upload gallery images from dashboard → auto-approved, visible to all.
2. Any authenticated user can upload gallery images from their profile → pending admin approval.
3. Users can view, edit, and delete their own uploads in their profile.
4. Users can only view public (approved) gallery and achievements.
5. Achievements auto-categorize by uploader role: student → `student`, faculty → `faculty`, admin → `awards`.
6. Fix achievements routes so all roles can upload/manage via profile and admin.

## Changes Required

### Backend

#### 1. `backend/src/routes/gallery.js`
- **Auto-approve admin/CR uploads:** In `POST /`, set `isApproved: true` and `approvedBy: req.user._id` when `req.user.role` is `admin`, `super_admin`, or `cr`.
- **No other logic changes needed** — the route already supports Cloudinary upload, notifications, and privacy.

#### 2. `backend/src/routes/achievements.js`
- **Auto-categorize by role on create:** In `POST /`, if `category` is not explicitly provided (or default), set it based on `req.user.role`:
  - `faculty` → `faculty`
  - `admin` / `super_admin` → `awards`
  - everyone else → `student`
- **Auto-approve admin/CR achievements:** Set `isApproved: true` and `approvedBy: req.user._id` for admin/super_admin/CR.
- **No other logic changes needed** — the route already supports Cloudinary, notifications, mentions, and approval workflow.

### Frontend

#### 3. `frontend/src/pages/Profile.jsx`
- **Add gallery upload modal:** Add `showGalleryModal` state + `GallerySubmitModal` component (similar to `AchievementSubmitModal`).
  - Form fields: title, category (select: Lab, Event, Campus, Other), date, image file.
  - On submit, call `createGalleryPhoto(data)` from `../api/gallery`.
  - Invalidate `['gallery']` query and clear local state on success.
- **Add "Upload Photo" button** above the gallery grid (only visible to `isOwn`).
- **Add edit/delete actions** for own gallery images in the gallery tab (edit opens modal pre-filled, delete confirms then calls `deleteGalleryPhoto`).
- **Add edit/delete actions** for own achievements in the achievements tab (similar pattern).
- **Update achievements query:** Ensure `getAchievements({ author: id })` works and shows pending + approved for own profile.

#### 4. `frontend/src/api/gallery.js`
- Already has `createGalleryPhoto`, `updateGalleryPhoto`, `deleteGalleryPhoto`. No changes needed unless imports are missing in Profile.

#### 5. `frontend/src/components/Navbar.jsx` or `AdminLayout.jsx`
- **Ensure `/admin/achievements` is accessible** to admins. It is already in `AdminLayout.jsx` links, but confirm CRs should NOT have access (current behavior is correct — CRs only get gallery, labs, rooms, etc.).

### Summary of Behavior After Fix

| Action | Who | Result |
|--------|-----|--------|
| Upload gallery from admin dashboard | Admin/CR | Auto-approved, visible to all |
| Upload gallery from profile | Any authenticated user | Pending, visible only to self until approved |
| Upload achievement from profile | Any authenticated user | Auto-categorized by role; admin/CR auto-approved, others pending |
| View gallery/achievements | Public | Only approved items |
| View own uploads | Authenticated user | Approved + own pending items |
| Edit/Delete own uploads | Owner | Allowed for pending items; admins can edit/delete any |

## Validation Steps
1. Start backend + frontend.
2. As admin, go to `/admin/gallery`, upload a photo → verify it appears publicly in `/gallery` without manual approval.
3. As student, go to own profile → Gallery tab → Upload Photo → verify it appears in own profile but not public gallery.
4. As admin, go to `/admin/gallery` → verify pending photo is visible → click approve → verify it appears publicly.
5. As student, go to own profile → Achievements tab → Post Achievement → verify category auto-set to `student`, appears in own profile but not public achievements.
6. As faculty, post achievement → verify category auto-set to `faculty`.
7. As admin, post achievement → verify category auto-set to `awards`, auto-approved, visible publicly.
8. Verify edit/delete on own uploads from profile page works.
9. Verify `/admin/achievements` route is accessible to admin.
