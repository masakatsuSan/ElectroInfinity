import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { motion } from 'framer-motion'

export default function FacultyLogin() {
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
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const userData = await login({
        email: email.trim().toLowerCase(),
        password,
      })

      if (userData.role === 'faculty') {
        navigate('/faculty/dashboard', { replace: true })
      } else if (userData.role === 'admin' || userData.role === 'super_admin' || userData.role === 'cr') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/students', { replace: true })
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  if (user) return null

  return (
    <div className="min-h-screen bg-canvas text-ink md:flex md:items-center md:justify-center md:py-10">
      <div className="w-full max-w-[900px] mx-auto md:grid md:grid-cols-2 bg-white md:rounded-3xl md:shadow-xl md:overflow-hidden md:border md:border-hairline">

        <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-primary via-ink to-primary text-white relative overflow-hidden">
          <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-coral/20 blur-3xl" />

          <div className="relative">
            <Link to="/" className="inline-block">
              <span className="font-display font-bold text-[22px] tracking-tight" style={{ fontFamily: '"Instagram Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
                Electro Infinity
              </span>
            </Link>
          </div>

          <div className="relative">
            <h2 className="font-display text-[34px] font-bold leading-tight mb-3 text-white">
              Faculty Portal
            </h2>
            <p className="font-sans text-[15px] text-white/80 leading-relaxed max-w-sm">
              Sign in with your institutional email to access your teaching dashboard
            </p>
          </div>

          <div className="relative flex items-center gap-2 text-[12px] text-white/60 font-mono uppercase tracking-wider">
            <span className="w-8 h-px bg-white/40" />
            Secure sign in
          </div>
        </div>

        <div className="px-6 py-10 md:px-12 md:py-14 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="md:hidden mb-6">
              <Link to="/" className="font-display font-bold text-[18px] tracking-tight" style={{ fontFamily: '"Instagram Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
                Electro Infinity
              </Link>
            </div>

            <h1 className="font-display text-[28px] md:text-[30px] font-bold tracking-tight text-ink">
              Faculty sign in
            </h1>
            <p className="font-sans text-[14px] text-body-muted mt-1">
              Use your institutional email to continue.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
              <div>
                <label className="font-mono text-[11px] uppercase tracking-wider font-semibold text-slate mb-1.5 block">
                  Institutional Email
                </label>
                <input
                  required
                  autoFocus
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input"
                  placeholder="faculty@agemc.edu"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-mono text-[11px] uppercase tracking-wider font-semibold text-slate block">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-[12px] font-medium text-action-blue hover:underline">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    required
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input pr-14"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate hover:text-ink transition-colors text-[12px] font-medium"
                  >
                    {showPwd ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-[13px] font-medium text-error bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="button-primary w-full mt-2 py-3.5"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <p className="text-[13px] font-sans text-body-muted text-center mt-8">
              Don't have an account?{' '}
              <Link to="/faculty/activate" className="text-action-blue hover:underline font-semibold">
                Activate now
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
