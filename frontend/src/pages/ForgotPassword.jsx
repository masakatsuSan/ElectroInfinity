import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { forgotPassword, verifyOtp, resetPassword } from '../api/auth'

export default function ForgotPassword() {
  const navigate = useNavigate()

  const [step,       setStep]       = useState(1)
  const [rollNumber, setRollNumber] = useState('')
  const [maskedEmail,setMaskedEmail]= useState('') // e.g. ra***@gmail.com
  const [otp,        setOtp]        = useState('')
  const [resetToken, setResetToken] = useState('') // returned after OTP verified
  const [password,   setPassword]   = useState('')
  const [confirm,    setConfirm]    = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [resending,  setResending]  = useState(false)

  // ── Step 1: send OTP ──────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (!rollNumber.trim()) return setError('Enter your roll number')
    setError(''); setLoading(true)

    try {
      const res = await forgotPassword({ rollNumber: rollNumber.trim().toUpperCase() })
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
      const res = await forgotPassword({ rollNumber: rollNumber.trim().toUpperCase() })
      setMaskedEmail(res.data.maskedEmail)
      setOtp('')
      setError('✓ New OTP sent')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP')
    } finally {
      setResending(false) }
  }

  // ── Step 2: verify OTP ────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) return setError('Enter the 6-digit OTP')
    setError(''); setLoading(true)

    try {
      const res = await verifyOtp({ rollNumber: rollNumber.trim().toUpperCase(), otp: otp.trim() })
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
      // Redirect to login with success message in state
      navigate('/login', { state: { message: 'Password reset successful! You can now sign in.' } })
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed')
      // If reset token expired, go back to step 1
      if (err.response?.data?.error?.includes('expired')) {
        setTimeout(() => { setStep(1); setOtp(''); setResetToken('') }, 2000)
      }
    } finally {
      setLoading(false)
    }
  }

  const stepLabel = ['Forgot Password', 'Verify Email', 'Create Password']

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-canvas text-ink pt-[44px]">
      <div className="w-full max-w-[400px]">

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          {[1, 2, 3].map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-sans text-[12px] font-semibold transition-colors ${
                step > s ? 'bg-green-500 text-white' : step === s ? 'bg-primary text-white' : 'border border-divider-soft text-ink-muted-48'
              }`}>
                {step > s ? '✓' : s}
              </div>
              {i < 2 && <div className={`h-px w-6 transition-colors ${step > s ? 'bg-green-500' : 'bg-divider-soft'}`} />}
            </div>
          ))}
        </div>

        <h1 className="font-display font-semibold text-[32px] leading-tight tracking-normal mb-8 text-center text-ink">
          {stepLabel[step - 1]}
        </h1>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
            <p className="font-sans text-[17px] font-normal text-ink-muted-80 mb-2 text-center px-4">
              Enter your roll number. We'll send a one-time password to your registered Gmail.
            </p>
            <div>
              <label className="sr-only">Roll Number</label>
              <input
                required autoFocus
                value={rollNumber}
                onChange={e => setRollNumber(e.target.value.toUpperCase())}
                className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-3 text-[17px] font-sans text-ink placeholder:text-ink-muted-48 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all uppercase"
                placeholder="Roll Number (e.g. EE24001)"
              />
            </div>
            {error && <p className="font-sans text-[14px] font-medium text-red-500 text-center">{error}</p>}
            <button type="submit" disabled={loading}
              className="button-primary w-full mt-2">
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
            <div className="bg-surface-pearl border border-divider-soft rounded-lg p-5 text-center">
              <p className="font-sans text-[14px] text-ink-muted-80">OTP sent to</p>
              <p className="font-sans text-[17px] font-semibold text-ink mt-1">{maskedEmail}</p>
              <p className="font-sans text-[12px] text-ink-muted-48 mt-3">Check Spam if not in inbox · Expires in 10 min</p>
            </div>

            <div>
              <label className="sr-only">6-Digit OTP</label>
              <input
                required autoFocus
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-3 text-[24px] font-sans font-medium text-ink text-center tracking-[0.2em] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="000000"
                maxLength={6}
                inputMode="numeric"
              />
            </div>

            {error && (
              <p className={`font-sans text-[14px] font-medium text-center ${error.startsWith('✓') ? 'text-green-500' : 'text-red-500'}`}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading || otp.length !== 6}
              className="button-primary w-full mt-2">
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <div className="flex justify-between items-center mt-2 px-2">
              <button type="button" onClick={() => { setStep(1); setError('') }}
                className="text-link font-sans text-[14px]">
                Wrong roll number?
              </button>
              <button type="button" onClick={handleResend} disabled={resending}
                className="text-link font-sans text-[14px]">
                {resending ? 'Sending...' : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <form onSubmit={handleReset} className="flex flex-col gap-5">
            <p className="font-sans text-[17px] font-normal text-ink-muted-80 mb-2 text-center">
              OTP verified. Set your new password below.
            </p>
            <div>
              <label className="sr-only">New Password</label>
              <input
                required autoFocus type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-3 text-[17px] font-sans text-ink placeholder:text-ink-muted-48 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="New Password (min. 6 chars)"
              />
            </div>
            <div>
              <label className="sr-only">Confirm Password</label>
              <input
                required type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-3 text-[17px] font-sans text-ink placeholder:text-ink-muted-48 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="Confirm Password"
              />
            </div>
            {error && <p className="font-sans text-[14px] font-medium text-red-500 text-center">{error}</p>}
            <button type="submit" disabled={loading}
              className="button-primary w-full mt-2">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="mt-8 flex justify-center text-[14px]">
          <Link to="/login" className="text-link">
            Back to Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
