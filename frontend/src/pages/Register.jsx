import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/auth'
import { BATCHES, DEFAULT_BATCH } from '../data/batches'
import TermsCheckbox from '../components/TermsCheckbox'

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
  successSurface: '#f2faf2',
  successBorder: '#b8dfba',
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
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
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
  transition: 'background-color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease',
}

const linkStyle = {
  color: COLORS.link,
  fontFamily: TEXT_FONT,
  fontSize: 13,
  fontWeight: 500,
  lineHeight: 1.4,
  textDecoration: 'none',
  transition: 'color 0.15s ease',
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
  color: COLORS.coral,
  fontFamily: TEXT_FONT,
  fontSize: 12,
  fontWeight: 500,
  lineHeight: 1.4,
  letterSpacing: 0.16,
  textTransform: 'uppercase',
}

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    rollNumber: '', regNumber: '', batch: DEFAULT_BATCH,
  })
  const [error, setError] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [termsError, setTermsError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setTermsError('')

    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match')
    }
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters')
    }
    if (!termsAccepted) {
      setTermsError('You must accept the Terms & Conditions to register')
      return
    }

    setLoading(true)
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        rollNumber: form.rollNumber,
        regNumber: form.regNumber,
        batch: form.batch,
      })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const submitButtonStyle = loading
    ? { ...primaryButtonStyle, backgroundColor: COLORS.inkActive, boxShadow: 'none', cursor: 'not-allowed', opacity: 0.65 }
    : primaryButtonStyle

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 py-28" style={pageStyle}>
        <div style={cardStyle}>
          <div className="mb-6 flex h-14 w-14 items-center justify-center mx-auto border" style={{ borderRadius: 9999, backgroundColor: COLORS.successSurface, borderColor: COLORS.successBorder }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLORS.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          </div>
          <span className="mb-2 block text-center" style={{ ...eyebrowStyle, color: COLORS.success }}>
            Registration Submitted
          </span>
          <h1 className="mb-3" style={{ margin: '0 0 12px', color: COLORS.ink, fontFamily: DISPLAY_FONT, fontSize: 28, fontWeight: 400, lineHeight: 1.2, letterSpacing: 0 }}>
            Account Pending Approval
          </h1>
          <p className="mb-8" style={{ margin: '0 0 32px', color: COLORS.body, fontFamily: TEXT_FONT, fontSize: 14, fontWeight: 400, lineHeight: 1.25 }}>
            Your registration is awaiting department verification. You will receive access once approved by the HOD.
          </p>
          <Link to="/login" className="block" style={submitButtonStyle}>
            Back to Sign In →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-28" style={pageStyle}>
      <div style={cardStyle}>
        <div className="mb-8">
          <span className="mb-2 block" style={eyebrowStyle}>
            New Student Onboarding
          </span>
          <h1 className="mb-1" style={{ margin: '0 0 4px', color: COLORS.ink, fontFamily: DISPLAY_FONT, fontSize: 32, fontWeight: 400, lineHeight: 1.2, letterSpacing: 0 }}>
            Create Account
          </h1>
          <p style={{ margin: 0, color: COLORS.body, fontFamily: TEXT_FONT, fontSize: 14, fontWeight: 400, lineHeight: 1.25 }}>
            Register to access batch lecture materials and forum discussions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label style={labelStyle}>
              Full Name *
            </label>
            <input
              required
              value={form.name}
              onChange={set('name')}
              className="input w-full"
              style={inputStyle}
              placeholder="e.g. Priyo Sen"
            />
          </div>

          <div>
            <label style={labelStyle}>
              Institutional / Personal Email *
            </label>
            <input
              required
              type="email"
              value={form.email}
              onChange={set('email')}
              className="input w-full"
              style={inputStyle}
              placeholder="you@agemc.edu"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>
                Roll No.
              </label>
              <input
                value={form.rollNumber}
                onChange={set('rollNumber')}
                className="input w-full"
                style={{ ...inputStyle, textTransform: 'uppercase' }}
                placeholder="EE24001"
              />
            </div>
            <div>
              <label style={labelStyle}>
                Reg No.
              </label>
              <input
                value={form.regNumber}
                onChange={set('regNumber')}
                className="input w-full"
                style={{ ...inputStyle, textTransform: 'uppercase' }}
                placeholder="REG24001"
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>
              Graduation Batch *
            </label>
            <select
              value={form.batch}
              onChange={set('batch')}
              className="input w-full"
              style={inputStyle}
            >
              {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>
              Password *
            </label>
            <input
              required
              type="password"
              value={form.password}
              onChange={set('password')}
              className="input w-full"
              style={inputStyle}
              placeholder="Min. 6 characters"
            />
          </div>

          <div>
            <label style={labelStyle}>
              Confirm Password *
            </label>
            <input
              required
              type="password"
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              className="input w-full"
              style={inputStyle}
              placeholder="Confirm password"
            />
          </div>

          {error && (
            <p style={errorStatusStyle}>
              {error}
            </p>
          )}

          {termsError && (
            <p style={errorStatusStyle}>
              {termsError}
            </p>
          )}

          <div className="mt-1">
            <TermsCheckbox
              checked={termsAccepted}
              onChange={(val) => { setTermsAccepted(val); setTermsError('') }}
              error={termsError}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full"
            style={submitButtonStyle}
          >
            {loading ? 'Submitting Registration…' : 'Register Account →'}
          </button>
        </form>

        <p className="mt-6 border-t pt-4 text-center" style={{ margin: '24px 0 0', borderColor: COLORS.hairline, color: COLORS.body, fontFamily: TEXT_FONT, fontSize: 13, fontWeight: 400, lineHeight: 1.4 }}>
          Already registered?{' '}
          <Link to="/login" style={linkStyle}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
