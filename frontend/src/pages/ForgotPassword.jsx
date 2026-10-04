import { useState, useEffect, useRef, useCallback } from 'react'
import { Check, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { forgotPassword, verifyOtp, resetPassword } from '../api/auth'

const COLORS = {
  canvas: '#ffffff',
  ink: '#181d26',
  inkActive: '#0d1218',
  body: '#333840',
  muted: '#41454d',
  hairline: '#dddddd',
  soft: '#f8fafc',
  link: '#1b61c9',
  success: '#006400',
  successSurface: '#f2faf2',
  successBorder: '#b8dfba',
  coral: '#aa2d00',
  errorSurface: '#fff7f4',
  errorBorder: '#f0d6cd',
  warn: '#7c4a00',
  warnSurface: '#fffbf0',
  warnBorder: '#f0e0b0',
}

const DISPLAY_FONT = '"Haas Groot Disp", "Haas", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
const TEXT_FONT = '"Haas", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

const pageStyle = {
  minHeight: 'var(--page-min-h)',
  backgroundColor: COLORS.canvas,
  color: COLORS.ink,
  fontFamily: TEXT_FONT,
}

const cardStyle = {
  width: '100%',
  maxWidth: 448,
  backgroundColor: COLORS.canvas,
  border: `1px solid ${COLORS.hairline}`,
  borderRadius: 10,
  padding: 32,
  boxShadow: '0 12px 30px rgba(24, 29, 38, 0.06)',
}

const inputStyle = {
  width: '100%',
  minHeight: 44,
  backgroundColor: COLORS.canvas,
  color: COLORS.ink,
  borderRadius: 6,
  padding: '12px 16px',
  fontFamily: TEXT_FONT,
  fontSize: 14,
  lineHeight: 1.25,
  outline: 'none',
  transition: 'border-color 0.22s cubic-bezier(0.25, 0.1, 0.25, 1), box-shadow 0.22s cubic-bezier(0.25, 0.1, 0.25, 1)',
}

const labelStyle = {
  display: 'block',
  marginBottom: 6,
  color: COLORS.muted,
  fontFamily: TEXT_FONT,
  fontSize: 12,
  fontWeight: 500,
  lineHeight: 1.4,
  letterSpacing: 0.16,
}

const primaryButtonStyle = {
  width: '100%',
  minHeight: 48,
  backgroundColor: COLORS.ink,
  color: '#ffffff',
  border: '1px solid transparent',
  borderRadius: 12,
  padding: '16px 24px',
  fontFamily: TEXT_FONT,
  fontSize: 16,
  fontWeight: 500,
  lineHeight: 1.4,
  cursor: 'pointer',
  boxShadow: '0 5px 14px rgba(24, 29, 38, 0.10)',
  transition: 'background-color 0.22s cubic-bezier(0.25, 0.1, 0.25, 1), box-shadow 0.22s cubic-bezier(0.25, 0.1, 0.25, 1), opacity 0.22s cubic-bezier(0.25, 0.1, 0.25, 1)',
}

const secondaryButtonStyle = {
  minHeight: 36,
  backgroundColor: COLORS.canvas,
  color: COLORS.body,
  border: `1px solid ${COLORS.hairline}`,
  borderRadius: 12,
  padding: '8px 12px',
  fontFamily: TEXT_FONT,
  fontSize: 13,
  fontWeight: 500,
  lineHeight: 1.4,
  cursor: 'pointer',
  boxShadow: 'none',
  transition: 'background-color 0.22s cubic-bezier(0.25, 0.1, 0.25, 1), border-color 0.22s cubic-bezier(0.25, 0.1, 0.25, 1), color 0.22s cubic-bezier(0.25, 0.1, 0.25, 1)',
}

const linkStyle = {
  color: COLORS.link,
  fontFamily: TEXT_FONT,
  fontSize: 13,
  fontWeight: 500,
  lineHeight: 1.4,
  textDecoration: 'none',
  transition: 'color 0.22s cubic-bezier(0.25, 0.1, 0.25, 1)',
}

const tabStyle = {
  flex: 1,
  minHeight: 40,
  padding: '10px 12px',
  backgroundColor: COLORS.canvas,
  color: COLORS.body,
  border: 'none',
  borderRadius: 6,
  fontFamily: TEXT_FONT,
  fontSize: 13,
  fontWeight: 500,
  lineHeight: 1.4,
  cursor: 'pointer',
  transition: 'background-color 0.15s ease, color 0.15s ease',
}

const activeTabStyle = {
  ...tabStyle,
  backgroundColor: COLORS.ink,
  color: COLORS.canvas,
}

function formatCountdown(seconds) {
  if (!seconds || seconds <= 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function passwordStrength(pw) {
  if (!pw) return { level: 'none', label: '', checks: { length: false, letter: false, number: false } }
  const checks = {
    length: pw.length >= 8,
    letter: /[A-Za-z]/.test(pw),
    number: /\d/.test(pw),
  }
  const score = Object.values(checks).filter(Boolean).length
  let level = 'weak'
  if (score >= 3 || pw.length >= 10) level = 'strong'
  else if (score >= 2) level = 'medium'
  return { level, label: level === 'none' ? '' : level, checks }
}

const STRENGTH_COLORS = {
  none: COLORS.hairline,
  weak: COLORS.coral,
  medium: COLORS.warn,
  strong: COLORS.success,
}

function OtpInputBox({ value, onChange, onKeyDown, onPaste, autoFocus, error, success }) {
  const ref = useRef(null)

  useEffect(() => {
    if (autoFocus && ref.current) ref.current.focus()
  }, [autoFocus])

  const borderColor = error
    ? COLORS.coral
    : success
      ? COLORS.success
      : COLORS.hairline

  const bg = success ? COLORS.successSurface : COLORS.canvas

  return (
    <input
      ref={ref}
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      autoCorrect="off"
      spellCheck={false}
      maxLength={1}
      value={value}
      onChange={(e) => {
        const v = e.target.value.replace(/\D/g, '').slice(0, 1)
        onChange(v)
      }}
      onKeyDown={(e) => onKeyDown(e, ref)}
      onPaste={onPaste}
      className="otp-box"
      style={{
        width: 48,
        height: 56,
        textAlign: 'center',
        fontSize: 22,
        fontWeight: 500,
        fontFamily: TEXT_FONT,
        color: COLORS.ink,
        backgroundColor: bg,
        border: `2px solid ${borderColor}`,
        borderRadius: 10,
        outline: 'none',
        transition: 'border-color 0.15s ease, background-color 0.15s ease',
        caretColor: COLORS.ink,
      }}
    />
  )
}

function CheckMark() {
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: COLORS.successSurface, borderRadius: 10, border: `2px solid ${COLORS.success}`,
    }}>
      <Check size={22} style={{ color: COLORS.success }} />
    </div>
  )
}

function StrengthBar({ level }) {
  const pct = level === 'strong' ? 100 : level === 'medium' ? 60 : level === 'weak' ? 30 : 0
  return (
    <div style={{ height: 4, borderRadius: 2, backgroundColor: COLORS.hairline, overflow: 'hidden', marginTop: 8 }}>
      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: STRENGTH_COLORS[level] || COLORS.hairline, transition: 'width 0.2s ease, background-color 0.2s ease' }} />
    </div>
  )
}

function CheckItem({ done, children }) {
  return (
    <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: done ? COLORS.success : COLORS.muted, transition: 'color 0.15s ease' }}>
      <span style={{
        width: 16, height: 16, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: done ? COLORS.successSurface : COLORS.soft, border: `1px solid ${done ? COLORS.successBorder : COLORS.hairline}`,
        fontSize: 10, color: done ? COLORS.success : COLORS.muted, flexShrink: 0,
      }}>
        {done ? '✓' : ''}
      </span>
      {children}
    </li>
  )
}

export default function ForgotPassword() {
  const navigate = useNavigate()

  // ── Step 1: Send OTP ─────────────────────────────────────────────────────
  const [step, setStep] = useState(1)
  const [tab, setTab] = useState('student')
  const [identifier, setIdentifier] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')

  // ── Step 2: Enter OTP ────────────────────────────────────────────────────
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [otpSuccess, setOtpSuccess] = useState(false)
  const [attemptsLeft, setAttemptsLeft] = useState(5)
  const [shake, setShake] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [expiresIn, setExpiresIn] = useState(0)
  const [resetToken, setResetToken] = useState('')

  // ── Step 3: New password ─────────────────────────────────────────────────
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetSuccess, setResetSuccess] = useState(false)

  const boxRefs = useRef([])
  const shakeTimerRef = useRef(null)
  const resendIntervalRef = useRef(null)
  const expireIntervalRef = useRef(null)

  // ── Step 2 timers ────────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== 2) {
      clearInterval(resendIntervalRef.current)
      clearInterval(expireIntervalRef.current)
      return
    }
    if (resendCountdown > 0) {
      resendIntervalRef.current = setInterval(() => setResendCountdown((n) => n - 1), 1000)
    }
    return () => clearInterval(resendIntervalRef.current)
  }, [step, resendCountdown])

  useEffect(() => {
    if (step !== 2 || expiresIn <= 0) {
      clearInterval(expireIntervalRef.current)
      return
    }
    expireIntervalRef.current = setInterval(() => setExpiresIn((n) => n - 1), 1000)
    return () => clearInterval(expireIntervalRef.current)
  }, [step, expiresIn])

  // Cleanup on unmount
  useEffect(() => () => {
    clearInterval(resendIntervalRef.current)
    clearInterval(expireIntervalRef.current)
  }, [])

  // ── Step 1: Send OTP ─────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault()
    const id = identifier.trim()
    if (!id) return
    setResendSuccess(false)
    setOtpError('')
    setOtpLoading(true)

    try {
      const payload = tab === 'student'
        ? { rollNumber: id.toUpperCase() }
        : { email: id.toLowerCase() }

      const res = await forgotPassword(payload)
      setMaskedEmail(res.data.maskedEmail)
      setAttemptsLeft(res.data.attemptsLeft ?? 5)
      setExpiresIn(res.data.expiresInSeconds ?? 600)
      setResendCountdown(res.data.resendInSeconds ?? 30)
      setOtpDigits(['', '', '', '', '', ''])
      setOtpSuccess(false)
      setOtpError('')
      setResetToken('')
      setStep(2)

      // Auto-focus first box after render
      setTimeout(() => boxRefs.current[0]?.focus(), 50)
    } catch (err) {
      const status = err.response?.status
      if (status === 429) {
        const msg = err.response?.data?.error || 'Too many OTP requests. Try again in a few minutes.'
        setOtpError(msg)
        setResendCountdown(Math.ceil((err.response?.data?.resendInSeconds ?? 60)))
      } else if (err.response?.status >= 500 || !err.response) {
        setOtpError("Couldn't send the code. Please try again.")
      } else {
        setOtpError(err.response?.data?.error || 'Failed to send OTP')
      }
    } finally {
      setOtpLoading(false)
    }
  }

  // ── Step 2: Resend ───────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCountdown > 0 || resending) return
    setResending(true)
    setResendSuccess(false)
    setOtpError('')
    setOtpDigits(['', '', '', '', '', ''])
    setOtpSuccess(false)

    try {
      const id = identifier.trim()
      const payload = tab === 'student'
        ? { rollNumber: id.toUpperCase() }
        : { email: id.toLowerCase() }

      const res = await forgotPassword(payload)
      setMaskedEmail(res.data.maskedEmail)
      setAttemptsLeft(res.data.attemptsLeft ?? 5)
      setExpiresIn(res.data.expiresInSeconds ?? 600)
      setResendCountdown(res.data.resendInSeconds ?? 30)
      setResendSuccess(true)
      setOtpError('New OTP sent — check your inbox.')
      setTimeout(() => boxRefs.current[0]?.focus(), 50)
    } catch (err) {
      if (err.response?.status === 429) {
        setResendCountdown(Math.ceil((err.response?.data?.resendInSeconds ?? 60)))
        setOtpError(err.response?.data?.error || 'Too many OTP requests. Try again in a few minutes.')
      } else if (err.response?.status >= 500 || !err.response) {
        setOtpError("Couldn't send the code. Please try again.")
      } else {
        setOtpError(err.response?.data?.error || 'Failed to resend OTP')
      }
    } finally {
      setResending(false)
    }
  }

  // ── Step 2: OTP box helpers ──────────────────────────────────────────────
  const updateDigit = useCallback((index, value) => {
    setOtpDigits((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
    setOtpError('')
    setOtpSuccess(false)
    setShake(false)
  }, [])

  const handleBoxKeyDown = useCallback((e, ref) => {
    const index = boxRefs.current.indexOf(ref)

    if (e.key === 'Backspace') {
      e.preventDefault()
      if (otpDigits[index]) {
        updateDigit(index, '')
      } else if (index > 0) {
        boxRefs.current[index - 1]?.focus()
        updateDigit(index - 1, '')
      }
      return
    }

    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      boxRefs.current[index - 1]?.focus()
      return
    }
    if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault()
      boxRefs.current[index + 1]?.focus()
      return
    }

    if (!/^\d$/.test(e.key)) {
      if (e.key !== 'Tab') e.preventDefault()
      return
    }

    e.preventDefault()
    updateDigit(index, e.key)

    if (index < 5) {
      setTimeout(() => boxRefs.current[index + 1]?.focus(), 20)
    }
  }, [otpDigits, updateDigit])

  const handleBoxPaste = useCallback((e) => {
    e.preventDefault()
    const text = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6)
    if (!text) return
    const next = [...otpDigits]
    for (let i = 0; i < 6; i++) {
      if (i < text.length) next[i] = text[i]
    }
    setOtpDigits(next)
    setOtpError('')
    setOtpSuccess(false)
    setShake(false)
    const focusIndex = Math.min(text.length, 5)
    setTimeout(() => boxRefs.current[focusIndex]?.focus(), 20)
  }, [otpDigits])

  // Auto-submit when 6th digit lands
  useEffect(() => {
    if (step === 2 && otpDigits.every((d) => d !== '') && !otpLoading && !otpSuccess) {
      handleVerify()
    }
  }, [otpDigits])

  // ── Step 2: Verify ───────────────────────────────────────────────────────
  const handleVerify = async () => {
    const code = otpDigits.join('')
    if (code.length !== 6 || otpLoading || otpSuccess) return

    setOtpLoading(true)
    setOtpError('')
    setShake(false)

    try {
      const payload = tab === 'student'
        ? { rollNumber: identifier.trim().toUpperCase(), otp: code }
        : { email: identifier.trim().toLowerCase(), otp: code }

      const res = await verifyOtp(payload)
      setResetToken(res.data.resetToken)
      setOtpSuccess(true)

      setTimeout(() => {
        setStep(3)
      }, 700)
    } catch (err) {
      const status = err.response?.status
      const attempts = err.response?.data?.attemptsLeft ?? attemptsLeft

      if (status === 429) {
        setAttemptsLeft(0)
        setOtpError('Too many attempts. Request a new code.')
      } else if (status === 400) {
        setAttemptsLeft(attempts)
        setOtpError(err.response?.data?.error || 'Wrong code. Please try again.')
        triggerShake()
      } else if (err.response?.status >= 500 || !err.response) {
        setOtpError("Couldn't verify the code. Please try again.")
      } else {
        setOtpError(err.response?.data?.error || 'Verification failed')
        triggerShake()
      }

      if (attempts <= 1 && status !== 429) {
        setAttemptsLeft(0)
        setOtpError('Too many attempts. Request a new code.')
      }
    } finally {
      setOtpLoading(false)
    }
  }

  const triggerShake = () => {
    setShake(true)
    clearTimeout(shakeTimerRef.current)
    shakeTimerRef.current = setTimeout(() => setShake(false), 600)
  }

  const handleBackToEmail = () => {
    setStep(1)
    setOtpError('')
    setOtpSuccess(false)
    setOtpDigits(['', '', '', '', '', ''])
    setShake(false)
    setResendSuccess(false)
    setResendCountdown(0)
    setExpiresIn(0)
    setResetToken('')
  }

  // ── Step 3: Reset password ───────────────────────────────────────────────
  const strength = passwordStrength(password)
  const passwordsMatch = password === confirm && confirm !== ''
  const checks = [
    { done: strength.checks.length, label: 'At least 8 characters' },
    { done: strength.checks.letter, label: 'One letter' },
    { done: strength.checks.number, label: 'One number' },
  ]
  const canSubmit = password.length >= 8 && strength.checks.letter && strength.checks.number && passwordsMatch

  const handleReset = async (e) => {
    e.preventDefault()
    if (!canSubmit || resetLoading) return
    setResetError('')
    setResetLoading(true)

    try {
      await resetPassword({ resetToken, newPassword: password })
      setResetSuccess(true)
      setTimeout(() => navigate('/login', { state: { message: 'Password reset successful! You can now sign in.' } }), 1200)
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.error?.includes('expired')) {
        setResetError('Reset link expired. Go back and request a new code.')
        setTimeout(() => handleBackToEmail(), 2000)
      } else if (err.response?.status >= 500 || !err.response) {
        setResetError("Couldn't update the password. Please try again.")
      } else {
        setResetError(err.response?.data?.error || 'Reset failed')
      }
    } finally {
      setResetLoading(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  const stepLabels = ['Forgot Password', 'Verify Email', 'Create Password']

  const tabBorderColor = step === 1 && tab ? COLORS.ink : COLORS.hairline

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-28" style={pageStyle}>
      <div style={cardStyle}>
        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-center gap-3">
          {[1, 2, 3].map((stepNumber, index) => (
            <div key={stepNumber} className="flex items-center gap-3">
              <div style={{
                width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, border: `1px solid ${step > stepNumber ? COLORS.successBorder : step === stepNumber ? COLORS.ink : COLORS.hairline}`,
                borderRadius: 9999,
                color: step > stepNumber ? COLORS.success : step === stepNumber ? COLORS.canvas : COLORS.muted,
                backgroundColor: step > stepNumber ? COLORS.successSurface : step === stepNumber ? COLORS.ink : COLORS.canvas,
                fontFamily: TEXT_FONT, fontSize: 12, fontWeight: 500, lineHeight: 1,
              }}>
                {step > stepNumber ? <Check size={14} /> : stepNumber}
              </div>
              {index < 2 && (
                <div style={{
                  height: '1px', width: 32,
                  backgroundColor: step > stepNumber ? COLORS.success : COLORS.hairline,
                  transition: 'background-color 0.2s ease',
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Title block */}
        <div className="mb-8 text-center">
          <span className="mb-1 block" style={{ color: COLORS.coral, fontFamily: TEXT_FONT, fontSize: 12, fontWeight: 500, lineHeight: 1.4, letterSpacing: 0.16, textTransform: 'uppercase' }}>
            Account Recovery
          </span>
          <h1 style={{ margin: 0, color: COLORS.ink, fontFamily: DISPLAY_FONT, fontSize: 28, fontWeight: 400, lineHeight: 1.2, letterSpacing: 0 }}>
            {stepLabels[step - 1]}
          </h1>
        </div>

        {/* ── STEP 1: Send OTP ───────────────────────────────────────────── */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
            <div className="flex gap-1 p-1" style={{ borderRadius: 10, backgroundColor: COLORS.canvas, border: `1px solid ${tabBorderColor}` }}>
              {['student', 'faculty'].map((t) => (
                <button key={t} type="button" onClick={() => { setTab(t); setOtpError(''); setIdentifier('') }} style={t === tab ? activeTabStyle : tabStyle}>
                  {t === 'student' ? 'Student' : 'Faculty'}
                </button>
              ))}
            </div>

            <p className="text-center" style={{ margin: 0, color: COLORS.body, fontFamily: TEXT_FONT, fontSize: 14, fontWeight: 400, lineHeight: 1.25 }}>
              {tab === 'student'
                ? 'Enter your roll number. We\'ll send a 6-digit code to your registered email.'
                : 'Enter your institutional email. We\'ll send a 6-digit code to reset your password.'}
            </p>

            <div>
              <label style={labelStyle}>{tab === 'student' ? 'Roll Number' : 'Institutional Email'}</label>
              {tab === 'student' ? (
                <input
                  required autoFocus
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value.toUpperCase())}
                  className="input w-full"
                  style={{ ...inputStyle, textTransform: 'uppercase' }}
                  placeholder="e.g. EE24001"
                />
              ) : (
                <input
                  required autoFocus type="email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="input w-full"
                  style={inputStyle}
                  placeholder="faculty@agemc.edu"
                />
              )}
            </div>

            {otpError && (
              <div style={{
                padding: '12px 16px', borderRadius: 10, fontSize: 13, fontFamily: TEXT_FONT, lineHeight: 1.35,
                backgroundColor: resendSuccess ? COLORS.successSurface : COLORS.errorSurface,
                border: `1px solid ${resendSuccess ? COLORS.successBorder : COLORS.errorBorder}`,
                color: resendSuccess ? COLORS.success : COLORS.coral,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                {resendSuccess && <Check size={14} style={{ color: COLORS.success, flexShrink: 0 }} />}
                {otpError}
              </div>
            )}

            <button type="submit" disabled={otpLoading || !identifier.trim()} className="mt-2 w-full" style={otpLoading ? { ...primaryButtonStyle, backgroundColor: COLORS.inkActive, boxShadow: 'none', cursor: 'not-allowed', opacity: 0.65 } : primaryButtonStyle}>
              {otpLoading ? 'Sending OTP…' : 'Send OTP to Gmail →'}
            </button>
          </form>
        )}

        {/* ── STEP 2: Enter OTP ───────────────────────────────────────────── */}
        {step === 2 && (
          <form onSubmit={(e) => { e.preventDefault(); handleVerify() }} className="flex flex-col gap-5">
            {/* Masked email card */}
            <div className="text-center" style={{ borderRadius: 10, backgroundColor: COLORS.soft, border: `1px solid ${COLORS.hairline}`, padding: '16px 20px' }}>
              <p style={{ margin: 0, color: COLORS.body, fontFamily: TEXT_FONT, fontSize: 13, lineHeight: 1.25 }}>
                We'll send a code to <strong style={{ color: COLORS.ink }}>{maskedEmail}</strong>
              </p>
              {expiresIn > 0 && (
                <p style={{ margin: '8px 0 0', color: COLORS.muted, fontFamily: TEXT_FONT, fontSize: 12, lineHeight: 1.4 }}>
                  Code expires in {formatCountdown(expiresIn)}
                </p>
              )}
              {expiresIn <= 0 && (
                <p style={{ margin: '8px 0 0', color: COLORS.coral, fontFamily: TEXT_FONT, fontSize: 12, lineHeight: 1.4, fontWeight: 500 }}>
                  Code expired
                </p>
              )}
            </div>

            {/* OTP boxes */}
            <div>
              <label style={labelStyle}>Enter 6-Digit OTP</label>
              <div
                className="flex items-center justify-between gap-2"
                style={{
                  animation: shake ? 'otpShake 0.5s ease' : 'none',
                  position: 'relative',
                }}
              >
                {otpDigits.map((digit, i) => (
                  <div key={i} style={{ position: 'relative', flex: '1 1 0', maxWidth: 48 }}>
                    {otpSuccess && <CheckMark />}
                    <OtpInputBox
                      value={digit}
                      onChange={(v) => updateDigit(i, v)}
                      onKeyDown={handleBoxKeyDown}
                      onPaste={handleBoxPaste}
                      autoFocus={i === 0}
                      error={shake && !otpSuccess}
                      success={otpSuccess}
                    />
                  </div>
                ))}
              </div>

              {shake && !otpSuccess && (
                <p style={{ margin: '8px 0 0', color: COLORS.coral, fontFamily: TEXT_FONT, fontSize: 12, lineHeight: 1.4 }}>
                  {attemptsLeft > 0 ? `Wrong code. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} left.` : 'Too many attempts. Request a new code.'}
                </p>
              )}

              {!shake && otpError && !otpSuccess && (
                <p style={{ margin: '8px 0 0', color: COLORS.coral, fontFamily: TEXT_FONT, fontSize: 12, lineHeight: 1.4 }}>
                  {otpError}
                </p>
              )}

              {otpSuccess && (
                <p style={{ margin: '8px 0 0', color: COLORS.success, fontFamily: TEXT_FONT, fontSize: 12, lineHeight: 1.4, fontWeight: 500 }}>
                  Code verified ✓
                </p>
              )}
            </div>

            {/* Verify button */}
            <button
              type="button"
              onClick={handleVerify}
              disabled={otpLoading || otpDigits.some((d) => d === '') || otpSuccess || expiresIn <= 0}
              className="mt-2 w-full"
              style={otpLoading || otpDigits.some((d) => d === '') || otpSuccess || expiresIn <= 0
                ? { ...primaryButtonStyle, backgroundColor: COLORS.inkActive, boxShadow: 'none', cursor: 'not-allowed', opacity: 0.65 }
                : primaryButtonStyle}
            >
              {otpLoading ? 'Verifying…' : 'Verify Code →'}
            </button>

            {/* Resend */}
            <div className="flex items-center justify-between gap-2 pt-2" style={{ borderTop: `1px solid ${COLORS.hairline}`, paddingTop: 16 }}>
              <button type="button" onClick={handleBackToEmail} style={secondaryButtonStyle}>
                ← Wrong {tab}?
              </button>
              {resendCountdown > 0 ? (
                <span style={{ color: COLORS.muted, fontFamily: TEXT_FONT, fontSize: 13, lineHeight: 1.4 }}>
                  Resend in {formatCountdown(resendCountdown)}
                </span>
              ) : (
                <button type="button" onClick={handleResend} disabled={resending} style={resending ? { ...secondaryButtonStyle, color: COLORS.muted, borderColor: COLORS.hairline, cursor: 'not-allowed', opacity: 0.65 } : secondaryButtonStyle}>
                  {resending ? 'Sending…' : 'Send new code'}
                </button>
              )}
            </div>
          </form>
        )}

        {/* ── STEP 3: New password ───────────────────────────────────────── */}
        {step === 3 && (
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            {resetSuccess ? (
              <div style={{
                padding: '16px', borderRadius: 10, backgroundColor: COLORS.successSurface,
                border: `1px solid ${COLORS.successBorder}`, color: COLORS.success,
                fontFamily: TEXT_FONT, fontSize: 14, fontWeight: 500, textAlign: 'center',
              }}>
                Password updated! Redirecting to sign in…
              </div>
            ) : (
              <>
                <p className="text-center" style={{ margin: '0 0 8px', color: COLORS.body, fontFamily: TEXT_FONT, fontSize: 14, lineHeight: 1.25 }}>
                  OTP verified. Create a new password for your account.
                </p>

                {/* New password */}
                <div>
                  <label style={labelStyle}>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      required autoFocus
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setResetError('') }}
                      className="input w-full"
                      style={{ ...inputStyle, paddingRight: 44 }}
                      placeholder="Min. 8 characters"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: COLORS.muted, display: 'flex' }}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <StrengthBar level={strength.level} />
                  {strength.label && (
                    <p style={{ margin: '4px 0 0', color: STRENGTH_COLORS[strength.level], fontFamily: TEXT_FONT, fontSize: 11, fontWeight: 500, textTransform: 'capitalize' }}>
                      {strength.label}
                    </p>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label style={labelStyle}>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      required
                      type={showConfirm ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => { setConfirm(e.target.value); setResetError('') }}
                      className="input w-full"
                      style={{ ...inputStyle, paddingRight: 44 }}
                      placeholder="Re-enter your password"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: COLORS.muted, display: 'flex' }}>
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirm && !passwordsMatch && (
                    <p style={{ margin: '4px 0 0', color: COLORS.coral, fontFamily: TEXT_FONT, fontSize: 12 }}>
                      Passwords do not match
                    </p>
                  )}
                  {confirm && passwordsMatch && (
                    <p style={{ margin: '4px 0 0', color: COLORS.success, fontFamily: TEXT_FONT, fontSize: 12 }}>
                      Passwords match
                    </p>
                  )}
                </div>

                {/* Requirements checklist */}
                <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {checks.map((c) => (
                    <CheckItem key={c.label} done={c.done}>{c.label}</CheckItem>
                  ))}
                </ul>

                {/* Error */}
                {resetError && (
                  <div style={{
                    padding: '12px 16px', borderRadius: 10, backgroundColor: COLORS.errorSurface,
                    border: `1px solid ${COLORS.errorBorder}`, color: COLORS.coral,
                    fontFamily: TEXT_FONT, fontSize: 13, lineHeight: 1.35,
                  }}>
                    {resetError}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!canSubmit || resetLoading}
                  className="mt-2 w-full"
                  style={!canSubmit || resetLoading
                    ? { ...primaryButtonStyle, backgroundColor: COLORS.inkActive, boxShadow: 'none', cursor: 'not-allowed', opacity: 0.65 }
                    : primaryButtonStyle}
                >
                  {resetLoading ? 'Updating…' : 'Update Password & Sign In →'}
                </button>
              </>
            )}
          </form>
        )}

        {/* Back to login */}
        <div className="mt-8 flex justify-center border-t pt-4 text-center" style={{ borderColor: COLORS.hairline }}>
          <Link to="/login" style={linkStyle}>Back to Sign in</Link>
        </div>
      </div>

      {/* Shake keyframes */}
      <style>{`
        @keyframes otpShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .otp-box:focus {
          border-color: ${COLORS.ink} !important;
          box-shadow: 0 0 0 3px rgba(24, 29, 38, 0.08);
        }
        .otp-box.shake-error {
          border-color: ${COLORS.coral} !important;
          animation: otpShake 0.5s ease;
        }
      `}</style>
    </div>
  )
}