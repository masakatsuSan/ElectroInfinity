# Electro Infinity — Full Stack Website
EE Club website for AGEMC. React + Express + MongoDB.

---

## Project structure
```
electro-infinity/
├── backend/                    ← Express API
│   ├── server.js               ← Entry point
│   ├── .env.example            ← Copy to .env and fill in
│   └── src/
│       ├── config/
│       │   ├── db.js           ← MongoDB connection
│       │   └── cloudinary.js   ← Cloudinary setup
│       ├── models/             ← User, Notice, Faculty, Resource, Event, Attendance
│       ├── routes/             ← auth, notices, faculty, resources, events, contact, students, attendance
│       ├── middleware/auth.js  ← JWT protect + role guard
│       └── utils/upload.js     ← Multer + Cloudinary upload helper
└── frontend/                   ← React + Vite + Tailwind
    └── src/
        ├── api/                ← axios calls per resource
        ├── components/         ← Navbar, Footer, NoticeCard, GlobalSearch, ProtectedRoute
        ├── context/            ← AuthContext (login state)
        └── pages/
            ├── Home, About, Faculty, Labs, Courses
            ├── Resources, Events, Placements, Gallery, Achievements
            ├── Contact, Login, Register
            ├── Students (dashboard), Directory
            └── admin/          ← Dashboard, Notices, Faculty, Resources, Events, Students
```

---

## Quick start

### 1. Install dependencies
```bash
cd backend  && npm install
cd ../frontend && npm install
```

### 2. Set up MongoDB Atlas
1. [mongodb.com/atlas](https://mongodb.com/atlas) → Create free M0 cluster
2. Connect → Drivers → copy connection string
3. Paste into `backend/.env` as `MONGO_URI`

### 3. Set up Cloudinary
1. [cloudinary.com](https://cloudinary.com) → free account
2. Dashboard → copy Cloud Name, API Key, API Secret
3. Paste into `backend/.env`

### 4. Set up Gmail for contact form
1. Google Account → Security → 2-Step Verification → App Passwords
2. Generate an App Password for "Mail"
3. Paste into `backend/.env` as `EMAIL_USER` and `EMAIL_PASS`

### 5. Fill in .env
```bash
cd backend
cp .env.example .env
# Open .env and fill in all values
```

Generate JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 6. Run both servers
```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open http://localhost:5173

### 7. Create your admin account
```
POST http://localhost:5000/api/auth/register
{
  "name": "Your Name",
  "email": "admin@email.com",
  "password": "yourpassword"
}
```
Then in MongoDB Atlas → Browse Collections → users → find your user → change:
- `role` → `"super_admin"`
- `isVerified` → `true`

---

## All API routes

| Method | Route | Access |
|--------|-------|--------|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| GET | /api/auth/me | Logged in |
| PATCH | /api/auth/me | Logged in |
| GET | /api/notices | Public |
| POST | /api/notices | Faculty+ |
| PATCH | /api/notices/:id/pin | Admin |
| DELETE | /api/notices/:id | Faculty(own)/Admin |
| GET | /api/faculty | Public |
| POST | /api/faculty | Admin |
| PATCH | /api/faculty/:id | Admin |
| DELETE | /api/faculty/:id | Admin |
| GET | /api/resources | Public |
| POST | /api/resources | Faculty+ |
| GET | /api/resources/:id/download | Public |
| DELETE | /api/resources/:id | Faculty(own)/Admin |
| GET | /api/events | Public |
| POST | /api/events | Admin |
| PATCH | /api/events/:id | Admin |
| DELETE | /api/events/:id | Admin |
| POST | /api/contact | Public |
| GET | /api/students | Faculty+ |
| GET | /api/students/pending | Admin |
| GET | /api/students/batches | Faculty+ |
| PATCH | /api/students/:id/verify | Admin |
| PATCH | /api/students/:id/reject | Admin |
| PATCH | /api/students/me/photo | Logged in |
| POST | /api/attendance/mark | Faculty+ |
| GET | /api/attendance/my | Logged in |
| GET | /api/attendance/class | Faculty+ |
| GET | /api/attendance/report | Faculty+ |

---

## Deploy

### Frontend → Vercel (free)
```bash
# Install Vercel CLI
npm i -g vercel

cd frontend
vercel
# Follow prompts — set root to frontend, framework to Vite
```

Or: Push to GitHub → vercel.com → Import repo → root directory = `frontend`

### Backend → Render (free)
1. Push to GitHub
2. render.com → New Web Service → connect repo
3. Root directory: `backend`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add all `.env` variables in Render's Environment tab
7. Update `CLIENT_URL` to your Vercel URL

### After deploying
Update `backend/.env` on Render:
```
CLIENT_URL=https://your-site.vercel.app
```

Update frontend to point to backend:
Create `frontend/.env.production`:
```
VITE_API_URL=https://your-backend.onrender.com
```

---

## Phase status
- ✅ Phase 1 — Foundation (auth, notices, faculty, 3 pages)
- ✅ Phase 2 — Core content (Cloudinary, admin panel, 5 new pages)
- ✅ Phase 3 — Student features (dashboard, attendance, directory)
- ✅ Phase 4 — Polish (placements, gallery, achievements, global search, deploy)
