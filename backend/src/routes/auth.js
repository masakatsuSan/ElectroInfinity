const express      = require('express')
const jwt          = require('jsonwebtoken')
const axios        = require('axios')
const User         = require('../models/User')
const { protect }  = require('../middleware/auth')
const { createActivity } = require('../utils/activity')

const router = express.Router()

// ── Helper: sign JWT ──────────────────────────────────────────────────────
function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

// ── Helper: generate 6-digit OTP ─────────────────────────────────────────
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// ── OTP policy ───────────────────────────────────────────────────────────
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
// collapsing every cause into "Try again", which is what made this undiagnosable.
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

// ── Email sender identity ────────────────────────────────────────────────
// The From address must be a sender authenticated for this Brevo account.
// Brevo queues the message either way, so an unauthenticated sender looks
// like success and then dies in the recipient's spam filter.
// NOTE: the ee.agemc.ac.in subdomain publishes no SPF/DKIM (MX is Google
// Workspace only), so it cannot be used as a sending domain. Keep the sender
// pointed at a mailbox verified in the Brevo dashboard.
const DEFAULT_SENDER_NAME = 'Electro Infinity | AGEMC'

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

// ── Helper: send email via Brevo API ─────────────────────────────────────
async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.BREVO_API_KEY?.trim()

  if (!apiKey) {
    console.error('[email] BREVO_API_KEY is not set')
    throw new EmailError('bad_credentials')
  }

  const from = senderAddress()
  if (!from) {
    // Previously this fell back to noreply@electroinfinity.com, which is not a
    // verified Brevo sender, so every OTP silently failed. Fail loudly instead.
    console.error('[email] no sender configured — set BREVO_SENDER_EMAIL in backend/.env')
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
      console.error('[email] Brevo returned no messageId', status, data)
      throw new EmailError('unavailable')
    }

    console.log(`[email] queued "${subject}" -> ${to} (${data.messageId})`)
    return data.messageId
  } catch (err) {
    const reason = err instanceof EmailError ? err.reason : emailFailureReason(err)

    // Keep the real reason (unauthorized sender, blocked IP, bad recipient,
    // quota) in the logs — collapsing every failure into one opaque error is
    // what made this undiagnosable in the first place.
    console.error('[email] send failed ->', to, {
      reason,
      status: err.response?.status,
      code: err.response?.data?.code,
      detail: err.response?.data?.message || err.message,
    })

    // A Brevo key with an IP allowlist rejects every request from a new address,
    // and a residential IPv6 prefix rotates constantly, so this recurs silently.
    // Spell out the one manual step that actually resolves it.
    if (reason === 'ip_not_allowlisted') {
      console.error(
        '[email] ACTION REQUIRED — Brevo API key has an "authorised IPs" restriction and this\n' +
        '          server IP is not on it. Either add the IP below in Brevo (Brevo > Security >\n' +
        '          Authorised IPs), or clear the restriction so the key works from any IP.\n' +
        `          Server IP: ${(err.response?.data?.message || '').match(/unrecogni[sz]ed IP address ([^\s.]+)/i)?.[1] || 'see message above'}`
      )
    }

    throw new EmailError(reason)
  }
}

// ── Helper: resolve the mailbox an OTP should be delivered to ────────────
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

// ── Helper: find a user by either mailbox they might type ────────────────
// Accepts the account email or the personal mailbox the OTP is actually
// delivered to. Matched case-insensitively because `personalEmail` has no
// `lowercase: true` on the schema, so records saved through the profile form
// can hold any casing — a plain equality match silently missed them and the
// reset flow answered "No account found with this email" for a real user.
function findUserByEmail(input) {
  const needle = String(input || '').trim()
  if (!needle) return null

  const exact = String(needle).toLowerCase()
  const escaped = exact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  return User.findOne({
    $or: [
      { email: exact },
      { email: { $regex: `^${escaped}$`, $options: 'i' } },
      { personalEmail: exact },
      { personalEmail: { $regex: `^${escaped}$`, $options: 'i' } },
    ],
  })
}

// ── Helper: mint + deliver an OTP ───────────────────────────────────────
// Every OTP flow (student activation, faculty activation, password reset) is
// the same three steps, so they share one implementation: send first, then
// persist. Writing the code before the mail went out left a live OTP on the
// account whenever Brevo rejected the send — a code nobody received, which
// then fails verification as "Wrong OTP" and looks like a broken OTP flow.
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
    user.otp &&
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
      <p style="opacity:0.6; font-size:14px; margin:0 0 24px;">Electro Infinity · EE Club, AGEMC</p>

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

  // Only now is the code actually claimable.
  user.otp         = otp
  user.otpExpiry   = new Date(Date.now() + OTP_TTL_MS)
  user.otpSentAt   = new Date()
  user.otpAttempts = 0
  await user.save()

  logOtpForDev(purpose, user, otp)

  return recipient
}

// ── Helper: check a submitted code ───────────────────────────────────────
// Returns { error, status } on failure, or null when the code is good.
// Async because the attempt counter is persisted, and that write MUST be
// awaited: a floating save carries a stale in-memory copy of the document and
// can land after clearOtp(), resurrecting an OTP that was already locked out.
// `otp` is coerced to a string first: a client that sends the code as a JSON
// number (a leading zero stripped, e.g. 012345 -> 12345) used to throw
// "otp.trim is not a function" and surface as an opaque 500.
async function checkOtp(user, otp) {
  const submitted = String(otp ?? '').trim()

  if (!user.otp) {
    return { status: 400, error: 'No OTP requested. Request a new one.' }
  }

  if (new Date() > new Date(user.otpExpiry)) {
    return { status: 400, error: 'OTP expired. Request a new one.', clear: true }
  }

  if (submitted !== user.otp) {
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
  user.otp = ''
  user.otpExpiry = null
  user.otpSentAt = null
  user.otpAttempts = 0
  await user.save()
}

// ── Helper: turn a failed OTP send into a useful response ────────────────
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
  console.error('[auth] OTP send failed for', identifier, err?.message, err?.stack)
  return res.status(500).json({ success: false, error: 'Failed to send OTP. Try again.' })
}

// Opt-in diagnostic: echo the code to the server log so a send that Brevo
// queued but a provider dropped can still be verified. Deliberately opt-in via
// OTP_DEBUG rather than gated on NODE_ENV, which this project never sets — an
// unset NODE_ENV must not silently start printing live OTPs.
function logOtpForDev(purpose, user, otp) {
  if (process.env.OTP_DEBUG !== '1') return
  console.log(`[otp] ${purpose} → ${otpRecipient(user)} · code ${otp}`)
}

// ── GET /api/auth/check-roll/:rollNo ──────────────────────────────────────
// Step 1 of activation — check roll number exists, send OTP to registered email
router.get('/check-roll/:rollNo', async (req, res) => {
  try {
    const user = await User.findOne({
      rollNumber: req.params.rollNo.toUpperCase(),
      role: { $in: ['student', 'cr'] },
    })

    if (!user) {
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
      subject: 'Electro Infinity — Account Activation OTP',
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

// ── POST /api/auth/verify-activation-otp ───────────────────────────────────
// Step 2 of activation — verify OTP, return short-lived activation token
// Body: { rollNumber, otp }
router.post('/verify-activation-otp', async (req, res) => {
  try {
    const { rollNumber, otp } = req.body

    if (!rollNumber || !otp) {
      return res.status(400).json({ success: false, error: 'Roll number and OTP required' })
    }

    const user = await User.findOne({ rollNumber: rollNumber.toUpperCase(), role: { $in: ['student', 'cr'] } })

    if (!user) return res.status(404).json({ success: false, error: 'User not found' })
    if (user.isVerified) return res.status(400).json({ success: false, error: 'Account already activated. Go to Login.' })

    const problem = await checkOtp(user, otp)
    if (problem) {
      if (problem.clear) await clearOtp(user)
      return res.status(problem.status).json({ success: false, error: problem.error })
    }

    const activationToken = jwt.sign(
      { id: user._id, purpose: 'activation' },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    )

    // Single-use
    await clearOtp(user)

    res.json({ success: true, activationToken })
  } catch (err) {
    console.error('[auth] verify-activation-otp failed', err?.message)
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// ── POST /api/auth/activate ───────────────────────────────────────────────
// Student sets password for the first time
// Body: { rollNumber, password, activationToken }
router.post('/activate', async (req, res) => {
  try {
    const { rollNumber, password, activationToken } = req.body

    if (!rollNumber || !password) {
      return res.status(400).json({ success: false, error: 'Roll number and password required' })
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' })
    }

    // Verify activation token if provided (OTP flow)
    let decoded = null
    if (activationToken) {
      try {
        decoded = jwt.verify(activationToken, process.env.JWT_SECRET)
      } catch {
        return res.status(400).json({ success: false, error: 'Activation link expired. Request a new OTP.' })
      }
      if (decoded.purpose !== 'activation') {
        return res.status(400).json({ success: false, error: 'Invalid activation token' })
      }
    }

    const user = await User.findOne({ rollNumber: rollNumber.toUpperCase(), role: { $in: ['student', 'cr'] } })

    if (!user)            return res.status(404).json({ success: false, error: 'Roll number not found' })
    if (user.isVerified)  return res.status(400).json({ success: false, error: 'Already activated. Go to Login.' })

    // The token must have been minted for THIS account. Without this check a
    // code someone verified for their own roll number also activated any other
    // pending account, since the token was only checked for a valid signature
    // and purpose.
    if (decoded && decoded.id !== user._id.toString()) {
      return res.status(400).json({ success: false, error: 'Invalid activation token' })
    }

    // If no activation token, require OTP verification
    if (!activationToken && !user.otp) {
      return res.status(400).json({ success: false, error: 'OTP verification required. Request OTP first.' })
    }

    user.password    = password
    user.isVerified  = true
    user.isActivated = true
    user.otp = ''
    user.otpExpiry = null
    user.otpSentAt = null
    await user.save()

    const token = signToken(user._id)
    user.password = undefined

    res.json({ success: true, message: 'Account activated!', token, user })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// ── POST /api/auth/faculty/activate ────────────────────────────────────────
// Faculty sets password for the first time using institutional email + activation token
// Body: { email, password, activationToken }
router.post('/faculty/activate', async (req, res) => {
  try {
    const { email, password, activationToken } = req.body

    if (!email || !password || !activationToken) {
      return res.status(400).json({ success: false, error: 'Email, password, and activation token required' })
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' })
    }

    // Verify activation token
    let decoded
    try {
      decoded = jwt.verify(activationToken, process.env.JWT_SECRET)
    } catch {
      return res.status(400).json({ success: false, error: 'Activation link expired. Request a new OTP.' })
    }

    if (decoded.purpose !== 'faculty_activation') {
      return res.status(400).json({ success: false, error: 'Invalid activation token' })
    }

    const user = await User.findOne({ email: email.toLowerCase(), role: 'faculty' })

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

    const token = signToken(user._id)
    user.password = undefined

    res.json({ success: true, message: 'Account activated!', token, user })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// ── GET /api/auth/check-faculty/:email ─────────────────────────────────────
// Step 1 of faculty activation — check email exists, send OTP, return masked email
router.get('/check-faculty/:email', async (req, res) => {
  try {
    const user = await User.findOne({
      email: req.params.email.toLowerCase(),
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
      subject: 'Electro Infinity — Faculty Activation OTP',
      heading: 'Faculty Activation',
      leadIn: 'Use this OTP to activate your faculty account:',
    })

    res.json({ success: true, name: user.name, maskedEmail: maskEmail(recipient) })
  } catch (err) {
    respondOtpSendFailure(res, req.params.email, err)
  }
})

// ── POST /api/auth/faculty/verify-otp ──────────────────────────────────────
// Step 2 of faculty activation — verify OTP, return short-lived activation token
// Body: { email, otp }
router.post('/faculty/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and OTP required' })
    }

    const user = await User.findOne({ email: email.toLowerCase(), role: 'faculty' })

    if (!user) return res.status(404).json({ success: false, error: 'Faculty account not found' })

    const problem = await checkOtp(user, otp)
    if (problem) {
      if (problem.clear) await clearOtp(user)
      return res.status(problem.status).json({ success: false, error: problem.error })
    }

    // OTP verified — give a short-lived activation token (5 min)
    const activationToken = jwt.sign(
      { id: user._id, purpose: 'faculty_activation' },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    )

    // Single-use
    await clearOtp(user)

    res.json({ success: true, activationToken })
  } catch (err) {
    console.error('[auth] faculty verify-otp failed', err?.message)
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// ── POST /api/auth/forgot-password ───────────────────────────────────────
// Accepts either rollNumber (student/cr) or email (faculty/admin)
// Body: { rollNumber? , email? }
router.post('/forgot-password', async (req, res) => {
  try {
    const { rollNumber, email } = req.body

    if (!rollNumber && !email) {
      return res.status(400).json({ success: false, error: 'Roll number or email required' })
    }

    let user

    if (rollNumber) {
      user = await User.findOne({ rollNumber: rollNumber.trim().toUpperCase(), role: { $in: ['student', 'cr'] } })

      if (!user) {
        return res.status(404).json({ success: false, error: 'Roll number not found' })
      }
    } else if (email) {
      user = await findUserByEmail(email)

      if (!user) {
        return res.status(404).json({ success: false, error: 'No account found with this email' })
      }
    }

    // Required on both paths. Only the roll-number branch checked it, which
    // let a password be set on an account that had never been activated.
    if (!user.isVerified) {
      return res.status(400).json({
        success: false,
        error: 'Account not activated yet. Go to Activate Account.',
      })
    }

    const recipient = await deliverOtp(user, {
      purpose: 'password reset',
      subject: 'Electro Infinity — Password Reset OTP',
      heading: 'Password Reset',
      leadIn: 'Your OTP to reset your password:',
    })

    const maskedEmail = maskEmail(recipient)
    const meta = otpMeta(user)

    res.json({
      success: true,
      message: `OTP sent to ${maskedEmail}`,
      maskedEmail,
      expiresInSeconds: meta.expiresIn,
      resendInSeconds: meta.resendIn,
      attemptsLeft: meta.attemptsLeft,
    })
  } catch (err) {
    respondOtpSendFailure(res, req.body?.rollNumber || req.body?.email, err)
  }
})

// ── POST /api/auth/verify-otp ─────────────────────────────────────────────
// Accepts either rollNumber (student/cr) or email (faculty/admin)
// Body: { rollNumber? , email? , otp }
router.post('/verify-otp', async (req, res) => {
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
      user = await User.findOne({ rollNumber: rollNumber.trim().toUpperCase(), role: { $in: ['student', 'cr'] } })
    } else if (email) {
      user = await findUserByEmail(email)
    }

    if (!user) return res.status(404).json({ success: false, error: 'User not found' })

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
    const resetToken = jwt.sign(
      { id: user._id, purpose: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    )

    // Single-use
    await clearOtp(user)

    res.json({ success: true, resetToken })
  } catch (err) {
    console.error('[auth] verify-otp failed', err?.message)
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// ── POST /api/auth/reset-password ─────────────────────────────────────────
// Set new password using the reset token from verify-otp
// Body: { resetToken, newPassword }
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body

    if (!resetToken || !newPassword) {
      return res.status(400).json({ success: false, error: 'Reset token and new password required' })
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' })
    }

    // Verify the reset token
    let decoded
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET)
    } catch {
      return res.status(400).json({ success: false, error: 'Reset link expired. Request a new OTP.' })
    }

    if (decoded.purpose !== 'reset') {
      return res.status(400).json({ success: false, error: 'Invalid reset token' })
    }

    const user = await User.findById(decoded.id)
    if (!user) return res.status(404).json({ success: false, error: 'User not found' })

    user.password = newPassword
    user.otp = ''
    user.otpExpiry = null
    user.otpSentAt = null
    user.otpAttempts = 0
    await user.save()

    res.json({ success: true, message: 'Password reset successfully! You can now log in.' })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// ── POST /api/auth/register ─────────────────────────────────────────────────
// Student self-registration — creates a pending account awaiting HOD verification
// Body: { name, email, password, rollNumber, regNumber, batch }
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, rollNumber, regNumber, batch } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password required' })
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' })
    }

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists' })
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password,
      rollNumber: rollNumber ? rollNumber.toUpperCase() : '',
      regNumber: regNumber || '',
      batch: batch || '',
      role: 'student',
      isVerified: false,
      isActivated: false,
    })

    res.status(201).json({
      success: true,
      message: 'Registration submitted. Your account is pending HOD approval.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        rollNumber: user.rollNumber,
        batch: user.batch,
        isVerified: user.isVerified,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// ── POST /api/auth/login ──────────────────────────────────────────────────
// Students  → rollNumber + password
// Admin → email + password
router.post('/login', async (req, res) => {
  try {
    const { rollNumber, email, password } = req.body
    if (!password) return res.status(400).json({ success: false, error: 'Password required' })

    let user

    if (rollNumber) {
      user = await User.findOne({ rollNumber: rollNumber.toUpperCase(), role: { $in: ['student', 'cr'] } }).select('+password')
      if (user && !user.isVerified) {
        return res.status(403).json({ success: false, error: 'Account not activated. Go to Activate Account.' })
      }
    } else if (email) {
      user = await User.findOne({ email: email.toLowerCase() }).select('+password')
    } else {
      return res.status(400).json({ success: false, error: 'Roll number or email required' })
    }

    if (!user || !user.password || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, error: 'Wrong credentials' })
    }

    if (user.isActive === false) {
      return res.status(403).json({ success: false, error: 'Account is deactivated. Contact admin.' })
    }

    const token = signToken(user._id)
    user.password = undefined
    res.json({ success: true, token, user })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// ── GET /api/auth/me ──────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user })
})

// ── POST /api/auth/change-password ───────────────────────────────────────
// Logged-in user changes their own password
router.post('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Both fields required' })
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' })
    }

    const user = await User.findById(req.user._id).select('+password')
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, error: 'Current password is wrong' })
    }

    user.password = newPassword
    await user.save()
    res.json({ success: true, message: 'Password changed successfully' })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

// ── PATCH /api/auth/me ────────────────────────────────────────────────────
router.patch('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ success: false, error: 'User not found' })

    const allowedRoot = ['name', 'phone', 'collegeEmail', 'personalEmail', 'rollNumber', 'batch', 'section', 'semester']
    const allowedProfile = ['bio', 'department', 'location', 'skills', 'interests', 'languages', 'profileVisibility']

    allowedRoot.forEach(f => {
      if (req.body[f] !== undefined) user[f] = req.body[f]
    })

    allowedProfile.forEach(f => {
      if (req.body[f] !== undefined) {
        user.profile = user.profile || {}
        user.profile[f] = req.body[f]
      }
    })

    await user.save()
    await createActivity(req.user._id, 'profile_updated', 'Updated profile', '', `/profile/${user._id}`)
    res.json({ success: true, user: user.toObject() })
  } catch (err) {
    res.status(500).json({ success: false, error: 'An internal server error occurred' })
  }
})

module.exports = router
