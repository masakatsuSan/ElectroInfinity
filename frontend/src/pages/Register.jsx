import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/auth'
import { motion } from 'framer-motion'

const BATCHES = ['2024-2028', '2023-2027', '2022-2026', '2021-2025']

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    rollNumber: '', regNumber: '', batch: '2024-2028',
  })
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match')
    }
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters')
    }

    setLoading(true)
    try {
      await register({
        name:       form.name,
        email:      form.email,
        password:   form.password,
        rollNumber: form.rollNumber,
        regNumber:  form.regNumber,
        batch:      form.batch,
      })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  // Show success screen after registration
  if (success) {
    return (
      <div className="min-h-screen bg-canvas text-ink flex items-center justify-center px-6 py-28">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md text-center bg-canvas border border-hairline rounded-2xl p-10 shadow-card"
        >
          <div className="w-14 h-14 rounded-full bg-pale-green border border-green-200 flex items-center justify-center mx-auto mb-6">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#003c33" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          </div>
          <span className="font-mono text-[12px] font-bold uppercase tracking-wider text-deep-green block mb-2">
            Registration Submitted
          </span>
          <h1 className="font-display text-[28px] font-bold text-ink mb-3">Account Pending Approval</h1>
          <p className="font-sans text-[14px] text-body-muted leading-relaxed mb-8">
            Your registration is awaiting department verification. You will receive access once approved by the HOD.
          </p>
          <Link to="/login" className="button-primary w-full py-3">
            Back to Sign In →
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas text-ink flex items-center justify-center px-6 py-28">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-canvas border border-hairline rounded-2xl p-8 sm:p-10 shadow-card"
      >
        {/* Header */}
        <div className="mb-8">
          <span className="font-mono text-[12px] uppercase tracking-wider text-coral font-semibold block mb-2">
            New Student Onboarding
          </span>
          <h1 className="font-display text-[32px] font-bold tracking-tight text-ink mb-1">Create Account</h1>
          <p className="font-sans text-[14px] text-body-muted">
            Register to access batch lecture materials, attendance scanning, and forum discussions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Full Name */}
          <div>
            <label className="font-mono text-[12px] uppercase tracking-wider font-semibold text-slate mb-1 block">
              Full Name *
            </label>
            <input
              required
              value={form.name}
              onChange={set('name')}
              className="input"
              placeholder="e.g. Priyo Sen"
            />
          </div>

          {/* Email */}
          <div>
            <label className="font-mono text-[12px] uppercase tracking-wider font-semibold text-slate mb-1 block">
              Institutional / Personal Email *
            </label>
            <input
              required
              type="email"
              value={form.email}
              onChange={set('email')}
              className="input"
              placeholder="you@agemc.edu"
            />
          </div>

          {/* Roll + Reg Number */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-[12px] uppercase tracking-wider font-semibold text-slate mb-1 block">
                Roll No.
              </label>
              <input
                value={form.rollNumber}
                onChange={set('rollNumber')}
                className="input uppercase font-mono"
                placeholder="EE24001"
              />
            </div>
            <div>
              <label className="font-mono text-[12px] uppercase tracking-wider font-semibold text-slate mb-1 block">
                Reg No.
              </label>
              <input
                value={form.regNumber}
                onChange={set('regNumber')}
                className="input uppercase font-mono"
                placeholder="REG24001"
              />
            </div>
          </div>

          {/* Batch */}
          <div>
            <label className="font-mono text-[12px] uppercase tracking-wider font-semibold text-slate mb-1 block">
              Graduation Batch *
            </label>
            <select
              value={form.batch}
              onChange={set('batch')}
              className="input"
            >
              {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Password */}
          <div>
            <label className="font-mono text-[12px] uppercase tracking-wider font-semibold text-slate mb-1 block">
              Password *
            </label>
            <input
              required
              type="password"
              value={form.password}
              onChange={set('password')}
              className="input"
              placeholder="Min. 6 characters"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="font-mono text-[12px] uppercase tracking-wider font-semibold text-slate mb-1 block">
              Confirm Password *
            </label>
            <input
              required
              type="password"
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              className="input"
              placeholder="Confirm password"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-[13px] text-error font-medium bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="button-primary w-full py-3.5 mt-2"
          >
            {loading ? 'Submitting Registration…' : 'Register Account →'}
          </button>
        </form>

        {/* Footer link */}
        <p className="text-[13px] font-sans text-body-muted text-center mt-6 pt-4 border-t border-hairline">
          Already registered?{' '}
          <Link to="/login" className="text-action-blue font-semibold hover:underline ml-1">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
