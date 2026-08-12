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
      navigate(user.role === 'admin' || user.role === 'super_admin' ? '/admin' : '/students')
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
  
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)

    try {
      const payload = tab === 'student'
        ? { rollNumber: rollNo.trim().toUpperCase(), password }
        : { email: email.trim().toLowerCase(), password }

      const user = await login(payload)

      if (user.role === 'admin' || user.role === 'super_admin' || user.role === 'faculty') {
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

  if (user) return null;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden bg-canvas">
      
      {/* ── Left Side: College Photo ── */}
      <div className="w-full h-[35vh] lg:h-screen lg:w-1/2 relative order-1 lg:order-none">
        <img 
          src="../src/clg.jpg" 
          alt="AGEMC College Campus" 
          className="w-full h-full object-cover rounded-b-[40px] lg:rounded-none shadow-sm" 
        />
        {/* Subtle gradient overlay to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent lg:rounded-none rounded-b-[40px]"></div>
        
        {/* Text Container */}
        <div className="absolute bottom-6 lg:bottom-12 left-6 lg:left-12 pr-6 max-w-md z-10">
          <h3 className="font-display font-medium text-[28px] lg:text-[36px] leading-tight tracking-[-0.02em] mb-2 text-canvas">Welcome to AGEMC</h3>
          <p className="font-sans text-[15px] lg:text-[16px] font-[450] text-canvas/80 leading-relaxed">
            Empowering the next generation of Electrical Engineers through hands-on learning and innovation.
          </p>
        </div>
      </div>  

      {/* ── Right Side: Login Panel ── */}
      <div className="w-full lg:w-1/2 flex-1 flex flex-col items-center justify-center pt-8 lg:pt-24 pb-16 relative overflow-hidden bg-canvas order-2 lg:order-none">
      
      {/* ── Seamless Animated Gradient Background ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-40 transition-transform duration-1000 ease-out"
          style={{ 
            background: 'radial-gradient(circle, rgba(12,34,105,1) 0%, rgba(41,86,214,1) 100%)',
            transform: `translate(${mousePos.x}px, ${mousePos.y}px)`
          }}
        ></div>
        <div 
          className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-30 transition-transform duration-1000 ease-out delay-75"
          style={{ 
            background: 'radial-gradient(circle, rgba(0,113,227,1) 0%, rgba(10,132,255,1) 100%)',
            transform: `translate(${-mousePos.x}px, ${-mousePos.y}px)`
          }}
        ></div>
      </div>
      
      {/* ── Glassy Form Container (Not a stark box) ── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[480px] px-6 sm:px-12 py-16 relative z-10 flex flex-col"
      >
        <div className="flex flex-col items-center mb-10">
          <h2 className="font-display font-bold text-[32px] text-ink text-center tracking-tight mb-3">
            Welcome back
          </h2>
          <p className="font-sans text-[16px] text-ink-muted-80 text-center max-w-[280px]">
            Enter your details to securely access your portal.
          </p>
        </div>

        {successMsg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-green-500/10 border border-green-500/20 backdrop-blur-md rounded-xl px-4 py-3 mb-8 font-sans text-[14px] font-medium text-green-700 dark:text-green-400 text-center">
            {successMsg}
          </motion.div>
        )}

        {/* Custom Glass Tabs */}
        <div className="flex p-1 bg-surface-chip-translucent backdrop-blur-xl rounded-xl mb-8 border border-divider-soft shadow-inner">
          <button 
            onClick={() => { setTab('student'); setError('') }}
            className={`flex-1 py-2.5 rounded-lg font-sans text-[14px] font-semibold flex items-center justify-center gap-2 transition-all ${tab === 'student' ? 'bg-canvas text-ink shadow-sm' : 'text-ink-muted-48 hover:text-ink'}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Student
          </button>
          <button 
            onClick={() => { setTab('faculty'); setError('') }}
            className={`flex-1 py-2.5 rounded-lg font-sans text-[14px] font-semibold flex items-center justify-center gap-2 transition-all ${tab === 'faculty' ? 'bg-canvas text-ink shadow-sm' : 'text-ink-muted-48 hover:text-ink'}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
            Faculty
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-ink-muted-48 group-focus-within:text-ink transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            {tab === 'student' ? (
              <input required autoFocus
                value={rollNo}
                onChange={e => setRollNo(e.target.value.toUpperCase())}
                className="w-full bg-surface-pearl dark:bg-surface-tile-1 border border-divider-soft rounded-[999px] pl-14 pr-6 py-4 text-[16px] font-sans text-ink placeholder:text-ink-muted-48 focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-all shadow-sm"
                placeholder="Roll Number (e.g. EE24001)"
              />
            ) : (
              <input required autoFocus type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-surface-pearl dark:bg-surface-tile-1 border border-divider-soft rounded-[999px] pl-14 pr-6 py-4 text-[16px] font-sans text-ink placeholder:text-ink-muted-48 focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-all shadow-sm"
                placeholder="Email Address"
              />
            )}
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-ink-muted-48 group-focus-within:text-ink transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <input required type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-surface-pearl dark:bg-surface-tile-1 border border-divider-soft rounded-[999px] pl-14 pr-14 py-4 text-[16px] font-sans text-ink placeholder:text-ink-muted-48 focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-all shadow-sm"
              placeholder="Password"
            />
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute inset-y-0 right-0 pr-6 flex items-center text-ink-muted-48 hover:text-ink transition-colors">
              {showPwd ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between mt-2 mb-4 px-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 rounded border-divider-soft text-ink focus:ring-ink/50 transition-colors" />
              <span className="font-sans text-[14px] text-ink-muted-80 group-hover:text-ink transition-colors">Remember me</span>
            </label>
            {tab === 'student' && (
              <Link to="/forgot-password" className="text-link text-[14px]">
                Recover password
              </Link>
            )}
          </div>

          {error && (
            <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="font-sans text-[14px] font-medium text-red-500 text-center bg-red-500/10 backdrop-blur-md py-3 rounded-[20px] mb-2 border border-red-500/20">
              {error}
            </motion.p>
          )}

          <button type="submit" disabled={loading}
            className="button-primary w-full py-4 mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            {!loading && <svg className="transform transition-transform group-hover:translate-x-1 ml-2" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>}
          </button>
        </form>

        {tab === 'student' && (
          <div className="mt-8 text-center">
            <p className="font-sans text-[14px] text-ink-muted-80">
              New to Electro Infinity? <Link to="/activate" className="text-primary hover:text-primary-focus font-medium ml-1">Activate your account</Link>
            </p>
          </div>
        )}
      </motion.div>
      </div>
    </div>
  )
}
