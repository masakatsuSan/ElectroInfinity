import { useState } from 'react'
import { Check } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { forgotPassword, verifyOtp, resetPassword } from '../api/auth'

export default function ForgotPassword() {
  const navigate = useNavigate()

  const [step,       setStep]       = useState(1)
  const [tab,       setTab]       = useState('student')
  const [rollNumber, setRollNumber] = useState('')
  const [email,     setEmail]     = useState('')
  const [maskedEmail,setMaskedEmail]= useState('')
  const [otp,        setOtp]        = useState('')
  const [resetToken, setResetToken] = useState('')
  const [password,   setPassword]   = useState('')
  const [confirm,    setConfirm]    = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [resending,  setResending]  = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  const identifier = tab === 'student' ? rollNumber : email

  // ── Step 1: send OTP ──────────────────────────────────────────────────
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

  // Resend OTP without changing step
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

  // ── Step 2: verify OTP ────────────────────────────────────────────────
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

  // ── Step 3: set new password ──────────────────────────────────────────
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
                {step > s ? <Check size={14} /> : s}
              </div>
              {i < 2 && <div className={`h-px w-8 transition-colors ${step > s ? 'bg-deep-green' : 'bg-hairline'}`} />}
            </div>
          ))}
        </div>

        <div className="text-center mb-8">
          <span className="font-mono text-[12px] uppercase tracking-wider text-coral font-semibold block mb-1">
            Account Recovery
          </span>
          <h1 className="font-display font-bold text-[28px] tracking-tight text-ink">
            {stepLabel[step - 1]}
          </h1>
        </div>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
            {/* Tab switcher */}
            <div className="flex p-1 rounded-full bg-soft-stone border border-hairline">
              <button
                type="button"
                onClick={() => { setTab('student'); setError('') }}
                className={`flex-1 py-2 rounded-full text-[13px] font-sans font-medium transition-all ${
                  tab === 'student'
                    ? 'bg-primary text-white font-semibold shadow-sm'
                    : 'text-body-muted hover:text-ink'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => { setTab('faculty'); setError('') }}
                className={`flex-1 py-2 rounded-full text-[13px] font-sans font-medium transition-all ${
                  tab === 'faculty'
                    ? 'bg-primary text-white font-semibold shadow-sm'
                    : 'text-body-muted hover:text-ink'
                }`}
              >
                Faculty
              </button>
            </div>

            <p className="font-sans text-[14px] text-body-muted text-center">
              {tab === 'student'
                ? 'Enter your roll number. We\'ll send a 6-digit one-time password to your registered email.'
                : 'Enter your institutional email. We\'ll send a 6-digit one-time password to reset your password.'}
            </p>

            <div>
              <label className="font-mono text-[12px] uppercase tracking-wider font-semibold text-slate mb-1.5 block">
                {tab === 'student' ? 'Roll Number' : 'Institutional Email'}
              </label>
              {tab === 'student' ? (
                <input
                  required autoFocus
                  value={rollNumber}
                  onChange={e => setRollNumber(e.target.value.toUpperCase())}
                  className="input uppercase font-mono"
                  placeholder="e.g. EE24001"
                />
              ) : (
                <input
                  required autoFocus
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input"
                  placeholder="faculty@agemc.edu"
                />
              )}
            </div>
            {error && <p className="text-[13px] font-medium text-error bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">{error}</p>}
            <button type="submit" disabled={loading} className="button-primary w-full py-3.5 mt-2">
              {loading ? 'Sending OTP…' : 'Send Verification OTP →'}
            </button>
          </form>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
            <div className="bg-soft-stone border border-hairline rounded-xl p-4 text-center">
              <p className="font-sans text-[13px] text-body-muted">OTP sent to</p>
              <p className="font-mono text-[15px] font-semibold text-ink mt-0.5">{maskedEmail}</p>
              <p className="font-sans text-[11px] text-slate mt-2">Check Spam if not in inbox · Valid for 10 min</p>
            </div>

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
                ← Wrong {tab}?
              </button>
              <button type="button" onClick={handleResend} disabled={resending} className="text-action-blue font-semibold hover:underline">
                {resending ? 'Sending…' : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <p className="font-sans text-[14px] text-body-muted text-center mb-2">
              OTP verified. Enter your new password below.
            </p>
            <div>
              <label className="font-mono text-[12px] uppercase tracking-wider font-semibold text-slate mb-1.5 block">
                New Password
              </label>
              <input
                required autoFocus type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input"
                placeholder="Min. 6 characters"
              />
            </div>
            <div>
              <label className="font-mono text-[12px] uppercase tracking-wider font-semibold text-slate mb-1.5 block">
                Confirm New Password
              </label>
              <input
                required type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="input"
                placeholder="Confirm new password"
              />
            </div>
            {error && <p className="text-[13px] font-medium text-error bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">{error}</p>}
            <button type="submit" disabled={loading} className="button-primary w-full py-3.5 mt-2">
              {loading ? 'Updating…' : 'Update Password & Sign In →'}
            </button>
          </form>
        )}

        <div className="mt-8 pt-4 border-t border-hairline text-center text-[13px] font-sans">
          <Link to="/login" className="text-action-blue hover:underline font-semibold">
            Back to Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
