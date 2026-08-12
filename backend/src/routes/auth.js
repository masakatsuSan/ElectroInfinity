const express      = require('express')
const jwt          = require('jsonwebtoken')
const brevo        = require('@getbrevo/brevo')
const User         = require('../models/User')
const { protect }  = require('../middleware/auth')

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

// ── Helper: send email via Brevo API ──────────────────────────────────────
async function sendEmail({ to, subject, html }) {
  const apiInstance = new brevo.TransactionalEmailsApi()

  apiInstance.setApiKey(
    brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY
  )

  const sendSmtpEmail = new brevo.SendSmtpEmail()
  sendSmtpEmail.subject = subject
  sendSmtpEmail.htmlContent = html
  sendSmtpEmail.sender = { name: "Electro Infinity | AGEMC", email: process.env.EMAIL_USER || "noreply@electroinfinity.com" }
  sendSmtpEmail.to = [{ email: to }]

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail)
    console.log('Email sent successfully via Brevo. ID: ' + JSON.stringify(data))
  } catch (error) {
    console.error('Error sending email via Brevo:', error)
    throw error
  }
}

// ── GET /api/auth/check-roll/:rollNo ──────────────────────────────────────
// Step 1 of activation — check roll number exists and is not yet activated
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

    res.json({ success: true, name: user.name, batch: user.batch })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── POST /api/auth/activate ───────────────────────────────────────────────
// Student sets password for the first time
// Body: { rollNumber, password }
router.post('/activate', async (req, res) => {
  try {
    const { rollNumber, password } = req.body

    if (!rollNumber || !password) {
      return res.status(400).json({ success: false, error: 'Roll number and password required' })
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' })
    }

    const user = await User.findOne({ rollNumber: rollNumber.toUpperCase(), role: { $in: ['student', 'cr'] } })

    if (!user)            return res.status(404).json({ success: false, error: 'Roll number not found' })
    if (user.isVerified)  return res.status(400).json({ success: false, error: 'Already activated. Go to Login.' })

    user.password   = password
    user.isVerified = true
    await user.save()

    const token = signToken(user._id)
    user.password = undefined

    res.json({ success: true, message: 'Account activated!', token, user })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── POST /api/auth/forgot-password ───────────────────────────────────────
// Student enters their roll number — OTP sent to their Gmail
// Body: { rollNumber }
router.post('/forgot-password', async (req, res) => {
  try {
    const { rollNumber } = req.body
    if (!rollNumber) return res.status(400).json({ success: false, error: 'Roll number required' })

    const user = await User.findOne({ rollNumber: rollNumber.toUpperCase(), role: { $in: ['student', 'cr'] } })

    if (!user) {
      return res.status(404).json({ success: false, error: 'Roll number not found' })
    }
    if (!user.isVerified) {
      return res.status(400).json({
        success: false,
        error: 'Account not activated yet. Go to Activate Account instead.',
      })
    }
    if (!user.email) {
      return res.status(400).json({
        success: false,
        error: 'No email registered for this account. Contact your HOD.',
      })
    }

    // Generate OTP — valid for 10 minutes
    const otp = generateOTP()
    user.otp       = otp
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000)  // 10 minutes from now
    await user.save()

    // Send OTP email
    await sendEmail({
      to: user.email,
      subject: 'Electro Infinity — Password Reset OTP',
      html: `
        <div style="font-family:monospace; max-width:480px; margin:0 auto; padding:32px; background:#07060E; color:#F0EFF8; border:1px solid rgba(255,255,255,0.1);">
          <h2 style="font-family:serif; font-size:22px; margin:0 0 8px;">Password Reset</h2>
          <p style="opacity:0.6; font-size:14px; margin:0 0 24px;">Electro Infinity · EE Club, AGEMC</p>

          <p style="font-size:14px; margin:0 0 16px;">Hi ${user.name},</p>
          <p style="font-size:14px; opacity:0.8; margin:0 0 24px;">
            Your OTP to reset your password:
          </p>

          <div style="background:rgba(102,87,245,0.15); border:1px solid rgba(102,87,245,0.4); padding:20px; text-align:center; margin:0 0 24px;">
            <span style="font-size:36px; letter-spacing:12px; font-weight:bold; color:#9D90FA;">${otp}</span>
          </div>

          <p style="font-size:13px; opacity:0.5; margin:0 0 8px;">⏱ This OTP expires in 10 minutes.</p>
          <p style="font-size:13px; opacity:0.5; margin:0;">If you didn't request this, ignore this email.</p>
        </div>
      `,
    })

    // Return masked email so user knows where OTP was sent
    const maskedEmail = user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')

    res.json({
      success: true,
      message: `OTP sent to ${maskedEmail}`,
      maskedEmail,
    })
  } catch (err) {
    console.error('OTP email error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to send OTP. Try again.' })
  }
})

// ── POST /api/auth/verify-otp ─────────────────────────────────────────────
// Check OTP is correct and not expired — returns a short-lived reset token
// Body: { rollNumber, otp }
router.post('/verify-otp', async (req, res) => {
  try {
    const { rollNumber, otp } = req.body

    if (!rollNumber || !otp) {
      return res.status(400).json({ success: false, error: 'Roll number and OTP required' })
    }

    const user = await User.findOne({ rollNumber: rollNumber.toUpperCase(), role: { $in: ['student', 'cr'] } })

    if (!user) return res.status(404).json({ success: false, error: 'Roll number not found' })

    // Check OTP matches
    if (!user.otp || user.otp !== otp.trim()) {
      return res.status(400).json({ success: false, error: 'Wrong OTP. Check your email.' })
    }

    // Check OTP hasn't expired
    if (!user.otpExpiry || new Date() > user.otpExpiry) {
      // Clear expired OTP
      user.otp = ''; user.otpExpiry = null
      await user.save()
      return res.status(400).json({ success: false, error: 'OTP expired. Request a new one.' })
    }

    // OTP verified — give a short-lived reset token (5 min) so they can set a new password
    const resetToken = jwt.sign(
      { id: user._id, purpose: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    )

    // Clear OTP so it can't be reused
    user.otp = ''; user.otpExpiry = null
    await user.save()

    res.json({ success: true, resetToken })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
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
    await user.save()

    res.json({ success: true, message: 'Password reset successfully! You can now log in.' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
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

    const token = signToken(user._id)
    user.password = undefined
    res.json({ success: true, token, user })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
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
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── PATCH /api/auth/me ────────────────────────────────────────────────────
router.patch('/me', protect, async (req, res) => {
  try {
    const allowed = ['name', 'phone']
    const updates = {}
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f] })
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true })
    res.json({ success: true, user })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
