import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { checkRoll, verifyActivationOtp, activateAccount } from '../api/auth'

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
  width: '100%',
  minHeight: 48,
  backgroundColor: COLORS.canvas,
  color: COLORS.ink,
  border: `1px solid ${COLORS.hairline}`,
  borderRadius: 12,
  padding: '16px 24px',
  fontFamily: TEXT_FONT,
  fontSize: 16,
  fontWeight: 500,
  lineHeight: 1.4,
  cursor: 'pointer',
  boxShadow: 'none',
  transition: 'background-color 0.22s cubic-bezier(0.25, 0.1, 0.25, 1), border-color 0.22s cubic-bezier(0.25, 0.1, 0.25, 1)',
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

const errorStatusStyle = {
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

const eyebrowStyle = {
  color: COLORS.muted,
  fontFamily: TEXT_FONT,
  fontSize: 12,
  fontWeight: 500,
  lineHeight: 1.4,
  letterSpacing: 0.16,
  textTransform: 'uppercase',
}

export default function Activate() {
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [rollNo, setRollNo] = useState('')
  const [name, setName] = useState('')
  const [batch, setBatch] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [activationToken, setActivationToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)

  const handleCheckRoll = async (e) => {
    e.preventDefault()
    if (!rollNo.trim()) return setError('Enter your roll number')
    setError('')
    setLoading(true)

    try {
      const res = await checkRoll(rollNo.trim())
      setName(res.data.name)
      setBatch(res.data.batch)
      setMaskedEmail(res.data.maskedEmail || '')
      setOtpSent(res.data.otpSent)
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (!otp.trim()) return setError('Enter the OTP sent to your email')
    if (otp.trim().length !== 6) return setError('OTP must be 6 digits')
    setError('')
    setLoading(true)

    try {
      const res = await verifyActivationOtp({ rollNumber: rollNo.trim(), otp: otp.trim() })
      setActivationToken(res.data.activationToken)
      setStep(3)
    } catch (err) {
      setError(err.response?.data?.error || 'OTP verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleActivate = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) return setError('Password must be at least 6 characters')
    if (password !== confirm) return setError('Passwords do not match')

    setLoading(true)
    try {
      const res = await activateAccount({ rollNumber: rollNo.trim(), password, activationToken })
      const { token, user } = res.data
      localStorage.setItem('ei_token', token)
      localStorage.setItem('ei_user', JSON.stringify(user))
      navigate('/students')
    } catch (err) {
      setError(err.response?.data?.error || 'Activation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendTimer > 0) return
    setError('')
    setResendTimer(60)
    try {
      await checkRoll(rollNo.trim())
      setOtpSent(true)
    } catch {
      // ignore
    }
    const t = setInterval(() => setResendTimer((c) => Math.max(0, c - 1)), 1000)
    setTimeout(() => clearInterval(t), 60000)
  }

  const submitButtonStyle = loading
    ? { ...primaryButtonStyle, backgroundColor: COLORS.inkActive, boxShadow: 'none', cursor: 'not-allowed', opacity: 0.65 }
    : primaryButtonStyle

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

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-28" style={pageStyle}>
      <div style={cardStyle}>
        <div className="mb-8 flex items-center justify-center gap-3">
          <div style={step >= 1 ? activeStepIndicatorStyle : stepIndicatorStyle}>1</div>
          <div className="h-px w-10" style={{ backgroundColor: step >= 2 ? COLORS.ink : COLORS.hairline, transition: 'background-color 0.2s ease' }} />
          <div style={step >= 2 ? activeStepIndicatorStyle : stepIndicatorStyle}>2</div>
          <div className="h-px w-10" style={{ backgroundColor: step >= 3 ? COLORS.ink : COLORS.hairline, transition: 'background-color 0.2s ease' }} />
          <div style={step >= 3 ? activeStepIndicatorStyle : stepIndicatorStyle}>3</div>
        </div>

        {step === 1 ? (
          <>
            <div className="mb-8 text-center">
              <span className="mb-2 block" style={{ ...eyebrowStyle, color: COLORS.coral }}>
                New Student Activation
              </span>
              <h1 className="mb-2" style={{ margin: '0 0 8px', color: COLORS.ink, fontFamily: DISPLAY_FONT, fontSize: 30, fontWeight: 400, lineHeight: 1.2, letterSpacing: 0 }}>
                Activate Account
              </h1>
              <p style={{ margin: 0, color: COLORS.body, fontFamily: TEXT_FONT, fontSize: 14, fontWeight: 400, lineHeight: 1.25 }}>
                Enter your university roll number to verify your pre-registered account.
              </p>
            </div>

            <form onSubmit={handleCheckRoll} className="flex flex-col gap-5">
              <div>
                <label style={labelStyle}>
                  Roll Number
                </label>
                <input
                  required
                  value={rollNo}
                  onChange={e => setRollNo(e.target.value.toUpperCase())}
                  className="input w-full"
                  style={{ ...inputStyle, textTransform: 'uppercase' }}
                  placeholder="e.g. EE24001"
                  autoFocus
                />
              </div>

              {error && <p style={errorStatusStyle}>{error}</p>}

              <button type="submit" disabled={loading} className="mt-2 w-full" style={submitButtonStyle}>
                {loading ? 'Verifying Roll Number…' : 'Continue →'}
              </button>
            </form>
          </>
        ) : step === 2 ? (
          <>
            <div className="mb-6 text-center">
              <span className="mb-1 block" style={{ ...eyebrowStyle, color: COLORS.coral }}>
                Verify Your Identity
              </span>
              <h1 style={{ margin: 0, color: COLORS.ink, fontFamily: DISPLAY_FONT, fontSize: 28, fontWeight: 400, lineHeight: 1.2, letterSpacing: 0 }}>
                Enter Verification OTP
              </h1>
            </div>

            <div className="mb-6 border p-4 text-center" style={{ borderRadius: 10, backgroundColor: COLORS.soft, borderColor: COLORS.hairline }}>
              <p style={{ margin: 0, color: COLORS.ink, fontFamily: TEXT_FONT, fontSize: 16, fontWeight: 500, lineHeight: 1.4 }}>
                {name}
              </p>
              <p className="mt-0.5" style={{ margin: '2px 0 0', color: COLORS.muted, fontFamily: TEXT_FONT, fontSize: 12, fontWeight: 500, lineHeight: 1.4, letterSpacing: 0.16, textTransform: 'uppercase' }}>
                {rollNo} · Batch {batch}
              </p>
              {maskedEmail && (
                <p className="mt-1" style={{ margin: 0, color: COLORS.muted, fontFamily: TEXT_FONT, fontSize: 12, lineHeight: 1.4 }}>
                  OTP sent to {maskedEmail}
                </p>
              )}
            </div>

            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              <div>
                <label style={labelStyle}>
                  6-Digit OTP
                </label>
                <input
                  required
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input w-full text-center tracking-[0.5em]"
                  style={{ ...inputStyle, fontSize: 22, fontWeight: 600 }}
                  placeholder="1 2 3 4 5 6"
                  autoFocus
                />
              </div>

              {error && <p style={errorStatusStyle}>{error}</p>}

              <button type="submit" disabled={loading} className="mt-2 w-full" style={submitButtonStyle}>
                {loading ? 'Verifying…' : 'Verify OTP →'}
              </button>

              <div className="flex items-center justify-between text-[13px]">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError('') }}
                  className="font-semibold text-body-muted hover:text-ink transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendTimer > 0}
                  className={`font-semibold transition-colors ${resendTimer > 0 ? 'text-ink-muted-48 cursor-not-allowed' : 'text-primary hover:underline'}`}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="mb-6 text-center">
              <span className="mb-1 block" style={{ ...eyebrowStyle, color: COLORS.success }}>
                Identity Confirmed
              </span>
              <h1 style={{ margin: 0, color: COLORS.ink, fontFamily: DISPLAY_FONT, fontSize: 28, fontWeight: 400, lineHeight: 1.2, letterSpacing: 0 }}>
                Set Your Password
              </h1>
            </div>

            <div className="mb-6 border p-4 text-center" style={{ borderRadius: 10, backgroundColor: COLORS.soft, borderColor: COLORS.hairline }}>
              <p style={{ margin: 0, color: COLORS.ink, fontFamily: TEXT_FONT, fontSize: 16, fontWeight: 500, lineHeight: 1.4 }}>
                {name}
              </p>
              <p className="mt-0.5" style={{ margin: '2px 0 0', color: COLORS.muted, fontFamily: TEXT_FONT, fontSize: 12, fontWeight: 500, lineHeight: 1.4, letterSpacing: 0.16, textTransform: 'uppercase' }}>
                {rollNo} · Batch {batch}
              </p>
            </div>

            <form onSubmit={handleActivate} className="flex flex-col gap-4">
              <div>
                <label style={labelStyle}>
                  Create Password (min. 6 chars)
                </label>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input w-full"
                  style={inputStyle}
                  placeholder="••••••••"
                  autoFocus
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Confirm Password
                </label>
                <input
                  required
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="input w-full"
                  style={inputStyle}
                  placeholder="••••••••"
                />
              </div>

              {error && <p style={errorStatusStyle}>{error}</p>}

              <button type="submit" disabled={loading} className="mt-2 w-full" style={submitButtonStyle}>
                {loading ? 'Activating…' : 'Activate & Enter Dashboard →'}
              </button>

              <button
                type="button"
                onClick={() => { setStep(2); setError('') }}
                className="mt-2 w-full"
                style={secondaryButtonStyle}
              >
                ← Back
              </button>
            </form>
          </>
        )}

        <div className="mt-8 flex justify-center border-t pt-4 text-center" style={{ borderColor: COLORS.hairline }}>
          <Link to="/login" style={linkStyle}>
            Already activated? Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
