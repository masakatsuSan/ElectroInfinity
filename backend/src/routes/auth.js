const express      = require('express')
const jwt          = require('jsonwebtoken')
const axios        = require('axios')
const bcrypt       = require('bcryptjs')
const User         = require('../models/User')
const RefreshToken = require('../models/RefreshToken')
const { protect }  = require('../middleware/auth')
const { createActivity } = require('../utils/activity')
const {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  generateFamilyId,
  generateCsrfToken,
  hashToken,
  REFRESH_TOKEN_TTL_MS,
  ISSUER,
} = require('../utils/tokens')
const {
  authLimiter,
  authSlowDown,
  otpLimiter,
} = require('../middleware/rateLimit')
const logger = require('../utils/logger')

const router = express.Router()

// ── Validation helpers ─────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function passwordProblem(pw) {
  if (typeof pw !== 'string' || pw.length < 8 || pw.length > 128) {
    return 'Password must be 8–128 characters'
  }
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(pw)).length
  if (classes < 3) {
    return 'Password must include at least 3 of: lowercase letters, uppercase letters, digits, symbols'
  }
  return null
}

function emailProblem(email) {
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return 'A valid email address is required'
  }
  return null
}

// Strip every sensitive field before a user object is serialized
// into an API response.
function publicUser(user) {
  const obj = user.toObject ? user.toObject() : user
  delete obj.password
  delete obj.otpHash
  delete obj.otpExpiry
  delete obj.otpSentAt
  delete obj.otpAttempts
  return obj
}

// ── Cookie helpers ───────────────────────────────────────────
// Production is served cross-origin (frontend on Vercel, API on
// Render), so cookies must be SameSite=None; Secure there. In dev
// the Vite proxy makes the API same-origin, where Strict is safer.
function isProd() {
  return process.env.NODE_ENV === 'production'
}

function cookieBase(maxAgeMs) {
  return {
    httpOnly: true,
    secure: isProd(),
    sameSite: isProd() ? 'none' : 'strict',
    maxAge: maxAgeMs,
  }
}

function setAuthCookies(res, accessToken, refreshToken, csrfToken) {
  res.cookie('access_token', accessToken, { ...cookieBase(15 * 60 * 1000), path: '/' })
  // Refresh cookie is scoped to the auth endpoints only.
  res.cookie('refresh_token', refreshToken, { ...cookieBase(REFRESH_TOKEN_TTL_MS), path: '/api/auth' })
  // CSRF cookie is readable by our own JS (double-submit pattern).
  res.cookie('csrf_token', csrfToken, {
    httpOnly: false,
    secure: isProd(),
    sameSite: isProd() ? 'none' : 'strict',
    maxAge: REFRESH_TOKEN_TTL_MS,
    path: '/',
  })
}

function clearAuthCookies(res) {
  const opts = { httpOnly: true, secure: isProd(), sameSite: isProd() ? 'none' : 'strict' }
  res.clearCookie('access_token', { ...opts, path: '/' })
  res.clearCookie('refresh_token', { ...opts, path: '/api/auth' })
  res.clearCookie('csrf_token', { ...opts, httpOnly: false, path: '/' })
}

// ── Session issuance ─────────────────────────────────────────
async function issueSession(res, user, req) {
  const accessToken = signAccessToken(user._id, user.tokenVersion || 0)
  const refreshToken = generateRefreshToken()

  await RefreshToken.create({
    tokenHash: hashToken(refreshToken),
    userId: user._id,
    familyId: generateFamilyId(),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    userAgent: String(req.headers['user-agent'] || '').slice(0, 200),
    ip: req.ip || '',
  })

  setAuthCookies(res, accessToken, refreshToken, generateCsrfToken())

  logger.info({ event: 'login', userId: user._id.toString(), role: user.role })
  return { token: accessToken, user: publicUser(user) }
}

// ── Helper: sign short-lived purpose tokens (activation/reset) ──
function signPurposeToken(userId, purpose, ttl = '5m') {
  return jwt.sign({ id: userId, purpose }, process.env.JWT_SECRET, {
    expiresIn: ttl,
    algorithm: 'HS256',
    issuer: ISSUER,
  })
}

function verifyPurposeToken(token, purpose) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET, {
    algorithms: ['HS256'],
    issuer: ISSUER,
  })
  if (decoded.purpose !== purpose) {
    const err = new Error('Invalid token purpose')
    err.status = 400
    throw err
  }
  return decoded
}

// ── Helper: generate 6-digit OTP ─────────────────────────────
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// ── OTP policy ───────────────────────────────────────────────
const OTP_TTL_MS    = 10 * 60 * 1000 // 10 minutes
const OTP_MAX_TRIES = 5              // wrong codes allowed before the OTP dies
const OTP_RESEND_MS = 30 * 1000      // minimum gap between two sends

function otpMeta(user) {
  const expiresIn = user.otpExpiry
    ? Math.max(0, Math.ceil((new Date(user.otpExpiry).getTime() - Date.now()) / 1000))
    : 0
  const resendIn = user.otpSentAt
    ? Math.max(0, Math.ceil((OTP_RESEND_MS - (Date.now() - new Date(user.otpSentAt).getTime())) / 1000))
    : 0
  const attemptsLeft = Math.max(0, OTP_MAX_TRIES - (user.otpAttempts || 0))
  return { expiresIn, resendIn, attemptsLeft }
}

// Thrown by sendEmail so each caller can report why delivery failed instead of
// collapsing every cause into "Try again", which made this undiagnosable.
class EmailError extends Error {
  constructor(reason) {
    super(reason)
    this.reason = reason
  }
}

// Human-facing reason for a failed send. `ip_not_allowlisted` is by far the most
// common one on a residential/dynamic IP and cannot be fixed from the app — it
// needs the Brevo dashboard, so it gets its own message and a louder log.
function emailFailureReason(err) {
  const status = err?.response?.status
  const detail = err?.response?.data?.message || err?.message || ''

  if (status === 401 || /unauthori[sz]ed|api[- ]?key/i.test(detail)) {
    if (/unrecognised IP|unrecognized IP/i.test(detail)) return 'ip_not_allowlisted'
    return 'bad_credentials'
  }
  if (status === 400 && /sender|from/i.test(detail)) return 'bad_sender'
  if (status === 403 || status === 429) return 'quota_or_forbidden'
  return 'unavailable'
}

// What the API tells the client when the code could not be sent. Kept vague for
// anything user-facing except the misconfiguration cases, which are pointless to
// hide because no amount of retrying will fix them.
function emailErrorMessage(reason) {
  switch (reason) {
    case 'ip_not_allowlisted':
      return 'Email service is blocked for this server IP. Contact the site admin.'
    case 'bad_credentials':
      return 'Email service is not configured correctly. Contact the site admin.'
    case 'bad_sender':
      return 'Email sender address is not verified. Contact the site admin.'
    case 'quota_or_forbidden':
      return 'Email service is temporarily unavailable. Try again shortly.'
    default:
      return 'Failed to send OTP. Try again.'
  }
}

// ── Email sender identity ────────────────────────────────────
// The From address must be a sender authenticated for this Brevo account.
// Brevo queues the message either way, so an unauthenticated sender looks
// like success and then dies in the recipient's spam filter.
// NOTE: the ee.agemc.ac.in subdomain publishes no SPF/DKIM (MX is Google
// Workspace only), so it cannot be used as a sending domain. Keep the sender
// pointed at a mailbox verified in the Brevo dashboard.
const DEFAULT_SENDER_NAME = 'College Connect | AGEMC'

function senderName() {
  return process.env.BREVO_SENDER_NAME?.trim() || process.env.EMAIL_SENDER_NAME?.trim() || DEFAULT_SENDER_NAME
}

function senderAddress() {
  return (
    process.env.BREVO_SENDER_EMAIL?.trim() ||
    process.env.EMAIL_SENDER?.trim() ||
    process.env.EMAIL_USER?.trim() ||
    ''
  )
}

// ── Helper: send email via Brevo API ─────────────────────────
async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.BREVO_API_KEY?.trim()

  if (!apiKey) {
    logger.error({ event: 'email_not_configured' })
    throw new EmailError('bad_credentials')
  }

  const from = senderAddress()
  if (!from) {
    // Previously this fell back to noreply@electroinfinity.com, which is not a
    // verified Brevo sender, so every OTP silently failed. Fail loudly instead.
    logger.error({ event: 'email_no_sender' })
    throw new EmailError('bad_sender')
  }

  const payload = {
    sender: { name: senderName(), email: from },
    to: [{ email: to }],
    subject: subject,
    htmlContent: html,
  }

  try {
    const { data, status } = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 15000,
    })

    // 201 + messageId means the message actually entered the relay. Any other
    // outcome means it was never sent, so we must not report it as delivered.
    if (status !== 201 || !data?.messageId) {
      logger.error({ event: 'email_no_message_id', status })
      throw new EmailError('unavailable')
    }

    logger.info({ event: 'email_queued', subject, messageId: data.messageId })
    return data.messageId
  } catch (err) {
    const reason = err instanceof EmailError ? err.reason : emailFailureReason(err)

    // Keep the real reason (unauthorized sender, blocked IP, bad recipient,
    // quota) in the logs — collapsing every failure into one opaque error is
    // what made this undiagnosable in the first place.
    logger.error({
      event: 'email_send_failed',
      reason,
      status: err.response?.status,
      code: err.response?.data?.code,
      detail: err.response?.data?.message || err.message,
    })

    // A Brevo key with an IP allowlist rejects every request from a new address,
    // and a residential IPv6 prefix rotates constantly, so this recurs silently.
    // Spell out the one manual step that actually resolves it.
    if (reason === 'ip_not_allowlisted') {
      const serverIp = (err.response?.data?.message || '').match(/unrecogni[sz]ed IP address ([^\s.]+)/i)?.[1]
      logger.error({
        event: 'email_action_required',
        message: 'Brevo API key has an "authorised IPs" restriction and this server IP is not on it. Add the server IP in Brevo (Brevo > Security > Authorised IPs), or clear the restriction.',
        serverIp: serverIp || 'see previous log entry',
      })
    }

    throw new EmailError(reason)
  }
}

// ── Helper: resolve the mailbox an OTP should be delivered to ──
// Institutional @ee.agemc.ac.in mailboxes are the least reliable destination
// here, so prefer a personal mailbox when one is on file and fall back to the
// account email.
function otpRecipient(user) {
  const personal = user.personalEmail?.trim()
  if (personal) return personal
  return user.email?.trim() || ''
}

function maskEmail(email) {
  return email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
}

// ── Helper: find a user by either mailbox they might type ────
// Accepts the account email or the personal mailbox the OTP is actually
// delivered to. Both fields are `lowercase: true` on the schema, so a plain
// equality match is exact and cannot be abused with regex operators.
function findUserByEmail(input) {
  const needle = String(input || '').trim().toLowerCase()
  if (!needle) return null
  return User.findOne({ $or: [{ email: needle }, { personalEmail: needle }] })
}

// ── Helper: mint + deliver an OTP ────────────────────────────
// Every OTP flow (student activation, faculty activation, password reset) is
// the same three steps, so they share one implementation: send first, then
// persist. Writing the code before the mail went out left a live OTP on the
// account whenever Brevo rejected the send — a code nobody received, which
// then fails verification as "Wrong OTP" and looks like a broken OTP flow.
// The OTP is persisted bcrypt-hashed, never in plaintext.
async function deliverOtp(user, { purpose, subject, heading, leadIn }) {
  const recipient = otpRecipient(user)
  if (!recipient) {
    const err = new Error('no recipient')
    err.status = 400
    err.error = 'No email registered for this account. Contact your HOD.'
    throw err
  }

  // Refuse to spam the relay (and the user) with codes seconds apart.
  if (
    user.otpHash &&
    user.otpSentAt &&
    Date.now() - new Date(user.otpSentAt).getTime() < OTP_RESEND_MS
  ) {
    const err = new Error('throttled')
    err.status = 429
    err.error = `Please wait ${Math.ceil((OTP_RESEND_MS - (Date.now() - new Date(user.otpSentAt).getTime())) / 1000)}s before requesting another OTP.`
    throw err
  }

  const otp = generateOTP()

  const html = `
    <div style="font-family:monospace; max-width:480px; margin:0 auto; padding:32px; background:#07060E; color:#F0EFF8; border:1px solid rgba(255,255,255,0.1);">
      <h2 style="font-family:serif; font-size:22px; margin:0 0 8px;">${heading}</h2>
      <p style="opacity:0.6; font-size:14px; margin:0 0 24px;">College Connect · AGEMC</p>

      <p style="font-size:14px; margin:0 0 16px;">Hi ${user.name},</p>
      <p style="font-size:14px; opacity:0.8; margin:0 0 24px;">${leadIn}</p>

      <div style="background:rgba(102,87,245,0.15); border:1px solid rgba(102,87,245,0.4); padding:20px; text-align:center; margin:0 0 24px;">
        <span style="font-size:36px; letter-spacing:12px; font-weight:bold; color:#9D90FA;">${otp}</span>
      </div>

      <p style="font-size:13px; opacity:0.5; margin:0 0 8px;">This OTP expires in 10 minutes.</p>
      <p style="font-size:13px; opacity:0.5; margin:0;">If you didn't request this, ignore this email.</p>
    </div>
  `

  await sendEmail({ to: recipient, subject, html })

  // Only now is the code actually claimable — and only its hash is stored.
  user.otpHash     = await bcrypt.hash(otp, 12)
  user.otpExpiry   = new Date(Date.now() + OTP_TTL_MS)
  user.otpSentAt   = new Date()
  user.otpAttempts = 0
  await user.save()

  logger.info({ event: 'otp_sent', purpose, userId: user._id.toString() })

  return recipient
}

// ── Helper: check a submitted code ───────────────────────────
// Returns { error, status } on failure, or null when the code is good.
// Async because the attempt counter is persisted, and that write MUST be
// awaited: a floating save carries a stale in-memory copy of the document and
// can land after clearOtp(), resurrecting an OTP that was already locked out.
// `otp` is coerced to a string first: a client that sends the code as a JSON
// number (a leading zero stripped, e.g. 012345 -> 12345) used to throw
// "otp.trim is not a function" and surface as an opaque 500.
async function checkOtp(user, otp) {
  const submitted = String(otp ?? '').trim()

  if (!user.otpHash) {
    return { status: 400, error: 'No OTP requested. Request a new one.' }
  }

  if (new Date() > new Date(user.otpExpiry)) {
    return { status: 400, error: 'OTP expired. Request a new one.', clear: true }
  }

  const valid = await bcrypt.compare(submitted, user.otpHash)
  if (!valid) {
    // Bound the guesses so a 6-digit code cannot be brute-forced in
    // milliseconds, and so the account is not left holding a code that has
    // already served its purpose.
    const tries = (user.otpAttempts || 0) + 1
    if (tries >= OTP_MAX_TRIES) {
      return {
        status: 429,
        error: 'Too many incorrect attempts. Request a new OTP.',
        clear: true,
      }
    }
    user.otpAttempts = tries
    await user.save()
    const left = OTP_MAX_TRIES - tries
    return {
      status: 400,
      error: `Wrong OTP. ${left} attempt${left === 1 ? '' : 's'} left before a new OTP is required.`,
    }
  }

  return null
}

async function clearOtp(user) {
  user.otpHash = ''
  user.otpExpiry = null
  user.otpSentAt = null
  user.otpAttempts = 0
  await user.save()
}

// ── Helper: turn a failed OTP send into a useful response ────
// Handles the three outcomes a send can produce: our own guard rejections
// (missing address, resend throttled — already carry a status), a mail-provider
// failure, and an unexpected error.
function respondOtpSendFailure(res, identifier, err) {
  if (err instanceof EmailError) {
    return res.status(502).json({ success: false, error: emailErrorMessage(err.reason) })
  }
  if (err?.status) {
    return res.status(err.status).json({ success: false, error: err.error })
  }
  logger.error({ event: 'otp_send_crash', identifier, message: err?.message })
  return res.status(500).json({ success: false, error: 'Failed to send OTP. Try again.' })
}

// ── GET /api/auth/check-roll/:rollNo ─────────────────────────
// Step 1 of activation — check roll number exists, send OTP to registered email
router.get('/check-roll/:rollNo', authLimiter, authSlowDown, async (req, res) => {
  try {
    const user = await User.findOne({
      rollNumber: String(req.params.rollNo || '').trim().toUpperCase(),
      role: { $in: ['student', 'cr'] },
    })

    if (!user) {
      // Same shape as "already activated" so the endpoint cannot be used to
      // enumerate which roll numbers have accounts.
      return res.status(404).json({
        success: false,
        error: 'Roll number not found. Ask your HOD to add you to the system first.',
      })
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        error: 'Account already activated. Go to Login.',
      })
    }

    const recipient = await deliverOtp(user, {
      purpose: 'account activation',
      subject: 'College Connect — Account Activation OTP',
      heading: 'Account Activation',
      leadIn: 'Your OTP to activate your account:',
    })

    const maskedEmail = maskEmail(recipient)

    res.json({
      success: true,
      name: user.name,
      batch: user.batch,
      message: `OTP sent to ${maskedEmail}`,
      maskedEmail,
      otpSent: true,
    })
  } catch (err) {
    respondOtpSendFailure(res, req.params.rollNo, err)
  }
})

// ── POST /api/auth/verify-activation-otp ─────────────────────
// Step 2 of activation — verify OTP, return short-lived activation token
// Body: { rollNumber, otp }
router.post('/verify-activation-otp', authLimiter, otpLimiter, async (req, res) => {
  try {
    const { rollNumber, otp } = req.body

    if (!rollNumber || !otp) {
      return res.status(400).json({ success: false, error: 'Roll number and OTP required' })
    }

    const user = await User.findOne({
      rollNumber: String(rollNumber).trim().toUpperCase(),
      role: { $in: ['student', 'cr'] },
    })

    if (!user) return res.status(404).json({ success: false, error: 'User not found' })
    if (user.isVerified) return res.status(400).json({ success: false, error: 'Account already activated. Go to Login.' })

    const problem = await checkOtp(user, otp)
    if (problem) {
      if (problem.clear) await clearOtp(user)
      return res.status(problem.status).json({ success: false, error: problem.error })
    }

    const activationToken = signPurposeToken(user._id, 'activation')

    // Single-use
    await clearOtp(user)

    res.json({ success: true, activationToken })
  } catch (err) {
    logger.error({ event: 'verify_activation_otp_crash', message: err?.message })
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// ── POST /api/auth/activate ──────────────────────────────────
// Student sets password for the first time.
// Body: { rollNumber, password, activationToken }
// The activation token (minted only after a verified OTP) is REQUIRED —
// accepting a bare rollNumber + password let anyone who knows a roll number
// take over a pending account.
router.post('/activate', authLimiter, async (req, res) => {
  try {
    const { rollNumber, password, activationToken } = req.body

    if (!rollNumber || !password || !activationToken) {
      return res.status(400).json({ success: false, error: 'Roll number, password, and activation token required' })
    }
    const pwProblem = passwordProblem(password)
    if (pwProblem) {
      return res.status(400).json({ success: false, error: pwProblem })
    }

    // Verify activation token (OTP flow)
    let decoded
    try {
      decoded = verifyPurposeToken(activationToken, 'activation')
    } catch {
      return res.status(400).json({ success: false, error: 'Activation link expired. Request a new OTP.' })
    }

    const user = await User.findOne({
      rollNumber: String(rollNumber).trim().toUpperCase(),
      role: { $in: ['student', 'cr'] },
    })

    if (!user)            return res.status(404).json({ success: false, error: 'Roll number not found' })
    if (user.isVerified)  return res.status(400).json({ success: false, error: 'Already activated. Go to Login.' })

    // The token must have been minted for THIS account.
    if (decoded.id !== user._id.toString()) {
      return res.status(400).json({ success: false, error: 'Invalid activation token' })
    }

    user.password    = password
    user.isVerified  = true
    user.isActivated = true
    await clearOtp(user)
    await user.save()

    const session = await issueSession(res, user, req)
    res.json({ success: true, message: 'Account activated!', ...session })
  } catch (err) {
    logger.error({ event: 'activate_crash', message: err?.message })
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// ── POST /api/auth/faculty/activate ──────────────────────────
// Faculty sets password for the first time using institutional email + activation token
// Body: { email, password, activationToken }
router.post('/faculty/activate', authLimiter, async (req, res) => {
  try {
    const { email, password, activationToken } = req.body

    if (!email || !password || !activationToken) {
      return res.status(400).json({ success: false, error: 'Email, password, and activation token required' })
    }
    const pwProblem = passwordProblem(password)
    if (pwProblem) {
      return res.status(400).json({ success: false, error: pwProblem })
    }

    // Verify activation token
    let decoded
    try {
      decoded = verifyPurposeToken(activationToken, 'faculty_activation')
    } catch {
      return res.status(400).json({ success: false, error: 'Activation link expired. Request a new OTP.' })
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase(), role: 'faculty' })

    if (!user) return res.status(404).json({ success: false, error: 'No faculty account found with this email' })
    if (user.isVerified) {
      return res.status(400).json({ success: false, error: 'Account already activated. Go to Login.' })
    }

    // Verify token belongs to this user
    if (decoded.id !== user._id.toString()) {
      return res.status(400).json({ success: false, error: 'Invalid activation token' })
    }

    user.password    = password
    user.isVerified  = true
    user.isActivated = true
    await user.save()

    const session = await issueSession(res, user, req)
    res.json({ success: true, message: 'Account activated!', ...session })
  } catch (err) {
    logger.error({ event: 'faculty_activate_crash', message: err?.message })
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// ── GET /api/auth/check-faculty/:email ───────────────────────
// Step 1 of faculty activation — check email exists, send OTP, return masked email
router.get('/check-faculty/:email', authLimiter, authSlowDown, async (req, res) => {
  try {
    const user = await User.findOne({
      email: String(req.params.email || '').trim().toLowerCase(),
      role: 'faculty',
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No faculty account found with this email. Contact your HOD.',
      })
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        error: 'Account already activated. Go to Login.',
      })
    }

    const recipient = await deliverOtp(user, {
      purpose: 'faculty activation',
      subject: 'College Connect — Faculty Activation OTP',
      heading: 'Faculty Activation',
      leadIn: 'Use this OTP to activate your faculty account:',
    })

    res.json({ success: true, name: user.name, maskedEmail: maskEmail(recipient) })
  } catch (err) {
    respondOtpSendFailure(res, req.params.email, err)
  }
})

// ── POST /api/auth/faculty/verify-otp ────────────────────────
// Step 2 of faculty activation — verify OTP, return short-lived activation token
// Body: { email, otp }
router.post('/faculty/verify-otp', authLimiter, otpLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and OTP required' })
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase(), role: 'faculty' })

    if (!user) return res.status(404).json({ success: false, error: 'Faculty account not found' })

    const problem = await checkOtp(user, otp)
    if (problem) {
      if (problem.clear) await clearOtp(user)
      return res.status(problem.status).json({ success: false, error: problem.error })
    }

    // OTP verified — give a short-lived activation token (5 min)
    const activationToken = signPurposeToken(user._id, 'faculty_activation')

    // Single-use
    await clearOtp(user)

    res.json({ success: true, activationToken })
  } catch (err) {
    logger.error({ event: 'faculty_verify_otp_crash', message: err?.message })
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// ── POST /api/auth/forgot-password ───────────────────────────
// Accepts either rollNumber (student/cr) or email (faculty/admin).
// The response is deliberately identical whether or not an account exists,
// so the endpoint cannot be used to enumerate accounts.
// Body: { rollNumber? , email? }
router.post('/forgot-password', authLimiter, authSlowDown, async (req, res) => {
  const generic = 'If an account with that identifier exists and is activated, an OTP has been sent to the registered email.'
  try {
    const { rollNumber, email } = req.body

    if (!rollNumber && !email) {
      return res.status(400).json({ success: false, error: 'Roll number or email required' })
    }

    let user

    if (rollNumber) {
      user = await User.findOne({
        rollNumber: String(rollNumber).trim().toUpperCase(),
        role: { $in: ['student', 'cr'] },
      })
    } else if (email) {
      const emailErr = emailProblem(email)
      if (emailErr) return res.status(400).json({ success: false, error: emailErr })
      user = await findUserByEmail(email)
    }

    // Account must exist and be activated — but the client cannot tell
    // which of these failed.
    if (!user || !user.isVerified) {
      logger.info({ event: 'forgot_password_not_found' })
      return res.json({ success: true, message: generic })
    }

    await deliverOtp(user, {
      purpose: 'password reset',
      subject: 'College Connect — Password Reset OTP',
      heading: 'Password Reset',
      leadIn: 'Your OTP to reset your password:',
    })

    const meta = otpMeta(user)

    res.json({
      success: true,
      message: generic,
      expiresInSeconds: meta.expiresIn,
      resendInSeconds: meta.resendIn,
      attemptsLeft: meta.attemptsLeft,
    })
  } catch (err) {
    respondOtpSendFailure(res, req.body?.rollNumber || req.body?.email, err)
  }
})

// ── POST /api/auth/verify-otp ────────────────────────────────
// Accepts either rollNumber (student/cr) or email (faculty/admin)
// Body: { rollNumber? , email? , otp }
router.post('/verify-otp', authLimiter, otpLimiter, async (req, res) => {
  try {
    const { rollNumber, email, otp } = req.body

    if (!rollNumber && !email) {
      return res.status(400).json({ success: false, error: 'Roll number or email required' })
    }
    if (!otp) {
      return res.status(400).json({ success: false, error: 'OTP required' })
    }

    let user

    if (rollNumber) {
      user = await User.findOne({
        rollNumber: String(rollNumber).trim().toUpperCase(),
        role: { $in: ['student', 'cr'] },
      })
    } else if (email) {
      user = await findUserByEmail(email)
    }

    // Generic: a wrong identifier and a wrong code are indistinguishable.
    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP.' })
    }

    const problem = await checkOtp(user, otp)
    if (problem) {
      if (problem.clear) await clearOtp(user)
      const meta = problem.clear ? { expiresIn: 0, resendIn: 0, attemptsLeft: 0 } : otpMeta(user)
      return res.status(problem.status).json({
        success: false,
        error: problem.error,
        expiresInSeconds: meta.expiresIn,
        resendInSeconds: meta.resendIn,
        attemptsLeft: meta.attemptsLeft,
      })
    }

    // OTP verified — give a short-lived reset token (5 min) so they can set a new password
    const resetToken = signPurposeToken(user._id, 'reset')

    // Single-use
    await clearOtp(user)

    res.json({ success: true, resetToken })
  } catch (err) {
    logger.error({ event: 'verify_otp_crash', message: err?.message })
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// ── POST /api/auth/reset-password ────────────────────────────
// Set new password using the reset token from verify-otp
// Body: { resetToken, newPassword }
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body

    if (!resetToken || !newPassword) {
      return res.status(400).json({ success: false, error: 'Reset token and new password required' })
    }
    const pwProblem = passwordProblem(newPassword)
    if (pwProblem) {
      return res.status(400).json({ success: false, error: pwProblem })
    }

    // Verify the reset token
    let decoded
    try {
      decoded = verifyPurposeToken(resetToken, 'reset')
    } catch {
      return res.status(400).json({ success: false, error: 'Reset link expired. Request a new OTP.' })
    }

    const user = await User.findById(decoded.id)
    if (!user) return res.status(404).json({ success: false, error: 'User not found' })

    user.password = newPassword
    // Password change invalidates every existing session.
    user.tokenVersion = (user.tokenVersion || 0) + 1
    await clearOtp(user)
    await user.save()
    await RefreshToken.deleteMany({ userId: user._id })

    logger.info({ event: 'password_reset', userId: user._id.toString() })
    res.json({ success: true, message: 'Password reset successfully! You can now log in.' })
  } catch (err) {
    logger.error({ event: 'reset_password_crash', message: err?.message })
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// ── POST /api/auth/register ────────────────────────────────────
// Student self-registration — creates a pending account awaiting HOD verification
// Body: { name, email, password, rollNumber, regNumber, batch }
router.post('/register', authLimiter, authSlowDown, async (req, res) => {
  try {
    const { name, email, password, rollNumber, regNumber, batch } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password required' })
    }
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
      return res.status(400).json({ success: false, error: 'Name must be 2–100 characters' })
    }
    const emailErr = emailProblem(email)
    if (emailErr) {
      return res.status(400).json({ success: false, error: emailErr })
    }
    const pwProblem = passwordProblem(password)
    if (pwProblem) {
      return res.status(400).json({ success: false, error: pwProblem })
    }

    const existing = await User.findOne({ email: email.trim().toLowerCase() })
    if (existing) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists' })
    }

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      rollNumber: rollNumber ? String(rollNumber).trim().toUpperCase() : '',
      regNumber: regNumber ? String(regNumber).trim().slice(0, 50) : '',
      batch: batch ? String(batch).trim().slice(0, 20) : '',
      role: 'student',
      isVerified: false,
      isActivated: false,
    })

    logger.info({ event: 'register', userId: user._id.toString() })
    res.status(201).json({
      success: true,
      message: 'Registration submitted. Your account is pending HOD approval.',
      user: publicUser(user),
    })
  } catch (err) {
    logger.error({ event: 'register_crash', message: err?.message })
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// ── POST /api/auth/login ─────────────────────────────────────
// Students  → rollNumber + password
// Admin/faculty → email + password
router.post('/login', authLimiter, authSlowDown, async (req, res) => {
  try {
    const { rollNumber, email, password } = req.body
    if (!password) {
      return res.status(400).json({ success: false, error: 'Roll number or email and password required' })
    }

    let user

    if (rollNumber) {
      user = await User.findOne({
        rollNumber: String(rollNumber).trim().toUpperCase(),
        role: { $in: ['student', 'cr'] },
      }).select('+password')
    } else if (email) {
      const emailErr = emailProblem(email)
      if (emailErr) {
        // Do not confirm whether the email exists.
        return res.status(401).json({ success: false, error: 'Invalid email or password' })
      }
      user = await User.findOne({ email: String(email).trim().toLowerCase() }).select('+password')
    } else {
      return res.status(400).json({ success: false, error: 'Roll number or email and password required' })
    }

    // Verify the password BEFORE revealing any account state, so the response
    // cannot be used to enumerate accounts.
    if (!user || !user.password || !(await user.comparePassword(password))) {
      logger.info({ event: 'login_failed', reason: 'bad_credentials' })
      return res.status(401).json({ success: false, error: 'Invalid email or password' })
    }

    if (!user.isVerified) {
      return res.status(403).json({ success: false, error: 'Account not activated. Go to Activate Account.' })
    }

    if (user.isActive === false) {
      logger.info({ event: 'login_blocked_deactivated', userId: user._id.toString() })
      return res.status(403).json({ success: false, error: 'Account is deactivated. Contact admin.' })
    }

    const session = await issueSession(res, user, req)
    res.json({ success: true, ...session })
  } catch (err) {
    logger.error({ event: 'login_crash', message: err?.message })
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// ── POST /api/auth/refresh ─────────────────────────────────────
// Rotate the refresh token. A refresh token is single-use: presenting a token
// that has already been rotated revokes the whole token family (theft detection).
router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies?.refresh_token
    if (!token) {
      return res.status(401).json({ success: false, error: 'No refresh token' })
    }

    const stored = await RefreshToken.findOne({ tokenHash: hashToken(token) })
    if (!stored) {
      return res.status(401).json({ success: false, error: 'Invalid refresh token' })
    }

    if (stored.replacedBy || stored.revokedAt) {
      // Reuse of a rotated token: possible theft — kill the entire family.
      await RefreshToken.deleteMany({ familyId: stored.familyId, userId: stored.userId })
      logger.warn({ event: 'refresh_token_reuse', userId: stored.userId.toString() })
      return res.status(401).json({ success: false, error: 'Refresh token reused — all sessions revoked. Please log in again.' })
    }

    if (new Date() > new Date(stored.expiresAt)) {
      await stored.deleteOne()
      return res.status(401).json({ success: false, error: 'Refresh token expired' })
    }

    const user = await User.findById(stored.userId)
    if (!user || user.isActive === false) {
      return res.status(401).json({ success: false, error: 'Authentication required' })
    }

    // Rotate: the old token is retired, a new one is issued in the same family.
    const newRefresh = generateRefreshToken()
    stored.replacedBy = hashToken(newRefresh)
    stored.revokedAt = new Date()
    await stored.save()

    await RefreshToken.create({
      tokenHash: hashToken(newRefresh),
      userId: user._id,
      familyId: stored.familyId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      userAgent: String(req.headers['user-agent'] || '').slice(0, 200),
      ip: req.ip || '',
    })

    const accessToken = signAccessToken(user._id, user.tokenVersion || 0)
    setAuthCookies(res, accessToken, newRefresh, generateCsrfToken())

    res.json({ success: true, token: accessToken })
  } catch (err) {
    logger.error({ event: 'refresh_crash', message: err?.message })
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// ── POST /api/auth/logout ────────────────────────────────────
// Revokes the refresh token server-side and clears all auth cookies.
router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies?.refresh_token
    if (token) {
      await RefreshToken.deleteOne({ tokenHash: hashToken(token) })
    }
    clearAuthCookies(res)
    res.json({ success: true, message: 'Logged out' })
  } catch (err) {
    logger.error({ event: 'logout_crash', message: err?.message })
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// ── GET /api/auth/me ─────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: publicUser(req.user) })
})

// ── POST /api/auth/change-password ───────────────────────────
// Logged-in user changes their own password. Invalidates every session.
router.post('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Both fields required' })
    }
    const pwProblem = passwordProblem(newPassword)
    if (pwProblem) {
      return res.status(400).json({ success: false, error: pwProblem })
    }

    const user = await User.findById(req.user._id).select('+password')
    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, error: 'Current password is wrong' })
    }

    user.password = newPassword
    user.tokenVersion = (user.tokenVersion || 0) + 1
    await user.save()
    // Password change invalidates every existing session.
    await RefreshToken.deleteMany({ userId: user._id })

    // The current session's cookies are now stale — clear them.
    clearAuthCookies(res)

    logger.info({ event: 'password_changed', userId: user._id.toString() })
    res.json({ success: true, message: 'Password changed successfully. Please log in again.' })
  } catch (err) {
    logger.error({ event: 'change_password_crash', message: err?.message })
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// ── PATCH /api/auth/me ───────────────────────────────────────
// Update own profile — strict field whitelist with type/length validation.
router.patch('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ success: false, error: 'User not found' })

    const stringFields = {
      name: 100, phone: 20, collegeEmail: 100, personalEmail: 100,
      rollNumber: 20, batch: 20, section: 20,
    }
    for (const [field, max] of Object.entries(stringFields)) {
      if (req.body[field] !== undefined) {
        if (req.body[field] === null) {
          user[field] = field === 'phone' ? '' : user[field]
          continue
        }
        if (typeof req.body[field] !== 'string' || req.body[field].length > max) {
          return res.status(400).json({ success: false, error: `${field} must be a string of at most ${max} characters` })
        }
        user[field] = req.body[field].trim()
      }
    }

    if (req.body.semester !== undefined) {
      const sem = Number(req.body.semester)
      if (!Number.isInteger(sem) || sem < 1 || sem > 12) {
        return res.status(400).json({ success: false, error: 'Semester must be an integer between 1 and 12' })
      }
      user.semester = sem
    }

    const profileStringFields = {
      bio: 500, department: 100, location: 100,
    }
    for (const [field, max] of Object.entries(profileStringFields)) {
      if (req.body[field] !== undefined) {
        if (typeof req.body[field] !== 'string' || req.body[field].length > max) {
          return res.status(400).json({ success: false, error: `${field} must be a string of at most ${max} characters` })
        }
        user.profile = user.profile || {}
        user.profile[field] = req.body[field].trim()
      }
    }

    const listFields = ['skills', 'interests', 'languages']
    for (const field of listFields) {
      if (req.body[field] !== undefined) {
        if (
          !Array.isArray(req.body[field]) ||
          req.body[field].length > 30 ||
          req.body[field].some((v) => typeof v !== 'string' || v.length > 60)
        ) {
          return res.status(400).json({ success: false, error: `${field} must be an array of at most 30 short strings` })
        }
        user.profile = user.profile || {}
        user.profile[field] = req.body[field].map((v) => v.trim()).filter(Boolean)
      }
    }

    if (req.body.profileVisibility !== undefined) {
      if (!['public', 'friends', 'private'].includes(req.body.profileVisibility)) {
        return res.status(400).json({ success: false, error: 'Invalid profileVisibility' })
      }
      user.profile = user.profile || {}
      user.profile.profileVisibility = req.body.profileVisibility
    }

    await user.save()
    await createActivity(req.user._id, 'profile_updated', 'Updated profile', '', `/profile/${user._id}`)
    res.json({ success: true, user: publicUser(user) })
  } catch (err) {
    logger.error({ event: 'patch_me_crash', message: err?.message })
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

module.exports = router
