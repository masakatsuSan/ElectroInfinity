  # Plan: Add Admin Image Uploads to Labs & Achievements

## Goal
Allow admins to upload photos for **Laboratories** and **Achievements** from the admin dashboard, so the public pages (`/laboratory`, `/achievements`) display real images.

## Current State
| Resource | Backend CRUD | Image Support | Admin Page | Public Page |
|----------|-------------|---------------|------------|-------------|
| Gallery | Yes | Full (Cloudinary + multer) | `AdminGallery.jsx` | `Gallery.jsx` |
| Labs | Yes | None | `AdminLabs.jsx` | `Labs.jsx` (text only) |
| Achievements | Yes | `image` field exists but unused (string URL only) | **None** | `Achievements.jsx` (uses `photo` field) |

## Implementation Plan

### 1. Backend: Lab Model
**File:** `backend/src/models/Lab.js`
- Add `image` (String, default `''`) and `imagePublicId` (String, default `''`) fields to the schema.

### 2. Backend: Lab Routes
**File:** `backend/src/routes/labs.js`
- Import `{ upload, uploadToCloudinary, deleteFromCloudinary }` from `../utils/upload`
- Add `upload.single('image')` middleware to POST and PUT routes
- On POST: if `req.file` exists, upload to Cloudinary folder `electro-infinity/labs`, store `url` in `image` and `publicId` in `imagePublicId`
- On PUT: if `req.file` exists, delete old Cloudinary image (if `imagePublicId` exists), upload new one, update both fields
- On DELETE: delete Cloudinary image before removing DB record

### 3. Backend: Achievement Routes
**File:** `backend/src/routes/achievements.js`
- Import `{ upload, uploadToCloudinary, deleteFromCloudinary }` from `../utils/upload`
- Add `upload.single('image')` middleware to POST and PUT routes
- On POST: if `req.file` exists, upload to Cloudinary folder `electro-infinity/achievements`, store URL in `image` and publicId in new `imagePublicId` field
- On PUT: if `req.file` exists, delete old Cloudinary image (if `imagePublicId` exists), upload new one, update both fields
- On DELETE: delete Cloudinary image before removing DB record

### 4. Backend: Achievement Model
**File:** `backend/src/models/Achievement.js`
- Add `imagePublicId` (String, default `''`) field to the schema.

### 5. Frontend: AdminLabs Image Upload
**File:** `frontend/src/pages/admin/AdminLabs.jsx`
- Add `image` and `imagePublicId` to `BLANK` state
- Add file input field in the form (accept `image/*`)
- Preview uploaded image when file is selected
- On save, use `FormData` instead of JSON payload (append `image` file, `name`, `icon`, `desc`, `equip`)
- Show existing image when editing
- On delete, confirm and call `deleteLab`

### 6. Frontend: New AdminAchievements Page
**File:** `frontend/src/pages/admin/AdminAchievements.jsx`
- Create new admin page modeled after `AdminGallery.jsx` with form fields:
  - Title, Description, Date, Category (academic/sports/cultural/other), Image upload
- Use `FormData` for file upload
- Support create, edit, delete with image preview
- Import and use `createAchievement`, `updateAchievement`, `deleteAchievement` from `../../api/achievements`

### 7. Frontend: AdminLayout Sidebar
**File:** `frontend/src/pages/admin/AdminLayout.jsx`
- Add `{ to: '/admin/achievements', label: 'Achievements', icon: Award }` to `LINKS`
- Import `Award` from `lucide-react`
- Add `/admin/achievements` to CR allowed links

### 8. Frontend: Routing
**File:** `frontend/src/App.jsx`
- Add `import AdminAchievements from './pages/admin/AdminAchievements'`
- Add `<Route path="achievements" element={<AdminAchievements />} />` inside the admin nested routes

### 9. Frontend: Public Labs Page
**File:** `frontend/src/pages/Labs.jsx`
- If `lab.image` exists, display it as a thumbnail/header image in each lab card
- Show image above the lab name/description, styled with `object-cover`

### 10. Frontend: Public Achievements Page
**File:** `frontend/src/pages/Achievements.jsx`
- Already reads `item.photo` from `a.image` — no changes needed since backend `image` field maps to this

### 11. Frontend: API Helpers
**Files:** `frontend/src/api/labs.js`, `frontend/src/api/achievements.js`
- Add `uploadLabImage` or update existing functions to accept `FormData`
- Set `headers: { 'Content-Type': 'multipart/form-data' }` when sending FormData

## Validation
- Run `npm run build` in frontend to verify no compile errors
- Run backend to verify routes work with multer multipart
- Test admin can: create lab with image, edit lab image, delete lab (image removed from Cloudinary)
- Test admin can: create achievement with image, edit achievement image, delete achievement
- Verify public pages display uploaded images

## Open Questions
- None — the Gallery system already proves the pattern works.
