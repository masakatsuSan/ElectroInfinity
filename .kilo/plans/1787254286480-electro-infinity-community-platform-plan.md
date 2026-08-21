# Electro Infinity — Community Platform Transformation Plan

## 1. System Audit Summary

### Architecture & Routing
- **Backend:** Express 4 + MongoDB (Mongoose 8) with 19 models. MVC-lite pattern (route handlers inline). No separate controllers directory.
- **Frontend:** Vite + React 18 + React Router v6. Two-tier routing: layout shells (Navbar/Footer) + animated page content via `AnimatedRoute` (Framer Motion).
- **Admin:** Nested `/admin/*` routes with `AdminLayout` sidebar. CR-only access to admin panel (`role="cr, admin"`).
- **Forum:** Single flat feed at `/forum` under `ProtectedRoute`. No room structure, no post types.

### Core Components
- `Navbar.jsx` — Fixed pill nav, mobile drawer, profile dropdown with role-based links.
- `Footer.jsx` — 4-column link grid.
- `GlobalSearch.jsx` — Cmd+K modal hitting 4 endpoints.
- `ProtectedRoute.jsx` — Auth gate with role checks.
- `AdminLayout.jsx` — Sidebar with Lucide icons for admin nav.
- `Button.jsx`, `NoticeCard.jsx`, `Hero.jsx`, `ErrorBoundary.jsx`.

### Data Layer
- **19 Mongoose models** including `User`, `ForumPost`, `ForumComment`, `Room` (GPS), `Event`, `Notice`, `Resource`, `Assignment`, `Deadline`, `Placement`, `Gallery`, `Achievement`, etc.
- **ForumPost** has: title, content, author, upvotes, links, mediaUrls, tags.
- **ForumComment** has: post, author, content, upvotes, imageUrl.
- **No post types, no rooms, no nested comments, no downvotes.**
- **Room** model exists but is GPS-only (lat/lng/radius for attendance). NOT reusable for community rooms.

### Security & RBAC
- JWT auth (7-day expiry) with `protect` middleware.
- `guard(...roles)` middleware enforces role-based access.
- **Roles:** `student`, `cr`, `faculty`, `admin`, `super_admin`.
- Socket.IO with JWT for attendance real-time.

### UI/UX Assets
- Tailwind CSS v3.4 with extensive custom design tokens (colors, fonts, spacing).
- **Lucide React v1.31.0 already installed** and used in Navbar, AdminLayout.
- **78 decorative emojis** found across 15+ components (Navbar, Forum, NotFound, Attendance pages, Admin pages, etc.).
- Framer Motion for transitions, Lenis for smooth scroll, React Three Fiber for 3D classroom map.

### Reusability Map
- **Preserve:** Auth system, RBAC middleware, all 19 existing models, attendance system, notices, events, resources, assignments, deadlines, routines, placements, gallery, achievements, labs, faculty.
- **Reuse patterns:** Admin CRUD pages (AdminNotices, AdminEvents), React Query hooks, axios interceptors, ProtectedRoute guards.
- **Extend:** `ForumPost` (add room, postType, downvotes), `ForumComment` (add parent for nesting).
- **Do NOT touch:** `Room` (GPS), `Session` (attendance QR), `AttendanceRecord`, `Routine`.

---

## 2. Key Design Decisions

| Decision | Recommendation | Rationale |
|---|---|---|
| **Community Room model** | Create new `CommunityRoom` model. Do NOT reuse existing `Room` (GPS). | Existing Room has lat/lng/radius; community rooms need name, description, icon, color, isPopular, createdBy. Mixing concerns breaks GPS attendance. |
| **Post model** | Extend existing `ForumPost` with `room` (ref), `postType` (text/image/poll/link), `downvotes` array, `pollOptions`, `linkUrl`. | Avoids duplicate models. Preserves existing forum data. |
| **Comment nesting** | Extend `ForumComment` with `parent` (ref to ForumComment, nullable). | Enables threaded replies without duplicating the model. |
| **Announcements** | Create new `Announcement` model. | Distinct from `Notice` (general notices). Announcements = dedicated official club channel with targetAudience, priority, and visual distinction. |
| **Academic Calendar** | Create new `AcademicCalendar` model. | Not covered by existing `Event` (which is workshop/seminar/fest). Calendar = semester dates, exams, holidays. |
| **Projects** | Create new `Project` model. | Not covered by existing `Achievement` (which is awards). Projects = student technical showcase with techStack, githubLink, demoLink. |
| **Student Dashboard** | New page at `/dashboard` (protected, student/cr/faculty). | `/students` is already a batch roster/attendance portal. New `/dashboard` = personalized feed of events, discussions, announcements. |
| **Emoji policy** | Replace ALL decorative emojis in UI components with Lucide icons. Preserve emojis only inside user-generated content (post text, comments). | Strict requirement from user. |
| **Forum aesthetic** | Remove gaming/neon aesthetic from `Forum.jsx`. Adopt clean, compact, professional layout matching the rest of the site. | User wants mature, clean, professional. High information density, subtle borders, consistent typography. |
| **Moderator role** | Treat `cr` + `faculty` as moderators for community features (can manage rooms, pin posts). `admin`/`super_admin` retain full control. | Existing roles; no new role needed. |

---

## 3. Backend Implementation Tasks

### 3.1 New Models

**`backend/src/models/CommunityRoom.js`**
```js
{
  name: String (required, unique, trim),
  description: String,
  icon: String (default: 'hash'),
  color: String (default: '#5865F2'),
  isPopular: Boolean (default: false),
  isActive: Boolean (default: true),
  createdBy: { type: ObjectId, ref: 'User', required: true },
  members: [{ type: ObjectId, ref: 'User' }],
  postCount: Number (default: 0),
  lastActivity: Date
}
```

**`backend/src/models/Announcement.js`**
```js
{
  title: String (required, trim),
  content: String (required),
  category: String (enum: ['exam','lab','event','academic','placement','general','urgent'], default: 'general'),
  postedBy: { type: ObjectId, ref: 'User', required: true },
  isPinned: Boolean (default: false),
  attachmentUrl: String,
  targetAudience: String (enum: ['all','batch','section'], default: 'all'),
  batchId: String,
  section: String,
  expiresAt: Date,
  readBy: [{ type: ObjectId, ref: 'User' }]
}
```

**`backend/src/models/AcademicCalendar.js`**
```js
{
  title: String (required, trim),
  date: Date (required),
  type: String (enum: ['exam','holiday','registration','deadline','event','other'], default: 'other'),
  description: String,
  batch: String,
  createdBy: { type: ObjectId, ref: 'User', required: true }
}
```

**`backend/src/models/Project.js`**
```js
{
  title: String (required, trim),
  description: String (required),
  techStack: [String],
  githubLink: String,
  demoLink: String,
  author: { type: ObjectId, ref: 'User', required: true },
  images: [String],
  likes: [{ type: ObjectId, ref: 'User' }],
  isApproved: Boolean (default: false),
  approvedBy: { type: ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
}
```

### 3.2 Model Extensions

**`backend/src/models/ForumPost.js`** — Add fields:
- `room: { type: ObjectId, ref: 'CommunityRoom', required: true, index: true }`
- `postType: { type: String, enum: ['text','image','poll','link'], default: 'text' }`
- `downvotes: [{ type: ObjectId, ref: 'User' }]`
- `pollOptions: [{ text: String, votes: Number }]` (for poll type)
- `linkUrl: String` (for link type)
- `isPinned: Boolean (default: false)` (room-level pinning)

**`backend/src/models/ForumComment.js`** — Add field:
- `parent: { type: ObjectId, ref: 'ForumComment', default: null }`

### 3.3 Route Updates

**Extend `backend/src/routes/forum.js`:**
- `GET /` — Support query params `?room=<id>&sort=latest|popular`. Add pagination (`?page=1&limit=20`). Populate room data.
- `POST /` — Require `room` and `postType` in body. Validate poll options if postType=poll.
- `PUT /:id/upvote` — Toggle upvote (existing).
- `PUT /:id/downvote` — New endpoint: toggle downvote.
- `POST /:id/comments` — Support `parent` field for nested comments.
- `PUT /comments/:id/upvote` — Toggle comment upvote (existing).
- `GET /rooms` — List all community rooms with post counts.
- `POST /rooms` — Create room. Guard: `cr, admin, super_admin`.
- `PATCH /rooms/:id` — Edit room (name, description, icon, color, isPopular, isActive). Guard: `cr, admin, super_admin`.
- `DELETE /rooms/:id` — Soft delete (set isActive=false). Guard: `admin, super_admin`.

**New file: `backend/src/routes/announcements.js`**
- `GET /` — Public (optionalAuth). Filter by targetAudience, batch, section. Paginated.
- `GET /:id` — Public.
- `POST /` — Guard: `cr, admin, super_admin, faculty`.
- `PATCH /:id` — Guard: `cr, admin, super_admin`.
- `DELETE /:id` — Guard: `admin, super_admin`.
- `PUT /:id/read` — Mark as read by current user.

**New file: `backend/src/routes/calendar.js`**
- `GET /` — Public. Filter by batch, type, date range. Paginated.
- `GET /:id` — Public.
- `POST /` — Guard: `cr, admin, super_admin, faculty`.
- `PATCH /:id` — Guard: `cr, admin, super_admin`.
- `DELETE /:id` — Guard: `admin, super_admin`.

**New file: `backend/src/routes/projects.js`**
- `GET /` — Public. Filter by techStack, author. Paginated. Only return `isApproved=true` for non-admins.
- `GET /:id` — Public.
- `POST /` — Guard: `student, cr, faculty, admin, super_admin`. Default `isApproved=false`.
- `PATCH /:id` — Guard: `admin, super_admin` (approve/reject).
- `DELETE /:id` — Guard: `admin, super_admin` or `author === req.user.id`.

**Update `backend/src/routes/` mount in `server.js`:**
- Add `/api/announcements`, `/api/calendar`, `/api/projects`.

### 3.4 Admin Dashboard Stats Update

**`backend/src/routes/` — New endpoint or extend existing:**
- `GET /api/admin/stats` — Return counts: totalUsers, totalPosts, totalRooms, totalEvents, totalResources, totalAnnouncements, totalProjects, activeSessions.
- Alternatively, update `AdminDashboard.jsx` to query existing endpoints and compute client-side.

---

## 4. Frontend Implementation Tasks

### 4.1 API Service Layer

**New files:**
- `frontend/src/api/rooms.js` — CRUD for community rooms.
- `frontend/src/api/announcements.js` — CRUD + mark-read.
- `frontend/src/api/calendar.js` — CRUD.
- `frontend/src/api/projects.js` — CRUD + like.

**Update `frontend/src/api/forum.js`:**
- Add `getRooms`, `createRoom`, `updateRoom`, `deleteRoom`.
- Update `getPosts` to accept `room` and `sort` params.
- Update `createPost` to accept `room`, `postType`, `pollOptions`, `linkUrl`.
- Add `downvotePost`.
- Update `createComment` to accept `parent` for nesting.

### 4.2 Emoji Replacement (All Decorative Emojis → Lucide Icons)

**Files to update (priority order):**

| File | Emoji(s) | Replacement |
|---|---|---|
| `components/Navbar.jsx` | ⚡, 📢, 📷 | `Zap`, `Megaphone`, `Camera` from lucide-react |
| `components/Footer.jsx` | ↗ | `ExternalLink` |
| `components/ErrorBoundary.jsx` | ⚡ | `Zap` |
| `pages/Forum.jsx` | ⚡ (sidebar logo) | `Hash` or custom gradient div without emoji |
| `pages/NotFound.jsx` (in App.jsx) | ⚡ | `Zap` |
| `pages/Home.jsx` | ✓ | `Check` |
| `pages/Events.jsx` | 📍 | `MapPin` |
| `pages/Labs.jsx` | ⧫ (fallback icon) | `Cpu` or `FlaskConical` |
| `pages/AdminNotices.jsx` | ★, ☆ | `Pin`, `PinOff` |
| `pages/AdminLabs.jsx` | 🧪 | `FlaskConical` |
| `pages/AdminAttendance.jsx` | 🗑, ✕, ✕ | `Trash2`, `X` |
| `pages/AdminDeadlines.jsx` | ✅, ✕ | `CheckCircle2`, `X` |
| `pages/AdminRoutines.jsx` | ✕ | `X` |
| `pages/AdminGallery.jsx` | ✓ | `Check` |
| `pages/AdminResources.jsx` | ✓ | `Check` |
| `pages/AdminStudents.jsx` | ✓ | `Check` |
| `pages/Faculty.jsx` | ✉ | `Mail` |
| `pages/Students.jsx` | 📷, 📊, ✅, ✗, ⚠ | `Camera`, `BarChart3`, `CheckCircle2`, `XCircle`, `AlertTriangle` |
| `pages/Contact.jsx` | ✓ | `Check` |
| `pages/ForgotPassword.jsx` | ✓ | `Check` |
| `pages/attendance/StudentAttendance.jsx` | 📍, 📡, ✓, ⚠, ✓, 📍, ✓, ⚠, ✓, ✓, ✓, ✓, ✓, ✓ | `MapPin`, `Radio`, `Check`, `AlertTriangle`, etc. |
| `pages/attendance/FacultyAttendance.jsx` | ✓, ✕, ⚠, 🚀, 🔄, 📍, ✓, ✓, ✕, ⚠️, ✕ | `Check`, `X`, `AlertTriangle`, `Rocket`, `RefreshCw`, `MapPin` |
| `pages/faculty/FacultyDashboard.jsx` | 📢, 🎓, ⚡ | `Megaphone`, `GraduationCap`, `Zap` |
| `components/PermissionBanner.jsx` | 📷, 📍, ⚠ | `Camera`, `MapPin`, `AlertTriangle` |
| `components/attendance/ClassroomPresence.jsx` | 👩‍🏫 | `UserCheck` |

### 4.3 Forum Redesign

**Update `frontend/src/pages/Forum.jsx`:**
- Remove gaming aesthetic (dark background, mesh orbs, glowing gradients, "ELECTRO INFINITY" intro).
- Adopt clean light/canvas theme matching rest of site.
- **Layout:** Left sidebar (room list, collapsible on mobile), center feed (compact Reddit-style cards), right sidebar (room info / online count).
- **Room selector:** Dropdown or sidebar list of `CommunityRoom`s fetched from backend.
- **Post type selector:** Text, Image, Poll, Link tabs in create-post form.
- **Poll UI:** Show options with vote counts, allow voting.
- **Nested comments:** Indent replies, show parent comment preview, collapse/expand.
- **Post types:**
  - Text: title + body
  - Image: title + image upload (Cloudinary)
  - Poll: title + 2-4 options + voting
  - Link: title + link URL + preview card

### 4.4 New Pages

**`frontend/src/pages/Dashboard.jsx`** — Student Dashboard
- Route: `/dashboard` (protected, all roles)
- Sections: Upcoming events, Recent announcements, Recent discussions (from rooms user has posted in), Quick stats (attendance % if student).
- Fetch from: `/api/events?upcoming=true`, `/api/announcements`, `/api/forum/posts?limit=5`.

**`frontend/src/pages/Projects.jsx`** — Student Projects
- Route: `/projects` (public, optionalAuth)
- Grid layout: project cards with tech stack chips, author, likes.
- Like button (upvote-style).
- Admin/approved-author can create/edit via modal or separate form.
- Filter by tech stack.

**`frontend/src/pages/Calendar.jsx`** — Academic Calendar
- Route: `/calendar` (public)
- Timeline/list view of `AcademicCalendar` entries.
- Color-coded by type (exam=red, holiday=green, etc.).
- Admin CRUD via admin panel or dedicated admin route.

**`frontend/src/pages/Announcements.jsx`** — Official Announcements
- Route: `/announcements` (public, optionalAuth)
- Visually distinct from forum: pinned banner style, category badges, priority indicator.
- Mark-as-read functionality.

**Admin pages for new features:**
- `frontend/src/pages/admin/AdminRooms.jsx` — Manage community rooms (create, edit, toggle popular, delete).
- `frontend/src/pages/admin/AdminProjects.jsx` — Approve/reject projects, view all.
- `frontend/src/pages/admin/AdminCalendar.jsx` — Manage academic calendar entries.
- `frontend/src/pages/admin/AdminAnnouncements.jsx` — Manage announcements (or extend AdminNotices with a tab).

**Update `frontend/src/pages/admin/AdminLayout.jsx`:**
- Add new links: `Rooms`, `Projects`, `Calendar`, `Announcements` (after Events or at end).

### 4.5 Navigation Updates

**`frontend/src/components/Navbar.jsx`:**
- Add links: `Community` (→ `/forum`), `Projects` (→ `/projects`), `Calendar` (→ `/calendar`).
- Update `NAV_LINKS` array.
- Replace emoji buttons with Lucide icons in mobile menu.

**`frontend/src/components/Footer.jsx`:**
- Add links under appropriate columns: Community Forum, Student Projects, Academic Calendar.
- Replace ↗ with `ExternalLink` icon.

### 4.6 Auth Context Extension

**`frontend/src/context/AuthContext.jsx`:**
- Add `isModerator` helper: `user?.role === 'cr' || user?.role === 'faculty'`.
- Add `canManageRooms` helper: `isModerator || isAdmin`.

### 4.7 Student Dashboard Route

**`frontend/src/App.jsx`:**
- Add route: `/dashboard` → `<ProtectedRoute><Dashboard /></ProtectedRoute>`.
- Optionally redirect `/students` to `/dashboard` or keep both.

---

## 5. Styling & Design Consistency

### 5.1 Tailwind Classes Standardization
- Replace ad-hoc hex colors (e.g., `bg-[#5865F2]`, `bg-[#1a1b1e]`) with existing design tokens: `bg-primary`, `bg-canvas`, `bg-soft-stone`, `text-ink`, `text-body-muted`, `border-hairline`.
- Use `font-display`, `font-sans`, `font-mono` consistently.
- Use existing `.button-primary`, `.button-secondary`, `.card` classes where possible.
- Standardize spacing: `p-6`, `gap-4`, `rounded-2xl`.

### 5.2 Forum Compact Layout Spec
- Max width: `max-w-[680px]` for center feed.
- Post cards: `bg-canvas border border-hairline rounded-2xl p-4 hover:border-slate/30 transition-colors`.
- Vote pill: `bg-soft-stone rounded-full px-2 py-1 flex items-center gap-1`.
- Action buttons: `text-body-muted hover:text-ink` with Lucide icons (`ArrowBigUp`, `ArrowBigDown`, `MessageCircle`, `Share2`).
- Typography: `text-[15px] font-medium text-ink` for titles, `text-[14px] text-body-muted` for body.
- No animations beyond subtle hover transitions. No glowing orbs, no gradient text.

### 5.3 Accessibility
- All icon-only buttons: `aria-label`.
- Color contrast: ensure text on colored backgrounds meets WCAG AA (use existing palette which is already designed for this).
- Focus states: `focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`.

---

## 6. Migration & Data Integrity

### 6.1 Existing Data
- All 19 existing models remain untouched.
- `ForumPost` and `ForumComment` are extended in-place via Mongoose schema updates.
- **Migration script required:** Populate `room` field on existing `ForumPost`s with a default "General" room after `CommunityRoom` model is created.

### 6.2 Seed Data
- Create default community rooms: `General`, `Academics`, `Coding`, `Placements`, `Hostel & Life`, `Projects & Hackathons`, `Clubs`.
- Seed 1-2 announcements and 3-5 calendar entries for demo.

### 6.3 Breaking Changes
- **None expected.** All new endpoints are additive. Existing `/api/forum` routes maintain backward compatibility (new fields are optional or have defaults).
- Frontend: existing `/forum` page is replaced, but same route. Users with bookmarks to specific post URLs should still work if deep-linking is preserved.

---

## 7. Validation Checklist

- [ ] `lucide-react` is used in every component that previously had decorative emojis.
- [ ] Zero decorative emojis remain in component JSX (only in user-generated content like post text).
- [ ] All community content (rooms, posts, comments, announcements, calendar, projects) is fetched from backend APIs.
- [ ] Existing auth flow (login, activate, forgot-password) works unchanged.
- [ ] RBAC enforces: students read/create posts, cr/faculty moderate rooms and pin posts, admin/super_admin full CRUD.
- [ ] Forum has room-based filtering and post type creation (text, image, poll, link).
- [ ] Forum supports nested comments and upvote/downvote.
- [ ] Student Dashboard shows real data (events, announcements, discussions).
- [ ] Admin Dashboard shows community stats (rooms, posts, projects, announcements).
- [ ] Site is responsive: mobile drawer works, forum sidebar collapses, admin layout stacks.
- [ ] No console/runtime errors in development build.
- [ ] Electro Infinity brand identity preserved (colors, fonts, logo treatment).

---

## 8. Implementation Order (Recommended)

1. **Backend models** (CommunityRoom, Announcement, AcademicCalendar, Project) + extend ForumPost/ForumComment.
2. **Backend routes** (forum updates, new routes for rooms, announcements, calendar, projects).
3. **Frontend API layer** (update forum.js, create rooms.js, announcements.js, calendar.js, projects.js).
4. **Emoji replacement pass** across all components (low risk, high visual impact).
5. **Forum redesign** (new layout, room sidebar, post types, nested comments).
6. **New pages** (Dashboard, Projects, Calendar, Announcements, admin pages).
7. **Navigation & routing updates** (Navbar, Footer, App.jsx, AdminLayout).
8. **Testing & validation** (manual QA, responsive check, accessibility audit).

---

## 9. Open Questions / Decisions for Implementer

1. **Poll voting:** Should a user be able to change their vote on a poll, or is it single-choice? **Recommendation:** Single-choice, toggle to deselect.
2. **Project approval:** Should projects be auto-approved for faculty/super_admin, or manually approved by admin? **Recommendation:** Auto-approve for `faculty`/`admin`/`super_admin`; manual for students/CR.
3. **Room member system:** Should users "join" rooms explicitly, or is room membership implicit (anyone can post)? **Recommendation:** Implicit for now; `members` array tracks active participants for counts only.
4. **Calendar batch scoping:** Should calendar entries be global or batch-specific? **Recommendation:** Global by default, optional `batch` field for batch-specific dates.
5. **Forum deep linking:** Should `/forum/:postId` be a dedicated route for permalinks? **Recommendation:** Yes, add `/forum/:postId` route to show single post with comments.
