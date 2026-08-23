# Electro Infinity

Electro Infinity is the official digital platform for the Electrical Engineering department at **Alipurduar Government Engineering and Management College (AGEMC)**. It combines a polished public department website with a secure, role-based academic workspace for students, Class Representatives (CRs), faculty, and administrators.

It is a full-stack JavaScript application: a React single-page frontend (Vite) backed by an Express + MongoDB REST API. Visitors explore the department publicly, while authenticated users get content and tools scoped to their batch and role.

---

## Table of contents

- [Features](#features)
- [User roles & permissions](#user-roles--permissions)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Achievements categories](#achievements-categories)
- [API reference](#api-reference)
- [Admin & CR console](#admin--cr-console)
- [Attendance & geofencing](#attendance--geofencing)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Security & secrets](#security--secrets)

---

## Features

### Public department experience
- Department overview, **About** page, faculty profiles, laboratories, and course/subject syllabi.
- Department **Announcements**, **Events / Academic Calendar**, study **Resources**, **Gallery**, and **Projects**.
- **Achievements** ("Pride of the Department") split into Student Achievements, Faculty Achievements, and Awards & Certificates.
- **Placements** highlights and a public **Contact** form.
- Smooth scrolling (Lenis), animated page transitions (Framer Motion), and a fully responsive layout (Tailwind CSS).

### Academic workspace (authenticated)
- **Account activation** with a pre-created roll number, then login with roll number + password.
- **Email OTP password recovery** for activated student and CR accounts.
- Batch-aware **Notices**, **Events**, **Resources**, **Deadlines**, **Assignments**, and **Routines** — students see both their own batch's content and content published for "all".
- Personal **Dashboard** surfacing deadlines, assignments, routines, and recent updates.
- A protected **Forum** where authenticated users create posts, comment, and upvote.
- **Student directory** and profile photo upload.

### Administration
- A single admin console (`/admin`) used by both **Admins** and **CRs** (CRs see a restricted, batch-scoped subset).
- Full CRUD over students, faculty, labs, courses, community rooms, announcements, resources, calendar, projects, gallery, achievements, deadlines, routines, attendance, and contact entries.
- Image/document uploads to Cloudinary.

### Attendance & geofencing
- Faculty can run attendance sessions; students mark attendance from the student attendance screen.
- Optional **geofence** validation restricts where attendance can be marked (see `backend/src/utils/geofence.js`).

---

## User roles & permissions

| Role | Capabilities |
| --- | --- |
| `student` | Activates account, logs in, accesses batch-scoped content, dashboard, forum, and student attendance. |
| `cr` | Everything a student can do, plus a restricted admin console limited to: Labs, Community Rooms, Announcements, Resources, Calendar, Gallery, and Deadlines. |
| `faculty` | Faculty dashboard, faculty attendance view, and attendance session management. |
| `admin` | Full access to every admin section and all management endpoints. |

Authentication uses JWTs stored on the client and sent as `Authorization: Bearer <token>`. Route protection is enforced by `protect` (login required) and `guard(...roles)` (role required) middleware on the backend, plus `ProtectedRoute` on the frontend.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite, React Router, Tailwind CSS |
| UI / motion | Framer Motion, Lenis |
| API | Node.js, Express |
| Database | MongoDB with Mongoose |
| Authentication | JSON Web Tokens (jsonwebtoken) + bcryptjs |
| File hosting | Cloudinary with Multer |
| Email | Brevo transactional email API |
| Testing | Jest-compatible unit tests under `backend/tests` (add `jest` to run) |

---

## Project structure

```text
electro-infinity/
├── frontend/                       # React + Vite client
│   ├── public/                     # Static assets
│   └── src/
│       ├── api/                    # Axios API clients (one per resource)
│       ├── components/             # Shared UI, route guards, navbar/footer
│       ├── context/               # Auth, theme, and forum-flip state
│       ├── data/                  # Course / syllabus source data
│       └── pages/                 # Public, auth, student, forum, attendance,
│           ├── admin/             #   and admin screens (incl. AdminLayout)
│           └── attendance/        #   faculty/student attendance screens
├── backend/                        # Express API
│   ├── server.js                   # API entry point
│   ├── seed_users.js               # Local demo-account seed script
│   ├── scripts/                    # One-off maintenance scripts
│   │   └── migrateAchievementCategories.js
│   ├── tests/                      # Jest unit tests
│   └── src/
│       ├── config/                 # DB and Cloudinary configuration
│       ├── middleware/             # Auth (protect/guard/optionalAuth)
│       ├── models/                 # Mongoose schemas
│       ├── routes/                 # API route handlers
│       ├── services/               # Business logic (e.g. attendance sessions)
│       └── utils/                  # Upload, geofence, student-access helpers
└── pdfExtract/                     # Standalone PDF-extraction utility
```

---

## Getting started

### Prerequisites
- Node.js 18 or newer
- A MongoDB database (MongoDB Atlas or a local instance)
- A Cloudinary account for image/document uploads
- A Brevo account and API key (for contact emails and OTP password recovery)

### 1. Install dependencies

```powershell
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure the backend

Create `backend/.env` with values for your environment:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

BREVO_API_KEY=your-brevo-api-key
EMAIL_USER=verified-sender@example.com
EMAIL_TO=recipient-address@gmail.com
```

Generate a strong JWT secret with:

```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

`EMAIL_TO` is optional; when unset, contact-form messages are sent to `EMAIL_USER`.

### 3. Start the API and client

```powershell
# Terminal 1 — API
cd backend
npm run dev

# Terminal 2 — Client
cd frontend
npm run dev
```

### 4. Optional: add local demo users

After MongoDB is configured, run:

```powershell
cd backend
node seed_users.js
```

This creates sample student, CR, faculty, and admin accounts for local testing. Use a disposable development database — the script creates fixed records and does not de-duplicate.

---

## Achievements categories

Achievements are organized into three sections that map 1:1 to a `category` field on each record:

| `category` value | Public section |
| --- | --- |
| `student` | Student Achievements |
| `faculty` | Faculty Achievements |
| `awards` | Awards & Certificates |

The admin console lets you pick the target section directly when creating or editing an achievement. The public Achievements page filters by these three values.

**Data migration:** older records used different category values (`academic`, `sports`, `cultural`, `other`). If you are upgrading an existing database, run the one-off migration to remap them:

```powershell
cd backend
node scripts/migrateAchievementCategories.js
```

Mapping: `academic`/`sports` → `student`, `cultural` → `awards`, `other` → `faculty` (with a catch-all that moves anything else to `student`).

---

## API reference

All routes are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

| Base path | Purpose | Typical guards |
| --- | --- | --- |
| `/api/auth` | Account activation, login, profile, password change, OTP reset. | `protect` / public |
| `/api/notices` | Batch-aware notices and admin pinning. | `protect`, `guard('admin','cr',...)` |
| `/api/resources` | Study-resource listing, upload, download. | `protect` |
| `/api/events` | Event publishing and management. | `protect` / `admin` |
| `/api/deadlines` | Batch deadlines and submissions. | `protect` |
| `/api/assignments` | Batch assignments. | `protect` |
| `/api/routines` | Batch class routines. | `protect` |
| `/api/students` | Student creation, import, listing, profile photo upload. | `admin` |
| `/api/faculty` | Faculty profiles and management. | `admin` / `faculty` |
| `/api/forum` | Authenticated discussions, comments, upvotes. | `protect` |
| `/api/contact` | Contact-form email delivery. | public |
| `/api/placements` | Placement highlights and management. | `admin` |
| `/api/labs` | Laboratory information and management. | `admin` / `cr` |
| `/api/courses` | Course and subject syllabi management. | `admin` |
| `/api/rooms` | Community rooms management. | `admin` / `cr` |
| `/api/projects` | Student/project showcase management. | `admin` |
| `/api/gallery` | Gallery content and management. | `admin` / `cr` |
| `/api/achievements` | Department achievements (categories above). | `admin` |
| `/api/calendar` | Academic calendar management. | `admin` / `cr` |
| `/api/attendance` | Attendance sessions, marking, and records. | `admin` / `faculty` / `student` |
| `/api/announcements` | Announcements management. | `admin` / `cr` |
| `/api/admin` | Aggregate admin endpoints (stats, etc.). | `admin` |

Exact role requirements vary per route; check `backend/src/routes/*` and `backend/src/middleware/auth.js` for details.

---

## Admin & CR console

Reach the console at `/admin`. After login, Admins see every section; CRs are restricted to their allowed sections (Labs, Community Rooms, Announcements, Resources, Calendar, Gallery, Deadlines) both in the sidebar and via a deep-link guard.

Console sections: Overview, Attendance & Faculty, Faculty Directory, Students, Laboratories, Courses, Community Rooms, Announcements, Resources, Academic Calendar, Projects, Gallery, Achievements, Deadlines, Routine, and Contacts.

---

## Attendance & geofencing

- Faculty start an attendance session; the session lifecycle is managed in `backend/src/services/attendanceSession.js`.
- Students mark attendance via `/attendance/student` (role `student`/`cr`).
- `backend/src/utils/geofence.js` provides optional location validation so attendance can be restricted to a campus area. `backend/src/utils/studentAccess.js` centralizes student data-access rules.

A Jest-compatible unit test exists at `backend/tests/studentAccess.test.js`; add `jest` as a dev dependency and a `test` script to run it.

---

## Scripts

| Location | Command | Description |
| --- | --- | --- |
| `frontend` | `npm run dev` | Start the Vite development server. |
| `frontend` | `npm run build` | Build the production frontend. |
| `frontend` | `npm run preview` | Preview a production build locally. |
| `backend` | `npm run dev` | Start the API with Nodemon (auto-reload). |
| `backend` | `npm start` | Start the API with Node.js. |
| `backend` | `node seed_users.js` | Seed local demo users. |
| `backend` | `node scripts/migrateAchievementCategories.js` | Remap legacy achievement categories. |

---

## Deployment

- **Frontend:** build with `npm run build` and deploy the static output (e.g. Vercel or Netlify).
- **Backend:** deploy as a Node web service (e.g. Render) and set all `backend/.env` variables in the host's environment.
- Set the production frontend URL in `CLIENT_URL`, and configure the frontend's API base URL / proxy so production requests reach the deployed API.

---

## Security & secrets

- **Never commit** `backend/.env`, database URIs, Cloudinary credentials, Brevo API keys, or JWT secrets.
- Use a long, random `JWT_SECRET` in every environment.
- Keep `seed_users.js` for local development only; do not run it against production data.
- Role checks are enforced server-side via `guard(...roles)` — frontend route restrictions are a UX layer, not a security boundary.
