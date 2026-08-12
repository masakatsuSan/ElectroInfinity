# Electro Infinity

Electro Infinity is the digital hub for the Electrical Engineering community at **Alipurduar Government Engineering and Management College (AGEMC)**. It combines a public-facing department website with a secure academic workspace where students, Class Representatives (CRs), and administrators can share information, organise academic work, and stay connected.

The project is a full-stack JavaScript application: a React single-page frontend powered by Vite, and an Express/MongoDB API. It is more than a static college site: public visitors can explore the department, while authenticated users receive information and tools appropriate to their batch and role.

## What the platform provides

### Public department experience

- Department overview, faculty, laboratories, courses and detailed subject syllabi.
- Department news, events, study resources, gallery, achievements and placement highlights.
- A contact form for enquiries.
- Responsive navigation and page transitions built with Tailwind CSS and Framer Motion.

### Academic workspace

- Student account activation using a pre-created roll number, then sign-in with roll number and password.
- Email OTP password recovery for activated student and CR accounts.
- Batch-aware notices, events and resources, so students see their own material and content published for everyone.
- Student dashboard for deadlines, assignments, routines and academic updates.
- A protected forum where authenticated users can create posts, comment and upvote.
- Profile photo upload and student directory tools.

### Role-based administration

| Role | Main responsibilities |
| --- | --- |
| Student | Activates their account, accesses batch content, follows deadlines/routines and participates in the forum. |
| CR | Publishes and manages notices, events, resources, deadlines, assignments and routines for their own batch. |
| Admin | Manages the whole platform, including students, content, deadlines and routines across batches. |

The admin area is available at `/admin`; CRs use the same area with restricted, batch-scoped controls.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite, React Router, Tailwind CSS |
| UI and motion | Framer Motion, Lenis |
| API | Node.js, Express |
| Database | MongoDB with Mongoose |
| Authentication | JSON Web Tokens and bcryptjs |
| File hosting | Cloudinary with Multer |
| Email | Nodemailer using Gmail SMTP |

## Project structure

```text
electro-infinity/
+-- frontend/                 # React + Vite client
|   +-- public/               # Static images
|   `-- src/
|       +-- api/              # Axios API clients
|       +-- components/       # Shared UI and route guards
|       +-- context/          # Authentication and theme state
|       +-- data/             # Course and syllabus data
|       `-- pages/            # Public, student, forum and admin screens
+-- backend/                  # Express API
|   +-- server.js             # API entry point
|   +-- seed_users.js         # Local demo-account seed script
|   `-- src/
|       +-- config/           # MongoDB and Cloudinary configuration
|       +-- middleware/       # Authentication and role checks
|       +-- models/           # MongoDB schemas
|       +-- routes/           # API route handlers
|       `-- utils/            # Upload helpers
`-- pdfExtract/               # Small standalone PDF-extraction utility
```

## Run locally

### Prerequisites

- Node.js 18 or newer
- A MongoDB database (MongoDB Atlas or a local MongoDB instance)
- A Cloudinary account for resource and profile-image uploads
- A Gmail account with an App Password if contact emails and OTP recovery are required

### 1. Install dependencies

Install each application separately:

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
CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_TO=recipient-address@gmail.com
```

Generate a suitable JWT secret with:

```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

`EMAIL_TO` is optional; when it is not set, contact-form messages are sent to `EMAIL_USER`.

### 3. Start the API and client

```powershell
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd frontend
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`. During development, Vite forwards `/api` requests to `http://localhost:5000`. Confirm the API is running at `http://localhost:5000/api/health`.

### 4. Optional: add local demo users

After MongoDB is configured, run:

```powershell
cd backend
node seed_users.js
```

This creates sample student, CR and admin accounts for local testing. Use a disposable development database: the script creates fixed records and does not check for duplicates first.

## Main API areas

| Base path | Purpose |
| --- | --- |
| `/api/auth` | Account activation, login, profile, password change and OTP reset. |
| `/api/notices` | Batch-aware notices and admin pinning. |
| `/api/resources` | Study-resource listing, upload and download. |
| `/api/events` | Event publishing and management. |
| `/api/deadlines` | Batch deadlines and submissions. |
| `/api/assignments` | Batch assignments. |
| `/api/routines` | Batch class routines. |
| `/api/students` | Student creation, import, listing and profile photo upload. |
| `/api/forum` | Authenticated discussions, comments and upvotes. |
| `/api/contact` | Contact-form email delivery. |

Protected requests use `Authorization: Bearer <token>`. The frontend stores the session token locally and attaches it automatically to its API requests.

## Deployment notes

Deploy the frontend as a Vite static site (such as Vercel or Netlify) and the backend as a Node web service (such as Render). Set the production frontend URL in the backend's `CLIENT_URL`, then configure a rewrite/proxy or API base URL so production frontend requests reach the deployed API.

Never commit `backend/.env`, database credentials, Cloudinary credentials, Gmail App Passwords or JWT secrets.

## Available scripts

| Location | Command | Description |
| --- | --- | --- |
| `frontend` | `npm run dev` | Start the Vite development server. |
| `frontend` | `npm run build` | Build the production frontend. |
| `frontend` | `npm run preview` | Preview a production build locally. |
| `backend` | `npm run dev` | Start the API with Nodemon. |
| `backend` | `npm start` | Start the API with Node.js. |
| `backend` | `node seed_users.js` | Seed local demo users. |
