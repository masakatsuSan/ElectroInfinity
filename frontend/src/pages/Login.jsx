import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import { EASE, DURATION } from '../utils/motion'
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
  errorSurface: '#fff7f4',
  errorBorder: '#f0d6cd',
}

const DISPLAY_FONT = '"Haas Groot Disp", "Haas", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
const TEXT_FONT = '"Haas", "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

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

const eyebrowStyle = {
  color: COLORS.muted,
  fontFamily: TEXT_FONT,
  fontSize: 12,
  fontWeight: 500,
  lineHeight: 1.4,
  letterSpacing: 0.16,
  textTransform: 'uppercase',
}

const carouselControlStyle = {
  width: 40,
  height: 40,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: COLORS.canvas,
  color: COLORS.ink,
  border: `1px ${COLORS.hairline}`,
  borderRadius: 9999,
  fontSize: 22,
  lineHeight: 1,
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(24, 29, 38, 0.08)',
}

function LoginCarousel({ slides }) {
  const [index, setIndex] = useState(0)

  const next = useCallback(() => {
    setIndex(current => (current + 1) % slides.length)
  }, [slides.length])

  const previous = useCallback(() => {
    setIndex(current => (current - 1 + slides.length) % slides.length)
  }, [slides.length])

  useEffect(() => {
    const timer = window.setInterval(next, 5000)
    return () => window.clearInterval(timer)
  }, [next])

  const slide = slides[index]

  return (
    <div className="relative h-full min-h-[640px] overflow-hidden rounded-lg border bg-surface-soft" style={{ borderColor: COLORS.hairline }}>
      {slides.map((item, itemIndex) => (
        <div
          key={item.image}
          className="absolute inset-0"
          style={{
            backgroundImage: `url("${item.image}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: itemIndex === index ? 1 : 0,
            transform: itemIndex === index ? 'scale(1)' : 'scale(1.05)',
            transition: 'opacity 1s cubic-bezier(0.4, 0, 0.2, 1), transform 1s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      ))}
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(24, 29, 38, 0.28)' }} />

      <div className="absolute inset-x-5 bottom-5 rounded-2xl p-5 md:inset-x-8 md:bottom-8 md:p-7 backdrop-blur-md bg-white/60 border border-white/40" style={{ boxShadow: '0 12px 40px rgba(24, 29, 38, 0.08)', transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <p style={{ ...eyebrowStyle, marginBottom: 8 }}>{slide.tag}</p>
        <h3 style={{ margin: 0, color: COLORS.ink, fontFamily: DISPLAY_FONT, fontSize: 24, fontWeight: 400, lineHeight: 1.2, letterSpacing: 0 }}>
          {slide.title}
        </h3>
        <p style={{ margin: '8px 0 0', color: COLORS.body, fontFamily: TEXT_FONT, fontSize: 14, fontWeight: 400, lineHeight: 1.25 }}>
          {slide.subtitle}
        </p>
      </div>

      <button
        type="button"
        onClick={previous}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 -translate-y-1/2 button-icon-circular"
        style={carouselControlStyle}
      >
        ‹
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 -translate-y-1/2 button-icon-circular"
        style={carouselControlStyle}
      >
        ›
      </button>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
        {slides.map((item, itemIndex) => (
          <button
            key={item.image}
            type="button"
            onClick={() => setIndex(itemIndex)}
            aria-label={`Show slide ${itemIndex + 1}`}
            style={{
              width: itemIndex === index ? 24 : 8,
              height: 4,
              padding: 0,
              border: 'none',
              borderRadius: 2,
              backgroundColor: itemIndex === index ? COLORS.ink : COLORS.hairline,
              cursor: 'pointer',
              transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        ))}
      </div>
    </div>
  )
}

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
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [termsError, setTermsError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setTermsError(''); setLoading(true)

    if (!termsAccepted) {
      setTermsError('You must accept the Terms & Conditions to sign in')
      setLoading(false)
      return
    }

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

  const studentTabStyle = {
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
    transition: `background-color ${DURATION.base}s ${EASE.ios}, color ${DURATION.base}s ${EASE.ios}`,
  }

  const activeTabStyle = {
    ...studentTabStyle,
    backgroundColor: COLORS.ink,
    color: COLORS.canvas,
  }

  const showPasswordStyle = {
    position: 'absolute',
    inset: '0 0 0 auto',
    width: 56,
    padding: 0,
    backgroundColor: 'transparent',
    color: COLORS.muted,
    border: 'none',
    fontFamily: TEXT_FONT,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
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
    boxShadow: '0 1px 2px rgba(24, 29, 38, 0.06)',
    transition: `background-color ${DURATION.base}s ${EASE.ios}, box-shadow ${DURATION.base}s ${EASE.ios}, opacity ${DURATION.base}s ${EASE.ios}`,
  }

  const submitButtonStyle = loading
    ? { ...primaryButtonStyle, backgroundColor: COLORS.inkActive, boxShadow: 'none', cursor: 'not-allowed', opacity: 0.65 }
    : primaryButtonStyle

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
    transition: `background-color ${DURATION.base}s ${EASE.ios}, border-color ${DURATION.base}s ${EASE.ios}`,
  }

  const linkStyle = {
    color: COLORS.link,
    fontFamily: TEXT_FONT,
    fontSize: 13,
    fontWeight: 500,
    lineHeight: 1.4,
    textDecoration: 'none',
    transition: `color ${DURATION.base}s ${EASE.ios}`,
  }

  const successStatusStyle = {
    backgroundColor: COLORS.soft,
    border: `1px solid ${COLORS.hairline}`,
    borderRadius: 10,
    padding: '12px 16px',
    color: COLORS.success,
    fontFamily: TEXT_FONT,
    fontSize: 13,
    fontWeight: 500,
    lineHeight: 1.35,
    textAlign: 'center',
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
    transition: `border-color ${DURATION.base}s ${EASE.ios}, box-shadow ${DURATION.base}s ${EASE.ios}`,
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

  return (
    <div className="min-h-screen bg-white">
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10 md:hidden">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center">
            <Link to="/" className="inline-block font-display font-medium text-[28px] leading-tight tracking-tight text-ink no-underline">
              Electro Infinity
            </Link>
          </div>

          <h1 className="mb-6 text-center text-ink" style={{ margin: '0 0 24px', fontFamily: DISPLAY_FONT, fontSize: 24, fontWeight: 400, lineHeight: 1.2, letterSpacing: 0 }}>
            Log into your account
          </h1>

          {successMsg && (
            <div className="mb-6" style={successStatusStyle}>
              {successMsg}
            </div>
          )}

          <div className="mb-6 flex gap-1 border p-1 rounded-lg" style={{ borderRadius: 10, backgroundColor: COLORS.canvas, borderColor: COLORS.hairline }}>
            <button
              type="button"
              onClick={() => { setTab('student'); setError('') }}
              style={tab === 'student' ? activeTabStyle : studentTabStyle}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => { setTab('faculty'); setError('') }}
              style={tab === 'faculty' ? activeTabStyle : studentTabStyle}
            >
              Faculty
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label style={labelStyle}>
                {tab === 'student' ? 'Roll Number' : 'Institutional Email'}
              </label>
              {tab === 'student' ? (
                <input
                  required
                  autoFocus
                  value={rollNo}
                  onChange={e => setRollNo(e.target.value.toUpperCase())}
                  className="input w-full"
                  style={{ ...inputStyle, textTransform: 'uppercase' }}
                  placeholder="e.g. 38701623001"
                />
              ) : (
                <input
                  required
                  autoFocus
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input w-full"
                  style={inputStyle}
                  placeholder="faculty@agemc.edu"
                />
              )}
            </div>

            <div>
              <label style={labelStyle}>
                Password
              </label>
              <div className="relative">
                <input
                  required
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input w-full"
                  style={{ ...inputStyle, paddingRight: 56 }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  style={showPasswordStyle}
                >
                  {showPwd ? 'Hide' : 'Show'}
                </button>
              </div>
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
              {loading ? 'Signing in…' : 'Log in'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/forgot-password" style={linkStyle}>
              Forgot password?
            </Link>
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1" style={{ backgroundColor: COLORS.hairline }} />
            <span style={{ color: COLORS.muted, fontFamily: TEXT_FONT, fontSize: 12, fontWeight: 500, lineHeight: 1.4, letterSpacing: 0.16, textTransform: 'uppercase' }}>or</span>
            <div className="h-px flex-1" style={{ backgroundColor: COLORS.hairline }} />
          </div>

          <p className="text-center" style={{ margin: 0, color: COLORS.body, fontFamily: TEXT_FONT, fontSize: 13, fontWeight: 400, lineHeight: 1.4 }}>
            {tab === 'student' ? 'Don\'t have an account? ' : 'New faculty? '}
            <Link to={tab === 'student' ? '/activate' : '/faculty/activate'} style={{ ...linkStyle, fontWeight: 500 }}>
              {tab === 'student' ? 'Activate now' : 'Activate account'}
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden min-h-screen items-center justify-center py-10 md:flex bg-white">
        <div className="mx-auto grid w-full max-w-[900px] grid-cols-2 overflow-hidden border bg-white" style={{ borderColor: COLORS.hairline, boxShadow: '0 16px 40px rgba(24, 29, 38, 0.08)' }}>
          <div className="hidden h-full min-h-[640px] md:block">
            <LoginCarousel slides={carouselSlides} />
          </div>

          <div className="flex min-h-[640px] flex-col justify-center px-6 py-10 md:px-12 md:py-14">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 style={{ margin: 0, color: COLORS.ink, fontFamily: DISPLAY_FONT, fontSize: 28, fontWeight: 400, lineHeight: 1.2, letterSpacing: 0 }}>
                Sign in
              </h1>
              <p className="mt-1" style={{ margin: '4px 0 0', color: COLORS.body, fontFamily: TEXT_FONT, fontSize: 14, fontWeight: 400, lineHeight: 1.25 }}>
                Choose your account type below to continue.
              </p>

              {successMsg && (
                <div className="mt-6" style={successStatusStyle}>
                  {successMsg}
                </div>
              )}

              <div className="mt-8 mb-6 flex gap-1 border p-1 rounded-lg" style={{ borderRadius: 10, backgroundColor: COLORS.canvas, borderColor: COLORS.hairline }}>
                <button
                  type="button"
                  onClick={() => { setTab('student'); setError('') }}
                  style={tab === 'student' ? activeTabStyle : studentTabStyle}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => { setTab('faculty'); setError('') }}
                  style={tab === 'faculty' ? activeTabStyle : studentTabStyle}
                >
                  Faculty
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label style={labelStyle}>
                    {tab === 'student' ? 'Roll Number' : 'Institutional Email'}
                  </label>
                  {tab === 'student' ? (
                    <input
                      required
                      autoFocus
                      value={rollNo}
                      onChange={e => setRollNo(e.target.value.toUpperCase())}
                      className="input w-full"
                      style={{ ...inputStyle, textTransform: 'uppercase' }}
                      placeholder="e.g. 38701623001"
                    />
                  ) : (
                    <input
                      required
                      autoFocus
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="input w-full"
                      style={inputStyle}
                      placeholder="faculty@agemc.edu"
                    />
                  )}
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label style={{ ...labelStyle, marginBottom: 0 }}>
                      Password
                    </label>
                    <Link to="/forgot-password" style={linkStyle}>
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      required
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="input w-full"
                      style={{ ...inputStyle, paddingRight: 56 }}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      style={showPasswordStyle}
                    >
                      {showPwd ? 'Hide' : 'Show'}
                    </button>
                  </div>
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
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>

              <p className="mt-8 text-center" style={{ margin: '32px 0 0', color: COLORS.body, fontFamily: TEXT_FONT, fontSize: 13, fontWeight: 400, lineHeight: 1.4 }}>
                {tab === 'student' ? 'Don\'t have an account? ' : 'New faculty? '}
                <Link to={tab === 'student' ? '/activate' : '/faculty/activate'} style={linkStyle}>
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
