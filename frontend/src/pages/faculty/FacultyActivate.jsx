import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { activateFaculty, checkFacultyEmail, facultyVerifyOtp } from '../../api/auth'
import { motion } from 'framer-motion'

export default function FacultyActivate() {
  const navigate = useNavigate()
  const { login, user } = useAuth()

  useEffect(() => {
    if (!user) return
    if (user.role === 'faculty') {
      navigate('/faculty/dashboard', { replace: true })
    } else if (user.role === 'admin' || user.role === 'super_admin' || user.role === 'cr') {
      navigate('/admin', { replace: true })
    } else {
      navigate('/students', { replace: true })
    }
  }, [user, navigate])

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [activationToken, setActivationToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  // ── Step 1: send OTP ──────────────────────────────────────────────────
  const handleCheckEmail = async (e) => {
    e.preventDefault()
    if (!email.trim()) return setError('Enter your institutional email')
    setError('')
    setLoading(true)

    try {
      const res = await checkFacultyEmail(email.trim().toLowerCase())
      setName(res.data.name)
      setMaskedEmail(res.data.maskedEmail)
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP without changing step
  const handleResend = async () => {
    setResending(true); setError('')
    try {
      const res = await checkFacultyEmail(email.trim().toLowerCase())
      setMaskedEmail(res.data.maskedEmail)
      setOtp('')
      setResendSuccess(true); setError('New OTP sent to email')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP')
    } finally {
      setResending(false)
    }
  }

  // ── Step 2: verify OTP ────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) return setError('Enter the 6-digit OTP')
    setResendSuccess(false); setError(''); setLoading(true)

    try {
      const res = await facultyVerifyOtp({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      })
      setActivationToken(res.data.activationToken)
      setStep(3)
    } catch (err) {
      setError(err.response?.data?.error || 'OTP verification failed')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 3: set password ──────────────────────────────────────────────
  const handleActivate = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) return setError('Password must be at least 6 characters')
    if (password !== confirm) return setError('Passwords do not match')

    setLoading(true)
    try {
      const res = await activateFaculty({
        email: email.trim().toLowerCase(),
        password,
        activationToken,
      })
      const { token, user: userData } = res.data
      localStorage.setItem('ei_token', token)
      localStorage.setItem('ei_user', JSON.stringify(userData))
      navigate('/faculty/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Activation failed')
    } finally {
      setLoading(false)
    }
  }

  if (user) return null

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-canvas text-ink py-28">
      <div className="w-full max-w-md bg-white border border-hairline rounded-2xl p-8 sm:p-10 shadow-card">

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          {[1, 2, 3].map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-[12px] font-bold transition-colors ${
                step > s ? 'bg-deep-green text-white' : step === s ? 'bg-primary text-white' : 'border border-hairline text-slate'
              }`}>
                {step > s ? '✓' : s}
              </div>
              {i < 2 && <div className={`h-px w-8 transition-colors ${step > s ? 'bg-deep-green' : 'bg-hairline'}`} />}
            </div>
          ))}
        </div>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <>
            <div className="text-center mb-8">
              <span className="font-mono text-[12px] uppercase tracking-wider text-coral font-semibold block mb-2">
                New Faculty Activation
              </span>
              <h1 className="font-display font-bold text-[30px] tracking-tight text-ink mb-2">
                Verify Email
              </h1>
              <p className="font-sans text-[14px] text-body-muted">
                Enter your institutional email to receive a verification OTP.
              </p>
            </div>

            <form onSubmit={handleCheckEmail} className="flex flex-col gap-5">
              <div>
                <label className="font-mono text-[12px] uppercase tracking-wider font-semibold text-slate mb-1.5 block">
                  Institutional Email
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input"
                  placeholder="faculty@agemc.edu"
                  autoFocus
                />
              </div>

              {error && <p className="text-[13px] font-medium text-error bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">{error}</p>}

              <button type="submit" disabled={loading} className="button-primary w-full py-3.5 mt-2">
                {loading ? 'Sending OTP…' : 'Send Verification OTP →'}
              </button>
            </form>
          </>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <>
            <div className="text-center mb-6">
              <span className="font-mono text-[12px] uppercase tracking-wider text-deep-green font-semibold block mb-1">
                Email Verified
              </span>
              <h1 className="font-display font-bold text-[28px] tracking-tight text-ink">
                Enter OTP
              </h1>
            </div>

            <div className="bg-soft-stone border border-hairline rounded-xl p-4 mb-6 text-center">
              <p className="font-sans text-[13px] text-body-muted">OTP sent to</p>
              <p className="font-mono text-[15px] font-semibold text-ink mt-0.5">{maskedEmail}</p>
              <p className="font-sans text-[11px] text-slate mt-2">Check Spam if not in inbox · Valid for 10 min</p>
            </div>

            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
              <div>
                <label className="font-mono text-[12px] uppercase tracking-wider font-semibold text-slate mb-1.5 block">
                  Enter 6-Digit OTP
                </label>
                <input
                  required autoFocus
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input text-center text-[22px] font-mono tracking-[0.3em]"
                  placeholder="000000"
                  maxLength={6}
                  inputMode="numeric"
                />
              </div>

              {error && (
                <p className={`text-[13px] font-medium text-center rounded-xl px-4 py-3 border ${
                  resendSuccess ? 'text-deep-green bg-pale-green border-green-200' : 'text-error bg-red-50 border-red-200'
                }`}>
                  {resendSuccess ? <><Check size={14} /> {error}</> : error}
                </p>
              )}

              <button type="submit" disabled={loading || otp.length !== 6} className="button-primary w-full py-3.5 mt-2">
                {loading ? 'Verifying…' : 'Verify Code →'}
              </button>

              <div className="flex justify-between items-center text-[13px] font-sans pt-2">
                <button type="button" onClick={() => { setStep(1); setResendSuccess(false); setError('') }} className="text-body-muted hover:text-ink">
                  ← Wrong email?
                </button>
                <button type="button" onClick={handleResend} disabled={resending} className="text-action-blue font-semibold hover:underline">
                  {resending ? 'Sending…' : 'Resend OTP'}
                </button>
              </div>
            </form>
          </>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <>
            <div className="text-center mb-6">
              <span className="font-mono text-[12px] uppercase tracking-wider text-deep-green font-semibold block mb-1">
                Identity Confirmed
              </span>
              <h1 className="font-display font-bold text-[28px] tracking-tight text-ink">
                Set Your Password
              </h1>
            </div>

            {/* Confirm identity card */}
            <div className="bg-soft-stone border border-hairline rounded-xl p-4 mb-6 text-center">
              <p className="font-sans text-[16px] font-bold text-ink">{name}</p>
              <p className="font-mono text-[12px] text-slate mt-0.5 uppercase tracking-wider">
                {email}
              </p>
            </div>

            <form onSubmit={handleActivate} className="flex flex-col gap-4">
              <div>
                <label className="font-mono text-[12px] uppercase tracking-wider font-semibold text-slate mb-1.5 block">
                  Create Password (min. 6 chars)
                </label>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                  autoFocus
                />
              </div>

              <div>
                <label className="font-mono text-[12px] uppercase tracking-wider font-semibold text-slate mb-1.5 block">
                  Confirm Password
                </label>
                <input
                  required
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-[13px] font-medium text-error bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">{error}</p>}

              <button type="submit" disabled={loading} className="button-primary w-full py-3.5 mt-2">
                {loading ? 'Activating…' : 'Activate & Enter Dashboard →'}
              </button>

              <button
                type="button"
                onClick={() => { setStep(1); setError('') }}
                className="font-sans text-[13px] text-body-muted hover:text-ink text-center mt-1"
              >
                ← Back (change email)
              </button>
            </form>
          </>
        )}

        <div className="mt-8 pt-4 border-t border-hairline text-center text-[13px] font-sans">
          <Link to="/faculty/login" className="text-action-blue hover:underline font-semibold">
            Already activated? Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
