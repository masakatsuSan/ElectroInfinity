# Resource Folders (semester/subject) with YT Playlist import + sequencing

Status: Implementation-ready
Owner: admin/CR dashboard (`/admin/resource-folders`)
Scope: Admin-managed "folders" that group uploaded PDF/image files and YouTube
lecture videos (extracted from a playlist in playlist order). Items are reorderable
from the dashboard. Existing flat Resources and YT Lectures pages stay untouched.

## Context (codebase facts)
- Backend = Express + MongoDB/Mongoose (`backend/src/`). Auth via JWT; `protect` +
  `guard(...roles)` (`backend/src/middleware/auth.js`). Roles: student, cr, admin,
  super_admin, faculty. Routes registered in `backend/server.js` with
  `app.use('/api/<name>', require('./src/routes/<name>'))`.
- Upload infra already exists: `backend/src/utils/upload.js` exports
  `upload` (multer, 20MB, PDFs + images only), `uploadToCloudinary(buffer, opts)`
  -> `{ url, publicId }`, `deleteFromCloudinary(publicId, resourceType)`.
- Existing models: `Resource` (`backend/src/models/Resource.js`) and
  `YTLecture` (`backend/src/models/YTLecture.js`). YTLecture has required
  `lectureNumber` (min 1). Neither has a folder/sort field today.
- YouTube handling today: only single-video URL -> videoId extraction + thumbnail
  (`backend/src/routes/yt-lectures.js:extractYouTubeId`). No playlist fetch, no
  Data API usage, no `YOUTUBE_API_KEY`.
- Frontend = React + Vite + Tailwind + React Query (`@tanstack/react-query`) +
  `lucide-react` + `framer-motion` (`frontend/src/`). API modules in
  `frontend/src/api/*.js` call `api` (axios, base `/api`, auto Bearer token).
  Admin pages in `frontend/src/pages/admin/`, nav + role gating in
  `frontend/src/pages/admin/AdminLayout.jsx`, routes in `frontend/src/App.jsx`
  under `/admin/*`. Protected by `<ProtectedRoute role="cr, admin">`.
- Public pages: `frontend/src/pages/Resources.jsx` shows tabs (notes/pyq/
  assignment/lab_manual/yt_lectures) filtered by semester + subject; fetches
  `/api/resources` and `/api/yt-lectures`. Folder-bound leaves are still real
  Resource/YTLecture docs, so they keep appearing here (no regression).
- Env: `backend/.env` exists (not committed). Conventions: `MONGO_URI`,
  `JWT_SECRET`, `CLOUDINARY_*`, `PORT`, `FRONTEND_URL`. No `.env.example`.

## Decisions (resolved)
- D1 Model: a new `Folder` model is the single source of truth. It holds an
  `items` array; order = array index (no `sortOrder` field, no schema changes to
  Resource/YTLecture). Rationale: matches the "mixed series" mental model
  (files + videos in one editable sequence) with zero migration.
- D2 Items: `Folder.items` = `[{ ref: ObjectId, type: 'resource'|'lecture',
  title: String(denorm), thumbnail: String(denorm, lectures) }]`. Denorm title/
  thumbnail so the reorder/list UI renders without extra round-trips. Order =
  array position.
- D3 Playlist source: YouTube Data API v3 `playlistItems.list` (server-side key).
  NOT scraping (fragile / ToS risk). Requires new `YOUTUBE_API_KEY` env var.
- D4 Playlist extraction: paginate `nextPageToken`, cap at 500 videos per import.
  Dedup within one import by `youtubeVideoId`. For each video create a YTLecture
  doc (folder's semester/subject/batchId/visibility; `lectureNumber` = index),
  then push an item referencing it.
- D5 Upload into folder: reuse `upload.single('file')` + `uploadToCloudinary`.
  Create a Resource doc with the folder's `semester`/`subject`/`batchId`/
  `visibility`; push an item referencing it.
- D6 Permissions: folder CRUD + upload + playlist + reorder = `guard('cr','admin',
  'super_admin')` (matches `/api/resources`/`/api/yt-lectures`). CR is batch-scoped:
  their created/edited folders must have `batchId === req.user.batch`; admins are
  global.
- D7 Reorder: `PUT /api/folders/:id/items` body `{ items: [{ ref, type }, ...] }`
  validates every ref belongs to that folder, then atomically rewrites `items`
  array to the given order (MongoDB positional/pull+push or full array replace).
- D8 Delete folder: default = delete the Folder doc only (leaves the referenced
  Resource/YTLecture docs intact, still visible in flat lists). Provide optional
  `?cascade=1` to also delete referenced leaves (Cloudinary file delete for
  resources, doc delete for lectures). Item-level remove (`DELETE
  /api/folders/:id/items/:itemId`) removes the item reference and deletes the
  underlying leaf doc (Cascade off by default for delete-folder; item-remove
  deletes the leaf since its only purpose was the folder).
  - Reconsidered: keep item-remove as "unlink only" (remove reference, leaf stays
    visible in flat lists) for safety/consistency with D8 default. Leaf cleanup
    happens only via the dedicated delete-folder cascade. (Decided: unlink only.)
- D9 Dangling refs: if a leaf is deleted directly via `/api/resources/:id` or
  `/api/yt-lectures/:id` while still referenced by a folder, GET folder filters
  out missing refs (populate returns null/empty -> drop client-side). Lowest-risk
  handling; no back-ref needed.
- D10 Slug: `slug` unique per `batchId` (case-insensitive), auto-generated from
  title + short suffix if taken. Admins (batchId='') get global-uniq among empty
  batch.
- D11 Drag-and-drop: native HTML5 DnD, no new dependency (project has no DnD lib).
  `GripVertical` (lucide) as drag handle. Fallback: numbered input per item.

## Data model
New file `backend/src/models/Folder.js`:
```js
const mongoose = require('mongoose')
const folderSchema = new mongoose.Schema({
  title:    { type: String, required: true, trim: true },
  slug:     { type: String, required: true, trim: true, lowercase: true },
  description: { type: String, default: '' },
  semester: { type: Number, min: 1, max: 8, default: null },
  subject:  { type: String, default: '' },
  batchId:  { type: String, default: '' },
  visibility: { type: String, enum: ['GLOBAL','BATCH'], default: 'BATCH' },
  items: [{
    ref:       { type: mongoose.Schema.Types.ObjectId, required: true },
    type:      { type: String, enum: ['resource','lecture'], required: true },
    title:     { type: String, default: '' },
    thumbnail: { type: String, default: '' },
  }],
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })
folderSchema.index({ slug: 1, batchId: 1 }, { unique: true })
module.exports = mongoose.model('Folder', folderSchema)
```
Resource & YTLecture: NO schema changes (folder owns references).

## Backend tasks (ordered)
1. `backend/src/models/Folder.js` — new model above.
2. `backend/src/services/youtube.js` — new. Exported `extractPlaylistId(url)`, `importPlaylist(playlistId, opts)`:
   - `axios.get('https://www.googleapis.com/youtube/v3/playlistItems', { params: { part:'snippet,contentDetails', playlistId, maxResults:50, pageToken, key: process.env.YOUTUBE_API_KEY } })`.
   - Loop pages via `nextPageToken`; collect `{ videoId, title, thumbnail }`; dedup by videoId; cap 500.
   - Return ordered array. Throw on missing key / API error / empty.
3. `backend/src/routes/folders.js` — new route file:
   - `GET /` (optionalAuth): list folders; filter `semester`, `subject`, `batchId`; return `items.length`.
   - `GET /:id` (optionalAuth): folder detail; split item refs by type, fetch
     `Resource.find` + `YTLecture.find` in parallel, map onto `items` (drop missing),
     return ordered.
   - `POST /` (protect, guard cr/admin/super_admin): create folder; CR batch-scope
     enforcement; slug uniqueness check.
   - `PUT /:id` (protect, guard): edit metadata; owner-or-admin; CR batch-scope.
   - `DELETE /:id` (protect, guard): default unlink (delete Folder only); `?cascade=1`
     deletes referenced leaves (resource -> Cloudinary delete + doc; lecture -> doc).
   - `POST /:id/upload` (protect, guard): `upload.single('file')` +
     `uploadToCloudinary`; create Resource with folder's sem/subject/batchId/
     visibility; push item `{ ref, type:'resource', title, thumbnail:'' }`;
     `createActivity` + `createNotificationBulk` (reuse pattern from resources.js).
   - `POST /:id/playlist` (protect, guard): body `{ playlistUrlOrId, titlePrefix='', subject?, semester? }`;
     call `importPlaylist`; for each video create YTLecture (folder sem/subject/
     batchId/visibility, lectureNumber=index); push items in order; activity+
     notification. Return `{ created, count }`.
   - `PUT /:id/items` (protect, guard): reorder; validate all refs are the
     folder's existing items (same set, reordered); replace `items` array.
   - `DELETE /:id/items/:itemId` (protect, guard): unlink item only (pull from
     `items` array by `ref`). Leaf stays in flat lists.
4. `backend/server.js` — register `app.use('/api/folders', require('./src/routes/folders'))`.
5. `backend/.env` — add `YOUTUBE_API_KEY=` (prerequisite; do NOT commit real key).
6. Optional migration `backend/migrations/003-...` — none required (no schema
   change to existing models). Skip unless backfilling folder for old content.
7. Error handling: playlist endpoint returns 400 on missing/invalid key, 400/404
   on playlist not found (YouTube 404/403), 429 on quota. Surfaced to admin UI.

## Frontend tasks (ordered)
1. `frontend/src/api/folders.js` — new API module: `getFolders`, `getFolder`,
   `createFolder`, `updateFolder`, `deleteFolder`, `uploadToFolder`, `importPlaylist`,
   `reorderFolderItems`, `removeFolderItem`.
2. `frontend/src/pages/admin/AdminResourceFolders.jsx` — new single-page
   master-detail (matches existing admin page style):
   - Top bar: "+ New Folder" -> inline create form (title, slug, semester, subject,
     description, visibility). Semester/subject dropdowns mirror AdminResources
     (SEMS + `getSubjects` approved). Subject options filtered by chosen semester.
   - Folder list: cards/tiles grouped by semester (reuse AdminCourses' bySem pattern)
     with item counts; Edit/Delete on each; click -> load detail.
   - Detail view (when a folder is active): ordered mixed list of items
     (resource icon/thumb + lecture thumbnail + title + type badge). Each item has a
     drag handle (`GripVertical`) + Remove button; list is HTML5-DnD reorderable.
     "Save Order" writes via `reorderFolderItems`. "Add File" -> file picker ->
     `uploadToFolder` (FormData). "Import Playlist" -> input field for URL/ID +
     optional title prefix + "Import" -> `importPlaylist` with progress indicator.
   - Empty folder: shows "Upload a file or import a playlist to add items."
3. `frontend/src/pages/admin/AdminLayout.jsx` — add nav link
   `{ to:'/admin/resource-folders', label:'Resource Folders', icon:FolderOpen }`
   (FolderOpen already imported). Add `/admin/resource-folders` to `CR_SECTIONS`.
4. `frontend/src/App.jsx` — under `/admin/*` Routes, add
   `<Route path="resource-folders" element={<AdminResourceFolders/>} />`.
5. Reuse: Tailwind classes + `button-primary`/`input` patterns from AdminResources/
   AdminYTLectures; `getSubjects` for subject dropdown; `@tanstack/react-query`
   invalidation keys `['folders']`/`['folder', id]`.

## Edge cases & risks
- Playlist >500 videos: cap at 500, surface count + message "X of N imported".
- Duplicate video already in folder: skip (dedup by videoId within import).
- Quota/403 from YouTube (private playlist or disabled API): return clear 400/404 to
  admin; UI shows error toast.
- CR scope: CR cannot create/edit folder with `batchId != user.batch`; cannot
  cascade-delete another batch's content.
- Slug collision: auto-append short hash; never expose internal errors to UI.
- Large folder item arrays: reorder replaces whole array (fine for typical sizes;
  if >200 items, switch to per-item `sortOrder` — not needed v1).
- Public side not changed in v1 (folders are admin/dashboard). Listing folders
  publicly is deferred.

## Out of scope (explicitly)
- Public/folder-browsable Resources view (deferred; flat lists unaffected).
- Removing/replacing existing `/admin/resources` and `/admin/yt-lectures` pages
  (kept as-is; folders are additive).
- Channel-level imports, "uploads from channel" auto-detection.
- Per-item metadata deep-edit (rename/title only via inline; no file re-upload
  inside folder view — use AdminResources for file replacement).
- Real-time collaborative reordering (no WebSocket needed for v1).

## Validation / testing (not run by planner)
- Backend: unit-test `extractPlaylistId` (valid URL, raw ID, garbage -> null);
  unit-test `importPlaylist` with a mock axios (pagination + dedup + 500 cap);
  route-level: CRUD + reorder validation (reject unknown ref) + batch-scope for CR.
- Run `node -c backend/src/models/Folder.js`, `folders.js`, `services/youtube.js`
  (syntax) before `npm run dev`.
- Frontend: open `/admin/resource-folders` as admin; create folder; upload a PDF;
  import a playlist; reorder; refresh -> order persisted; remove item -> gone.
  As CR: confirm only own-batch folders list/actionable.

## Rollout / migration notes
- Zero DB migration: new `folders` collection only; Resource/YTLecture unchanged.
- Add `YOUTUBE_API_KEY` to deployment env + Vercel/other platform env for backend.
- Backward compatible: existing `/api/resources` and `/api/yt-lectures` unchanged.
