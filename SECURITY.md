# SECURITY.md

Security posture, hardening checklist and remaining risks for
College Connect (React + Express + MongoDB). See `SECURITY_AUDIT.md`
for the full findings list with file:line references.

## What was fixed (Phase 2)

- **Auth / sessions**
  - httpOnly cookie sessions (`access_token` 15m, `refresh_token` 7d scoped to `/api/auth`, readable `csrf_token`).
  - Refresh-token rotation with reuse detection (token families; reuse revokes the whole family).
  - Server-side logout revokes the refresh token.
  - Password change / reset bumps `tokenVersion`, invalidating every issued access token.
  - Login errors are generic ("Invalid email or password"); password is verified before account-state checks to prevent enumeration.
  - Password policy: 8–128 chars, 3 of 4 character classes.
  - OTP codes are bcrypt-hashed at rest, single-use, rate-limited (5/min), with resend throttling.
  - Activation now requires a single-use activation token minted only after OTP verification (previously any roll number could be activated without proof of email ownership).
- **Transport / headers**
  - Helmet (strict CSP, HSTS, frameguard, referrer policy), CORS allowlist from `ALLOWED_ORIGINS` (no wildcard), 100 KB body limits, `express-mongo-sanitize`, `hpp`, compression.
  - Double-submit CSRF on all mutating requests (Bearer clients exempt).
- **Rate limiting**
  - Global 300 req/min/IP; auth 10/15min + slow-down; OTP 5/min; contact 5/hour; download-counter, scan, upload and write limiters.
- **Injection / SSRF**
  - All user input embedded in RegExp is escaped (profile search, network search, folders search, achievements student matching).
  - Gallery/project image URLs are restricted to Cloudinary URLs before any server-side fetch (SSRF).
  - Uploads are magic-byte validated (`file-type`) in addition to multer's mimetype check.
- **Authorization**
  - Attendance: QR/geofence fields stripped from API responses, scan endpoint fail-closed, feed/roster access-controlled, teaching assignments default-deny.
  - Calendar/assignments/deadlines/faculty/subjects: mass-assignment whitelists; CRs locked to their own batch/section; PATCH/DELETE ownership checks (IDOR).
  - Labs/admin stats: `cr` removed from admin-only guards.
  - Badges: self-award branch removed (admin-only).
  - Socket.IO: channel join/typing gated by channel membership; CORS allowlist; cookie-based auth with issuer + tokenVersion checks.
- **Data exposure**
  - Email addresses removed from student directory, network search and profile search payloads.
  - Pagination capped (100/page) on profile search and announcements.
  - Contact form length-capped and validated.
- **Operations**
  - pino structured logging with redaction of password/token/otp; no sensitive data in logs.
  - Fail-fast env validation; graceful shutdown; unhandled-rejection handling; request timeouts.
  - Stale attendance sessions (orphaned by a server restart) are swept on boot and hourly.
  - Seed script uses random per-user passwords instead of a hardcoded `12345678`.
- **Frontend**
  - Token removed from localStorage; session rides in httpOnly cookies; axios sends credentials and the CSRF header.
  - `safeUrl()` helper applied to all user-controlled `href` values (blocks `javascript:`/`data:` schemes).
  - Production source maps disabled; unused `vite.repro.config.js` removed.

## Deployment checklist

1. **Rotate every secret** that was ever in `backend/.env` on this machine (MongoDB Atlas password, `JWT_SECRET`, Cloudinary API key/secret, Brevo key, YouTube API key). They are real values sitting in a OneDrive-synced folder.
2. Set `NODE_ENV=production`, `ALLOWED_ORIGINS=https://your-frontend.example.com`, `API_URL=https://your-api.example.com/api` on the frontend build.
3. Keep `MONGO_URI`, `JWT_SECRET` etc. in the host's secret store (Render env vars), never in the repo.
4. HTTPS is required in production (cookies are `Secure` + `SameSite=None`).
5. Re-run `npm audit` after dependency upgrades land (see remaining risks).

## Remaining risks (accepted / needs major bumps)

- `npm audit` leftovers that require **major-version migrations** and were therefore not auto-applied:
  - Backend (dev-only): `braces`/`chokidar`/`nodemon` — fix requires `braces@4.3.3` (major).
  - Frontend (dev/build tooling): `vitest@5`, `vite@8`, `tailwindcss@4`, `braces@4` — all major bumps.
  - Frontend runtime: `react-router-dom@6.30.6` still carries a moderate open-redirect advisory (backslash handling); upgrading to v7 is a breaking change. Mitigation: the app only navigates to internal, code-owned paths.
- `socket.io` chat routes (`channels.js`, `messages.js`) are dead code — not mounted. Consider deleting them.
- Google Drive imports fetch arbitrary public Drive files by ID (by design); they are content-checked (HTML detection) but not sandboxed.
- The contact form emails the department address; Brevo delivery failures return 502 with a generic message.

## Testing

- Backend: `cd backend && npm test` (node:test, includes `tests/security.test.js`).
- Frontend: `cd frontend && npm run build` (production build, no source maps).
