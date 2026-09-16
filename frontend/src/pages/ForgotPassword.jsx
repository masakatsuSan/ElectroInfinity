import { useState } from 'react'
import { Check } from 'lucide-react'
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
  coral: '#aa2d00',
  errorSurface: '#fff7f4',
  errorBorder: '#f0d6cd',
}

const DISPLAY_FONT = '"Haas Groot Disp", "Haas", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
const TEXT_FONT = '"Haas", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

const pageStyle = {
  minHeight: '100vh',
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

const eyebrowStyle = {
  color: COLORS.coral,
  fontFamily: TEXT_FONT,
  fontSize: 12,
  fontWeight: 500,
  lineHeight: 1.4,
  letterSpacing: 0.16,
  textTransform: 'uppercase',
}

const stepIndicatorStyle = {
  width: 32,
  height: 32,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  border: `1px solid ${COLORS.hairline}`,
  borderRadius: 9999,
  color: COLORS.muted,
  backgroundColor: COLORS.canvas,
  fontFamily: TEXT_FONT,
  fontSize: 12,
  fontWeight: 500,
  lineHeight: 1,
}

const activeStepIndicatorStyle = {
  ...stepIndicatorStyle,
  backgroundColor: COLORS.ink,
  color: COLORS.canvas,
  borderColor: COLORS.ink,
}

const completedStepIndicatorStyle = {
  ...stepIndicatorStyle,
  backgroundColor: COLORS.success,
  color: COLORS.canvas,
  borderColor: COLORS.success,
}

export default function ForgotPassword() {
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [tab, setTab] = useState('student')
  const [rollNumber, setRollNumber] = useState('')
  const [email, setEmail] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  const identifier = tab === 'student' ? rollNumber : email

  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (!identifier.trim()) return setError(tab === 'student' ? 'Enter your roll number' : 'Enter your institutional email')
    setResendSuccess(false); setError(''); setLoading(true)

    try {
      const payload = tab === 'student'
        ? { rollNumber: identifier.trim().toUpperCase() }
        : { email: identifier.trim().toLowerCase() }

      const res = await forgotPassword(payload)
      setMaskedEmail(res.data.maskedEmail)
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true); setError('')
    try {
      const payload = tab === 'student'
        ? { rollNumber: identifier.trim().toUpperCase() }
        : { email: identifier.trim().toLowerCase() }

      const res = await forgotPassword(payload)
      setMaskedEmail(res.data.maskedEmail)
      setOtp('')
      setResendSuccess(true); setError('New OTP sent to email')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP')
    } finally {
      setResending(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) return setError('Enter the 6-digit OTP')
    setResendSuccess(false); setError(''); setLoading(true)

    try {
      const payload = tab === 'student'
        ? { rollNumber: identifier.trim().toUpperCase(), otp: otp.trim() }
        : { email: identifier.trim().toLowerCase(), otp: otp.trim() }

      const res = await verifyOtp(payload)
      setResetToken(res.data.resetToken)
      setStep(3)
    } catch (err) {
      setError(err.response?.data?.error || 'OTP verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    if (password.length < 6) return setError('Password must be at least 6 characters')
    if (password !== confirm) return setError('Passwords do not match')
    setError(''); setLoading(true)

    try {
      await resetPassword({ resetToken, newPassword: password })
      navigate('/login', { state: { message: 'Password reset successful! You can now sign in.' } })
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed')
      if (err.response?.data?.error?.includes('expired')) {
        setTimeout(() => { setStep(1); setOtp(''); setResetToken('') }, 2000)
      }
    } finally {
      setLoading(false)
    }
  }

  const stepLabel = ['Forgot Password', 'Verify Email', 'Create Password']
  const submitButtonStyle = loading
    ? { ...primaryButtonStyle, backgroundColor: COLORS.inkActive, boxShadow: 'none', cursor: 'not-allowed', opacity: 0.65 }
    : primaryButtonStyle

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

  const statusStyle = resendSuccess
    ? {
        backgroundColor: '#f2faf2',
        border: `1px solid #b8dfba`,
        borderRadius: 10,
        padding: '12px 16px',
        color: COLORS.success,
        fontFamily: TEXT_FONT,
        fontSize: 13,
        fontWeight: 500,
        lineHeight: 1.35,
        textAlign: 'center',
      }
    : {
        backgroundColor: COLORS.errorSurface,
        border: `1px solid ${COLORS.errorBorder}`,
        borderRadius: 10,
        padding: '12px 16px',
        color: COLORS.coral,
        fontFamily: TEXT_FONT,
        fontSize: 13,
        fontWeight: 500,
        lineHeight: 1.35,
        textAlign: 'center',
      }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-28" style={pageStyle}>
      <div style={cardStyle}>
        <div className="mb-8 flex items-center justify-center gap-3">
          {[1, 2, 3].map((stepNumber, index) => (
            <div key={stepNumber} className="flex items-center gap-3">
              <div style={step > stepNumber ? completedStepIndicatorStyle : step === stepNumber ? activeStepIndicatorStyle : stepIndicatorStyle}>
                {step > stepNumber ? <Check size={14} /> : stepNumber}
              </div>
              {index < 2 && <div className="h-px w-8" style={{ backgroundColor: step > stepNumber ? COLORS.success : COLORS.hairline, transition: 'background-color 0.2s ease' }} />}
            </div>
          ))}
        </div>

        <div className="mb-8 text-center">
          <span className="mb-1 block" style={eyebrowStyle}>
            Account Recovery
          </span>
          <h1 style={{ margin: 0, color: COLORS.ink, fontFamily: DISPLAY_FONT, fontSize: 28, fontWeight: 400, lineHeight: 1.2, letterSpacing: 0 }}>
            {stepLabel[step - 1]}
          </h1>
        </div>

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
            <div className="flex gap-1 border p-1" style={{ borderRadius: 10, backgroundColor: COLORS.canvas, borderColor: COLORS.hairline }}>
              <button
                type="button"
                onClick={() => { setTab('student'); setError('') }}
                style={tab === 'student' ? activeTabStyle : tabStyle}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => { setTab('faculty'); setError('') }}
                style={tab === 'faculty' ? activeTabStyle : tabStyle}
              >
                Faculty
              </button>
            </div>

            <p className="text-center" style={{ margin: 0, color: COLORS.body, fontFamily: TEXT_FONT, fontSize: 14, fontWeight: 400, lineHeight: 1.25 }}>
              {tab === 'student'
                ? 'Enter your roll number. We\'ll send a 6-digit one-time password to your registered email.'
                : 'Enter your institutional email. We\'ll send a 6-digit one-time password to reset your password.'}
            </p>

            <div>
              <label style={labelStyle}>
                {tab === 'student' ? 'Roll Number' : 'Institutional Email'}
              </label>
              {tab === 'student' ? (
                <input
                  required autoFocus
                  value={rollNumber}
                  onChange={e => setRollNumber(e.target.value.toUpperCase())}
                  className="input w-full"
                  style={{ ...inputStyle, textTransform: 'uppercase' }}
                  placeholder="e.g. EE24001"
                />
              ) : (
                <input
                  required autoFocus
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input w-full"
                  style={inputStyle}
                  placeholder="faculty@agemc.edu"
                />
              )}
            </div>
            {error && <p style={statusStyle}>{error}</p>}
            <button type="submit" disabled={loading} className="mt-2 w-full" style={submitButtonStyle}>
              {loading ? 'Sending OTP…' : 'Send Verification OTP →'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
            <div className="border p-4 text-center" style={{ borderRadius: 10, backgroundColor: COLORS.soft, borderColor: COLORS.hairline }}>
              <p style={{ margin: 0, color: COLORS.body, fontFamily: TEXT_FONT, fontSize: 13, fontWeight: 400, lineHeight: 1.25 }}>OTP sent to</p>
              <p style={{ margin: '2px 0 0', color: COLORS.ink, fontFamily: TEXT_FONT, fontSize: 15, fontWeight: 500, lineHeight: 1.4 }}>
                {maskedEmail}
              </p>
              <p style={{ margin: '8px 0 0', color: COLORS.muted, fontFamily: TEXT_FONT, fontSize: 11, fontWeight: 400, lineHeight: 1.4 }}>
                Check Spam if not in inbox · Valid for 10 min
              </p>
            </div>

            <div>
              <label style={labelStyle}>
                Enter 6-Digit OTP
              </label>
              <input
                required autoFocus
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="input w-full text-center"
                style={{ ...inputStyle, fontSize: 22, fontWeight: 400, letterSpacing: '0.3em', fontFamily: TEXT_FONT }}
                placeholder="000000"
                maxLength={6}
                inputMode="numeric"
              />
            </div>

            {error && (
              <p style={statusStyle}>
                {resendSuccess ? <><Check size={14} /> {error}</> : error}
              </p>
            )}

            <button type="submit" disabled={loading || otp.length !== 6} className="mt-2 w-full" style={submitButtonStyle}>
              {loading ? 'Verifying…' : 'Verify Code →'}
            </button>

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setStep(1); setResendSuccess(false); setError('') }}
                style={secondaryButtonStyle}
              >
                ← Wrong {tab}?
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                style={{ ...secondaryButtonStyle, ...(resending ? { color: COLORS.muted, borderColor: COLORS.hairline, cursor: 'not-allowed', opacity: 0.65 } : {}) }}
              >
                {resending ? 'Sending…' : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <p className="mb-2 text-center" style={{ margin: '0 0 16px', color: COLORS.body, fontFamily: TEXT_FONT, fontSize: 14, fontWeight: 400, lineHeight: 1.25 }}>
              OTP verified. Enter your new password below.
            </p>
            <div>
              <label style={labelStyle}>
                New Password
              </label>
              <input
                required autoFocus type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input w-full"
                style={inputStyle}
                placeholder="Min. 6 characters"
              />
            </div>
            <div>
              <label style={labelStyle}>
                Confirm New Password
              </label>
              <input
                required type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="input w-full"
                style={inputStyle}
                placeholder="Confirm new password"
              />
            </div>
            {error && <p style={statusStyle}>{error}</p>}
            <button type="submit" disabled={loading} className="mt-2 w-full" style={submitButtonStyle}>
              {loading ? 'Updating…' : 'Update Password & Sign In →'}
            </button>
          </form>
        )}

        <div className="mt-8 flex justify-center border-t pt-4 text-center" style={{ borderColor: COLORS.hairline }}>
          <Link to="/login" style={linkStyle}>
            Back to Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
