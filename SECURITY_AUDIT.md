# SECURITY_AUDIT.md — College Connect (ElectroInfinity)

Audit date: 2026-10-05 · Branch: `security-hardening`
Scope: `backend/` (Express + MongoDB), `frontend/` (React + Vite), git history, dependencies.

Legend: **C**ritical · **H**igh · **M**edium · **L**ow. "Fix" column: ✅ fixed in this branch · 📋 needs manual action · ⚠️ accepted/remaining risk.

---

## 1. Authentication & Sessions

| # | Sev | Location | Issue | Exploitation | Fix |
|---|-----|----------|-------|--------------|-----|
| A1 | **C** | `backend/src/routes/auth.js:471-473` | `/api/auth/activate` accepts `rollNumber + password` with **no activation token** whenever `user.otp` exists — the OTP is never verified on that path | Anyone who knows a student's roll number calls `GET /check-roll/:rollNo` (which creates an OTP), then `POST /activate` with their own password → full account takeover of any pending student/CR account | ✅ Activation now requires a valid single-use activation token (or a verified OTP claim); OTP is hashed and checked |
| A2 | **C** | `backend/src/routes/auth.js:11-15`, `backend/.env:2` | JWT secret is a patterned hex string (not random), access token lives **7 days**, no explicit algorithm, no issuer check, no refresh rotation | Secret is guessable/weak; a stolen token is valid for 7 days; algorithm confusion ("none") not explicitly rejected | ✅ `src/utils/tokens.js`: HS256 explicit, issuer `college-connect`, 15-min access token, 7-day rotating refresh tokens (single-use, reuse detection revokes the family) |
| A3 | **H** | `frontend/src/context/AuthContext.jsx:31`, `frontend/src/api/axios.js:17` | JWT stored in `localStorage` (`ei_token`) | Any XSS exfiltrates the token → persistent account takeover | ✅ Tokens now in httpOnly/secure/sameSite cookies; frontend no longer stores the token |
| A4 | **H** | `backend/src/routes/auth.js:824-856` | Login has **no rate limiting** and returns distinguishable errors (`Roll number not found` vs `Wrong credentials`); no lockout | Credential brute-force + account enumeration (roll numbers are semi-public) | ✅ `authLimiter` (10/15min/IP) + exponential slow-down; single generic `Invalid email or password`; password checked before activation state |
| A5 | **H** | `backend/src/models/User.js:71` | OTP stored **plaintext** in DB; `logOtpForDev` prints live OTPs to the console when `OTP_DEBUG=1` | DB read or log access → OTP theft → account takeover | ✅ OTP stored bcrypt-hashed (`otpHash`); OTP console logging removed |
| A6 | **H** | `backend/src/routes/auth.js` (whole file) | No session invalidation on password change; no server-side logout; no token versioning | A stolen token survives password changes forever | ✅ `User.tokenVersion` claim checked on every request; password change/reset bumps it and deletes all refresh tokens; `POST /api/auth/logout` revokes the refresh token |
| A7 | **H** | `backend/src/middleware/auth.js:24-30` | `protect` doesn't check `isActive` — deactivated users keep access until token expiry | A banned/deactivated user (e.g. fired faculty) keeps full access | ✅ `protect` rejects `isActive === false` |
| A8 | **M** | `backend/src/routes/auth.js:440,503,742,784,872` | Password policy is "6 characters" | Weak passwords across the whole app | ✅ 8–128 chars, ≥3 of 4 character classes, checked on activate/reset/register/change/admin-create |
| A9 | **M** | `backend/src/routes/auth.js:349-390,546-578,621-675` | `check-roll` / `check-faculty` / `forgot-password` return 404 with "not found" for unknown identifiers → enumeration; `forgot-password` leaks the masked email | Attacker enumerates which roll numbers/emails have accounts | ✅ Generic responses ("If an account exists… an OTP has been sent"); no masked email in the response |
| A10 | **M** | `backend/src/routes/auth.js:889-914` | `PATCH /api/auth/me` writes allowlisted fields but with no type/length validation; returns the full user doc (incl. OTP metadata) | Stored XSS via oversized/odd-typed fields; info leak | ✅ Zod-style validation + length caps; response is a minimal projection |
| A11 | **L** | `backend/src/routes/auth.js:195-210` | `findUserByEmail` builds `$regex` from input (escaped, but unnecessary) | — | ✅ Replaced with plain equality on both mailboxes (both are `lowercase: true`) |

## 2. Authorization (Broken Access Control / IDOR)

| # | Sev | Location | Issue | Exploitation | Fix |
|---|-----|----------|-------|--------------|------|
| B1 | **C** | `backend/src/routes/attendance.js:517-527` | `GET /api/attendance/sessions/:id/roster` — any authenticated user can pull any session's full roster (names, emails, roll numbers) | IDOR: iterate session ObjectIds → harvest the whole student body's attendance + PII | ✅ Same authz as `/feed`: session faculty owner, admin/super_admin, or CR of the same batch |
| B2 | **C** | `backend/src/routes/attendance.js:567-594` | `GET /sessions/active/batch` returns the **full Session document** to students, including `currentQrToken`, `centerLat`, `centerLng`, `centerAccuracy` | Student reads the live QR token off the API (no screen needed) and copies the faculty GPS anchor → attendance fraud at scale | ✅ Projection selects only safe fields; QR/geofence fields never leave the server |
| B3 | **C** | `backend/src/config/socket.js:45-47` | `join_channel` has **no authorization** — any authenticated socket joins any channel room and receives all messages | Any student reads admin/faculty-only channels in real time | ✅ Channel looked up; `allowedRoles` must include the user's role before joining |
| B4 | **H** | `backend/src/routes/projects.js:142` | `POST /api/projects` does `Project.create(req.body)` — client can set `isApproved:true`, `pinned:true`, `likes`, `author` | Self-approval of projects, pinning, like manipulation | ✅ Field whitelist; `author` forced from session; `isApproved` defaults false |
| B5 | **H** | `backend/src/routes/calendar.js:77,119` | `AcademicCalendar.create(req.body)` / `Object.assign(entry, req.body)`; PATCH/DELETE have no ownership check | CR injects `createdBy`, edits/deletes faculty/admin entries | ✅ Whitelist on create; non-admin must own the entry |
| B6 | **H** | `backend/src/routes/deadlines.js:44,92` | `Deadline.create(req.body)` / `findByIdAndUpdate(id, req.body)` — client can set `submittedBy`, `postedBy`, `batch` | Fake submissions, reassigning deadlines to other batches | ✅ Whitelist; CR forced to own batch/section |
| B7 | **H** | `backend/src/routes/assignments.js:49` | `Assignment.create(req.body)` | CR/admin can set arbitrary fields | ✅ Whitelist |
| B8 | **H** | `backend/src/routes/faculty.js:20,30` | `Faculty.create(req.body)` / `findByIdAndUpdate(id, req.body)` | Mass assignment on the faculty directory | ✅ Whitelist |
| B9 | **H** | `backend/src/routes/profile.js:293` | `Badge.create(req.body)` (admin-only but unwhitelisted) | Mass assignment | ✅ Whitelist |
| B10 | **H** | `backend/src/routes/profile.js:484-512` | `POST /profile/:userId/badges` allows `isSelf` — users award themselves any badge | Self-awarding badges | ✅ Admin/super_admin only |
| B11 | **H** | `backend/src/routes/gallery.js:109-143` | `POST /api/gallery` is `protect`-only — any student publishes **approved** gallery photos | Unreviewed content on a public page | ✅ `guard('admin','super_admin','faculty')` |
| B12 | **H** | `backend/src/routes/labs.js:17,48,83` | CRs can create/edit/delete global Labs content | Batch-level student reps modify public curriculum pages | ✅ Removed `'cr'` from guards |
| B13 | **H** | `backend/src/routes/admin.js:10` | CRs can read admin dashboard stats | Student reps see platform-wide counts | ✅ Removed `'cr'` |
| B14 | **H** | `backend/src/routes/attendance.js:448-464` | CR of batch A can read the live roster of batch B's session | Cross-batch PII | ✅ CR must match `session.batch` |
| B15 | **H** | `backend/src/routes/attendance.js:238-252` | Faculty with **empty** `teachingAssignments` bypasses the assignment check entirely | Any faculty starts sessions for any batch/subject | ✅ Default-deny: a matching assignment is required |
| B16 | **H** | `backend/src/routes/attendance.js:638-643` | QR check only rejects when `currentQrToken` is set — empty token accepts **any** token | After a restart (timers lost) any token scans in | ✅ Fail closed: missing token → reject |
| B17 | **H** | `backend/src/routes/projects.js:81-94` | `GET /api/projects/:id` returns **unapproved drafts** to anyone who guesses the ObjectId | Sequential-ID enumeration of private student projects | ✅ Non-staff get 404 unless `isApproved` |
| B18 | **H** | `backend/src/routes/students.js:62` | `/api/students/all` exposes every student's **email** cross-batch to any student/CR | PII harvest | ✅ `email` removed from projection |
| B19 | **H** | `backend/src/routes/profile.js:49-133` | `/api/profile/search` is public, returns `email`, unescaped `department`/`batch` regex, uncapped `limit` | Unauthenticated email harvest + ReDoS + unbounded DB load | ✅ Escaped regex, email dropped, `limit` capped at 100 |
| B20 | **M** | `backend/src/routes/attendance.js:177-184` | `GET /api/attendance/rooms` exposes every room's GPS geofence center to all users | Geofence anchors public → easier location spoofing | ✅ `guard('admin','super_admin','faculty')` |
| B21 | **M** | `backend/src/routes/resources.js:253-275` | `POST /api/resources/:id/download/increment` unauthenticated | Download-count inflation | ✅ Strict per-IP rate limit |
| B22 | **M** | `backend/src/routes/friends.js:224-251`, `backend/src/routes/profile.js:445-481` | Public friend-list and QR endpoints leak names/rollNumbers/`lastActive` | PII enumeration | ⚠️ Accepted: profile data is public-by-design in this app; `lastActive` exposure noted as remaining risk |
| B23 | **M** | `frontend/src/components/ProtectedRoute.jsx:50-76` | Admin UI gated only by client-side `user.role` from localStorage | Forged `ei_user` unlocks admin UI (server still enforces) | ✅ Token no longer in localStorage; all admin APIs re-verified server-side (B4–B13) |

## 3. Injection

| # | Sev | Location | Issue | Fix |
|---|-----|----------|-------|------|
| C1 | **C** | `backend/server.js:23-24` (whole app) | No `express-mongo-sanitize`; Express's default `qs` parser turns `?type[$ne]=x` into objects that flow into Mongoose queries (`announcements.js:119`, `calendar.js:22-24`, `deadlines.js:17-22`, `folders.js:130`, `resources.js:115-119`, `yt-lectures.js:27-29`, `subjects.js:100`) | ✅ `express-mongo-sanitize` globally + query params coerced to strings/enum allowlists |
| C2 | **H** | `backend/src/routes/achievements.js:91-94`, `folders.js:133`, `network.js:22-28`, `profile.js:71,79` | Unescaped user input into `$regex`/`new RegExp` → ReDoS | ✅ All regex inputs escaped (`escapeRegex` helper) |
| C3 | **M** | `backend/src/routes/attendance.js:598-832` | Client-controlled `accuracy`/`stationary` feed the confidence score; geofence slack inflated by reported accuracy | ✅ `accuracy` capped at 100m, slack capped at 100m, per-user rate limit on `/scan` |
| C4 | **L** | whole repo | No `eval`/`new Function`/shell exec with user input found | ✅ Verified by grep (see Phase 3) |

## 4. XSS & Output Safety

| # | Sev | Location | Issue | Fix |
|---|-----|----------|-------|------|
| D1 | **M** | `frontend/src/components/ActivityTimeline.jsx:47`, `Announcements.jsx:156,260`, `FileUpload.jsx:175`, `blog/Spans.jsx:34`, `ProfileGrid.jsx:57-67`, `AdminProjects.jsx:50`, `Projects.jsx:190,203`, `ProjectDetails.jsx:133,145`, `Profile.jsx:1094+`, `Students.jsx:220` | `href={userControlledValue}` with no scheme check → `javascript:` URL XSS | ✅ `isSafeHttpUrl()` helper applied to all dynamic hrefs/srcs |
| D2 | **M** | `frontend/src/components/blog/TipTapEditor.jsx:355-358` | Link insertion via `window.prompt` accepts any URL scheme | ✅ Validated to http/https before `setLink` |
| D3 | **L** | `frontend/src/components/blog/TipTapEditor.jsx:170` | `innerHTML` with a **static** SVG string (no user data) | ✅ Verified static; no `dangerouslySetInnerHTML` anywhere in the app |
| D4 | **M** | `backend/server.js` | No CSP/HSTS/X-Frame-Options/Referrer-Policy; `x-powered-by` on | ✅ `helmet` with strict CSP (also added to `vercel.json` for the SPA), HSTS, noSniff, frameguard; `x-powered-by` disabled |
| D5 | **L** | `frontend` | All 31 `target="_blank"` already carry `rel="noreferrer"`/`noopener` | ✅ Verified; no change needed |

## 5. HTTP & Server Hardening

| # | Sev | Location | Issue | Fix |
|---|-----|----------|-------|------|
| E1 | **H** | `backend/server.js` | No global rate limit, no body-size limit, no `hpp`, no compression, no request timeouts, no unhandled-rejection handlers, error handler logs `err.stack` | ✅ All added (see `server.js`): 300 req/min global, 100kb JSON, `hpp`, `compression`, 30s request timeout, generic 500 in prod, structured logging |
| E2 | **H** | `backend/server.js:12-22` | CORS reads `CLIENT_URL` but `.env` defines `FRONTEND_URL` → falls back to a hardcoded vercel origin | ✅ `ALLOWED_ORIGINS`/`FRONTEND_URL` from env, explicit list, credentials on, no wildcard |
| E3 | **H** | `backend/src/config/socket.js:10-13` | Socket.IO CORS `origin: true` fallback reflects any origin | ✅ Explicit allowlist from env |
| E4 | **H** | — | No CSRF protection once auth is cookie-based | ✅ Double-submit CSRF (`csrf_token` cookie + `X-CSRF-Token` header) on all state-changing requests that authenticate via cookie; Bearer clients exempt |
| E5 | **M** | `backend/server.js` | No env validation — server boots with missing/placeholder secrets | ✅ `src/config/env.js` fails fast on missing `MONGO_URI`/`JWT_SECRET`, weak/short secrets, placeholder values |
| E6 | **M** | `backend/src/config/db.js` | Connect failure exits(1) but logs nothing structured | ✅ Structured logger |

## 6. File Uploads

| # | Sev | Location | Issue | Fix |
|---|-----|----------|-------|------|
| F1 | **H** | `backend/src/utils/upload.js:13-22` | MIME check trusts the client-supplied `Content-Type`/extension only | ✅ Magic-byte validation via `file-type` on every upload (pdf/jpg/png/webp allowlist) |
| F2 | **M** | `backend/src/utils/upload.js` | 20MB limit, memory storage, filenames sanitized — OK; uploads served via Cloudinary (non-executable) | ✅ Verified; `Content-Disposition` + `X-Content-Type-Options` set on streamed responses |
| F3 | **M** | `backend/src/routes/posts.js:39` | Blog image upload is admin-only ✅ but had no magic-byte check | ✅ Covered by F1 |

## 7. SSRF (found during audit)

| # | Sev | Location | Issue | Fix |
|---|-----|----------|-------|------|
| G1 | **C** | `backend/src/routes/gallery.js:80,174-176` | Server fetches user-supplied `imageUrl` (`axios.get`) — only protocol checked | Any authenticated user makes the server fetch `http://169.254.169.254/…`, internal APIs | ✅ `imageUrl` must be a Cloudinary delivery URL (`isCloudinaryUrl`) |
| G2 | **C** | `backend/src/routes/projects.js:116,192` | Same pattern for project `images`/`thumbnail` | ✅ Same Cloudinary-host allowlist before any server-side fetch |

## 8. Database & Secrets

| # | Sev | Location | Issue | Fix |
|---|-----|----------|-------|------|
| H1 | **C** | `backend/.env` (on disk, OneDrive-synced) | Live credentials present: MongoDB Atlas user/password, Cloudinary API key+secret, Brevo API key, YouTube API key, and a weak patterned `JWT_SECRET` | ✅ All must be **rotated** (see SECURITY.md). `.env` is gitignored and was never committed (verified via GitHub API + reflog); `.env.example` updated with placeholders |
| H2 | **H** | `backend/seed_users.js:9,65-77` | Hardcoded password `12345678` for every seeded user incl. admin, printed to console | ✅ Random per-user password generated once, printed only in dev |
| H3 | **M** | `backend/src/models/User.js` | `password` is `select:false` ✅; OTP fields were returned in API responses | ✅ OTP fields excluded from all responses; `tokenVersion` added |
| H4 | **M** | root `package-lock.json` | Orphaned empty lockfile at repo root (no root package.json) | ✅ Deleted |

## 9. Dependencies & Supply Chain

| # | Sev | Location | Issue | Fix |
|---|-----|----------|-------|------|
| I1 | **H** | both `package.json` | `axios` 1.0.0–1.19.0: 12 advisories (prototype pollution, ReDoS, SSRF via redirects, header injection) | ✅ Upgraded to patched 1.x |
| I2 | **M** | backend | Unused deps: `zod`, `@getbrevo/brevo` (Brevo is called via raw axios) | ✅ Removed |
| I3 | **M** | frontend | Unused dep: `uuid` (no imports found) | ✅ Removed |
| I4 | **M** | frontend | Outdated: `vite` 5.3→5.4.21, `tailwindcss`→3.4.19, `react-router-dom`→6.30.6, `happy-dom`→20.14.5, `nodemon`→3.1.14, `braces`→3.0.3 | ✅ Upgraded |
| I5 | **M** | frontend | Remaining advisories need **major** bumps: `vitest`→5, `vite`→8, `tailwindcss`→4, `react-router`→7, `braces`→4 | ⚠️ Remaining risk — dev/build tooling only (not shipped); `react-router` moderate (open-redirect via backslash) needs a v7 migration with manual testing |
| I6 | **L** | both | Lockfiles committed ✅ (pinned) | ✅ Verified |

## 10. Business Logic (attendance / QR / forms)

| # | Sev | Location | Issue | Fix |
|---|-----|----------|-------|------|
| J1 | **H** | `backend/src/services/attendanceSession.js` | Session timers are in-memory — a restart leaves sessions `active` forever with a stale QR token (compounds B16) | ✅ Stale-session sweep: sessions older than `durationMinutes + 30m` grace are auto-ended on read; `/scan` fails closed |
| J2 | **M** | `backend/src/routes/contact.js:10-67` | Public contact form sends a Brevo email per request, no rate limit | ✅ Per-IP rate limit (5/hour) + input length caps |
| J3 | **M** | `backend/src/routes/attendance.js:168-173` | Legacy `POST /api/attendance/faculty` re-dispatches into itself via `router.handle` → infinite recursion → 500 | ✅ Refactored to call the create handler directly |
| J4 | **M** | `backend/src/routes/attendance.js:644` | 10s grace after QR expiry widens the replay window | ✅ Reduced to 5s |
| J5 | **L** | signup/public forms | No CAPTCHA; mitigated by strict rate limits + OTP throttling | ⚠️ Remaining risk — add hCaptcha/Turnstile if abuse is observed (see SECURITY.md) |

## 11. Logging & Monitoring

| # | Sev | Location | Issue | Fix |
|---|-----|----------|-------|------|
| K1 | **M** | whole backend | `console.log` everywhere; no structured logging; no audit trail for admin actions | ✅ `pino` logger (`src/utils/logger.js`); structured events for login success/failure, OTP sends, permission denials, uploads, deletes, admin actions; never logs passwords/tokens/OTPs |

## 12. Frontend

| # | Sev | Location | Issue | Fix |
|---|-----|----------|-------|------|
| L1 | **M** | `frontend/vite.config.js` | No explicit `build.sourcemap: false` | ✅ Explicitly disabled |
| L2 | **L** | `frontend/vite.repro.config.js` | Temporary repro config committed | ✅ Deleted |
| L3 | **L** | `frontend/src/api/axios.js` | 401 handling existed ✅ but relied on localStorage token | ✅ Now cookie-based; 401 → clean logout + redirect |

---

## Secrets that must be rotated (were present in `backend/.env` on disk)

1. **MongoDB Atlas** password for the database user in `MONGO_URI` (username redacted from this doc)
2. **JWT_SECRET** (also replace with a CSPRNG value ≥ 32 chars)
3. **Cloudinary** API key + API secret (key ID redacted from this doc)
4. **Brevo** API key (`xkeysib-…`)
5. **YouTube** API key (`AIzaSy…`)

None of these were ever committed to git (verified: zero commits touched `backend/.env`; GitHub contents API confirms it is not in any branch). They exist only on disk — rotate them anyway because the folder is OneDrive-synced.

## Not applicable (checked, no issue)

- No `dangerouslySetInnerHTML` with user data, no `eval`/`new Function`, no shell exec anywhere.
- No hardcoded secrets in frontend code or bundle (Cloudinary direct-upload uses a server-signed one-time signature).
- All `target="_blank"` links already have `rel="noreferrer"`.
- Source maps are off by default in Vite (now explicit).
- `channels.js` / `messages.js` route files are **not mounted** in `server.js` (dead code) — chat runs over Socket.IO only; their REST handlers were still hardened where cheap but remain unmounted.
