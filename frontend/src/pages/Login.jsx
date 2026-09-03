import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import Carousel from '../components/Carousel'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, user } = useAuth()

  useEffect(() => {
    if (!user) return
    if (user.role === 'faculty') navigate('/faculty/dashboard')
    else if (user.role === 'admin' || user.role === 'super_admin') navigate('/admin')
    else navigate('/students')
  }, [user, navigate])

  const successMsg = location.state?.message || ''

  const [tab, setTab] = useState('student')
  const [rollNo, setRollNo] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)

    try {
      const payload = tab === 'student'
        ? { rollNumber: rollNo.trim().toUpperCase(), password }
        : { email: email.trim().toLowerCase(), password }

      const userData = await login(payload)

      if (userData.role === 'faculty') navigate('/faculty/dashboard')
      else if (userData.role === 'admin' || userData.role === 'super_admin') navigate('/admin')
      else navigate('/students')
    } catch (err) {
      setError(err.response?.data?.error || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  if (user) return null

  const carouselSlides = [
    {
      image: '/login/slide1.jpg',
      tag: 'Campus Life',
      title: 'Welcome to your department hub',
      subtitle: 'Where your campus comes together',
    },
    {
      image: '/login/slide2.jpg',
      tag: 'Learning',
      title: 'Learn. Build. Collaborate.',
      subtitle: 'Access resources, projects, and more',
    },
    {
      image: '/login/slide3.jpg',
      tag: 'Community',
      title: 'Connect with peers & faculty',
      subtitle: 'Announcements, forums, and networks',
    },
  ]

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Mobile Layout - Instagram style */}
      <div className="md:hidden min-h-screen flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Link to="/" className="inline-block">
              <span className="font-display font-bold text-[28px] tracking-tight text-ink" style={{ fontFamily: '"Instagram Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
                Electro Infinity
              </span>
            </Link>
          </div>

          {/* Heading */}
          <h1 className="font-display text-[22px] font-bold tracking-tight text-ink text-center mb-6">
            Log into your account
          </h1>

          {/* Success message */}
          {successMsg && (
            <div className="bg-pale-green border border-green-200 rounded-xl px-4 py-3 mb-6 text-[13px] font-medium text-deep-green text-center">
              {successMsg}
            </div>
          )}

          {/* Tab switcher */}
          <div className="flex p-1 rounded-full mb-6 bg-soft-stone border border-hairline">
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="font-mono text-[11px] uppercase tracking-wider font-semibold text-slate mb-1.5 block">
                {tab === 'student' ? 'Roll Number' : 'Institutional Email'}
              </label>
              {tab === 'student' ? (
                <input
                  required
                  autoFocus
                  value={rollNo}
                  onChange={e => setRollNo(e.target.value.toUpperCase())}
                  className="input uppercase font-mono w-full px-4 py-3 rounded-xl border border-hairline bg-white text-ink"
                  placeholder="e.g. 38701623001"
                />
              ) : (
                <input
                  required
                  autoFocus
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input w-full px-4 py-3 rounded-xl border border-hairline bg-white text-ink"
                  placeholder="faculty@agemc.edu"
                />
              )}
            </div>

            <div>
              <label className="font-mono text-[11px] uppercase tracking-wider font-semibold text-slate mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <input
                  required
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input w-full px-4 py-3 pr-14 rounded-xl border border-hairline bg-white text-ink"
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
              className="w-full mt-2 py-3.5 rounded-full bg-ink text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Log in'}
            </button>
          </form>

          {/* Forgot password */}
          <div className="text-center mt-6">
            <Link to="/forgot-password" className="text-[13px] font-medium text-action-blue hover:underline">
              Forgot password?
            </Link>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-hairline"></div>
            <span className="text-[12px] text-slate font-mono uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-hairline"></div>
          </div>

          {/* Activate link */}
          <p className="text-[13px] font-sans text-body-muted text-center">
            {tab === 'student' ? 'Don\'t have an account? ' : 'New faculty? '}
            <Link to={tab === 'student' ? '/activate' : '/faculty/activate'} className="text-action-blue hover:underline font-semibold">
              {tab === 'student' ? 'Activate now' : 'Activate account'}
            </Link>
          </p>
        </div>
      </div>

      {/* Desktop Layout - Original two-column design */}
      <div className="hidden md:flex min-h-screen bg-canvas text-ink items-center justify-center py-10">
        <div className="w-full max-w-[900px] mx-auto md:grid md:grid-cols-2 bg-white md:rounded-3xl md:shadow-xl md:overflow-hidden md:border md:border-hairline">

          {/* Left — Carousel */}
          <div className="hidden md:block h-full md:min-h-[640px]">
            <Carousel slides={carouselSlides} />
          </div>

          {/* Right — Form */}
          <div className="px-6 py-10 md:px-12 md:py-14 flex flex-col justify-center md:min-h-[640px]">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="font-display text-[28px] md:text-[30px] font-bold tracking-tight text-ink">
                Sign in
              </h1>
              <p className="font-sans text-[14px] text-body-muted mt-1">
                Choose your account type below to continue.
              </p>

              {successMsg && (
                <div className="bg-pale-green border border-green-200 rounded-xl px-4 py-3 mt-6 text-[13px] font-medium text-deep-green text-center">
                  {successMsg}
                </div>
              )}

              {/* Tab switcher */}
              <div className="flex p-1 rounded-full mt-8 mb-6 bg-soft-stone border border-hairline">
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

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="font-mono text-[11px] uppercase tracking-wider font-semibold text-slate mb-1.5 block">
                    {tab === 'student' ? 'Roll Number' : 'Institutional Email'}
                  </label>
                  {tab === 'student' ? (
                    <input
                      required
                      autoFocus
                      value={rollNo}
                      onChange={e => setRollNo(e.target.value.toUpperCase())}
                      className="input uppercase font-mono"
                      placeholder="e.g. 38701623001"
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

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-mono text-[11px] uppercase tracking-wider font-semibold text-slate block">
                      Password
                    </label>
                    <Link to={tab === 'student' ? '/forgot-password' : '/forgot-password'} className="text-[12px] font-medium text-action-blue hover:underline">
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
                {tab === 'student' ? 'Don\'t have an account? ' : 'New faculty? '}
                <Link to={tab === 'student' ? '/activate' : '/faculty/activate'} className="text-action-blue hover:underline font-semibold">
                  {tab === 'student' ? 'Activate now' : 'Activate account'}
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
