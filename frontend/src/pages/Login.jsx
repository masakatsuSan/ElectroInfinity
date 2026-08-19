import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'

export default function Login() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { login, user } = useAuth()

  useEffect(() => {
    if (user) {
      if (user.role === 'faculty') navigate('/faculty/dashboard')
      else if (user.role === 'admin' || user.role === 'super_admin') navigate('/admin')
      else navigate('/students')
    }
  }, [user, navigate])

  const successMsg = location.state?.message || ''

  const [tab,      setTab]      = useState('student')
  const [rollNo,   setRollNo]   = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPwd,  setShowPwd]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)

    try {
      const payload = tab === 'student'
        ? { rollNumber: rollNo.trim().toUpperCase(), password }
        : { email: email.trim().toLowerCase(), password }

      const user = await login(payload)

      if (user.role === 'faculty') {
        navigate('/faculty/dashboard')
      } else if (user.role === 'admin' || user.role === 'super_admin') {
        navigate('/admin')
      } else {
        navigate('/students')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  if (user) return null

  return (
    <div className="min-h-screen bg-canvas text-ink flex items-center justify-center px-6 py-28">

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-canvas border border-hairline rounded-2xl p-8 sm:p-10 shadow-card"
      >
        {/* Header */}
        <div className="mb-8">
          <span className="font-mono text-[12px] uppercase tracking-wider text-slate font-semibold block mb-2">
            Secure Authentication
          </span>
          <h1 className="font-display text-[32px] font-bold tracking-tight text-ink">Sign In</h1>
          <p className="font-sans text-[14px] text-body-muted mt-1">
            Access your department dashboard, attendance console, and resources.
          </p>
        </div>

        {/* Success message */}
        {successMsg && (
          <div className="bg-pale-green border border-green-200 rounded-xl px-4 py-3 mb-6 text-[13px] font-medium text-deep-green text-center">
            {successMsg}
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex p-1 rounded-full mb-8 bg-soft-stone border border-hairline">
          <button
            type="button"
            onClick={() => { setTab('student'); setError('') }}
            className={`flex-1 py-2 rounded-full text-[13px] font-sans font-medium transition-all ${
              tab === 'student'
                ? 'bg-primary text-white font-semibold shadow-sm'
                : 'text-body-muted hover:text-ink'
            }`}
          >
            Student Member
          </button>
          <button
            type="button"
            onClick={() => { setTab('admin'); setError('') }}
            className={`flex-1 py-2 rounded-full text-[13px] font-sans font-medium transition-all ${
              tab === 'admin'
                ? 'bg-primary text-white font-semibold shadow-sm'
                : 'text-body-muted hover:text-ink'
            }`}
          >
            Faculty / Admin
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Identifier field */}
          <div>
            <label className="font-mono text-[12px] uppercase tracking-wider font-semibold text-slate mb-1.5 block">
              {tab === 'student' ? 'Roll Number' : 'Institutional Email'}
            </label>
            {tab === 'student' ? (
              <input
                required
                autoFocus
                value={rollNo}
                onChange={e => setRollNo(e.target.value.toUpperCase())}
                className="input uppercase font-mono"
                placeholder="e.g. EE24001"
              />
            ) : (
              <input
                required
                autoFocus
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input"
                placeholder="faculty@agemc.edu"
              />
            )}
          </div>

          {/* Password field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-mono text-[12px] uppercase tracking-wider font-semibold text-slate block">
                Password
              </label>
              {tab === 'student' && (
                <Link to="/forgot-password" className="text-[12px] font-medium text-action-blue hover:underline">
                  Forgot?
                </Link>
              )}
            </div>
            <div className="relative">
              <input
                required
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate hover:text-ink transition-colors text-[13px]"
              >
                {showPwd ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-[13px] font-medium text-error bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="button-primary w-full mt-2 py-3.5"
          >
            {loading ? 'Authenticating…' : 'Sign In →'}
          </button>
        </form>

        {/* Activate account link */}
        {tab === 'student' && (
          <p className="text-[13px] font-sans text-body-muted text-center mt-8 pt-4 border-t border-hairline">
            First time logging in?{' '}
            <Link to="/activate" className="text-action-blue hover:underline font-semibold ml-1">
              Activate your account
            </Link>
          </p>
        )}
      </motion.div>
    </div>
  )
}
