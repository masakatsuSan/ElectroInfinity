import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/auth'

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
      return setError('PASSWORDS DO NOT MATCH')
    }
    if (form.password.length < 6) {
      return setError('PASSWORD MUST BE AT LEAST 6 CHARACTERS')
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
      setError(err.response?.data?.error || 'REGISTRATION FAILED. TRY AGAIN.')
    } finally {
      setLoading(false)
    }
  }

  // Show success screen after registration
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-canvas text-ink">
        <div className="w-full max-w-sm text-center">
          <div className="font-display font-bold text-[48px] text-ink mb-6">✓</div>
          <h1 className="font-display font-bold text-[36px] tracking-[1.2px] mb-4 uppercase">
            REGISTERED!
          </h1>
          <p className="font-display text-[14px] uppercase tracking-[0.96px] font-bold opacity-80 leading-[1.8] mb-8 text-ink-muted-80">
            Your account is waiting for admin approval. You'll be able to log in
            once the HOD verifies your account. This usually takes 1–2 days.
          </p>
          <Link to="/login" className="button-ghost-on-dark inline-block">
            BACK TO LOGIN
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-24 bg-canvas text-ink">
      <div className="w-full max-w-md">
        <span className="font-display text-[10px] uppercase tracking-[0.96px] font-bold text-ink-muted-80 block mb-2">STUDENT REGISTRATION</span>
        <h1 className="font-display font-bold text-[36px] leading-[1.1] tracking-[1.2px] mb-4 uppercase">
          CREATE ACCOUNT
        </h1>
        <p className="font-display text-[12px] uppercase tracking-[0.96px] font-bold text-ink-muted-80 mb-10 leading-[1.6]">
          After registering, the HOD must approve your account before you can log in.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* Personal info */}
          <div>
            <label className="font-display text-[10px] uppercase tracking-[0.96px] font-bold text-ink-muted-80 mb-2 block">FULL NAME *</label>
            <input required value={form.name} onChange={set('name')}
              className="w-full bg-surface-pearl border border-divider-soft text-ink px-4 py-3 text-[14px] focus:outline-none focus:border-on-primary transition-colors" placeholder="YOUR FULL NAME" />
          </div>

          <div>
            <label className="font-display text-[10px] uppercase tracking-[0.96px] font-bold text-ink-muted-80 mb-2 block">COLLEGE EMAIL *</label>
            <input required type="email" value={form.email} onChange={set('email')}
              className="w-full bg-surface-pearl border border-divider-soft text-ink px-4 py-3 text-[14px] focus:outline-none focus:border-on-primary transition-colors" placeholder="YOU@AGEMC.EDU" />
          </div>

          {/* Academic info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-display text-[10px] uppercase tracking-[0.96px] font-bold text-ink-muted-80 mb-2 block">ROLL NUMBER</label>
              <input value={form.rollNumber} onChange={set('rollNumber')}
                className="w-full bg-surface-pearl border border-divider-soft text-ink px-4 py-3 text-[14px] focus:outline-none focus:border-on-primary transition-colors uppercase" placeholder="EE24001" />
            </div>
            <div>
              <label className="font-display text-[10px] uppercase tracking-[0.96px] font-bold text-ink-muted-80 mb-2 block">REGISTRATION NO.</label>
              <input value={form.regNumber} onChange={set('regNumber')}
                className="w-full bg-surface-pearl border border-divider-soft text-ink px-4 py-3 text-[14px] focus:outline-none focus:border-on-primary transition-colors uppercase" placeholder="REG24001" />
            </div>
          </div>

          <div>
            <label className="font-display text-[10px] uppercase tracking-[0.96px] font-bold text-ink-muted-80 mb-2 block">BATCH *</label>
            <select value={form.batch} onChange={set('batch')}
              className="w-full bg-surface-pearl border border-divider-soft text-ink px-4 py-3 text-[14px] focus:outline-none focus:border-on-primary transition-colors">
              {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Password */}
          <div>
            <label className="font-display text-[10px] uppercase tracking-[0.96px] font-bold text-ink-muted-80 mb-2 block">PASSWORD *</label>
            <input required type="password" value={form.password} onChange={set('password')}
              className="w-full bg-surface-pearl border border-divider-soft text-ink px-4 py-3 text-[14px] focus:outline-none focus:border-on-primary transition-colors" placeholder="MIN. 6 CHARACTERS" />
          </div>

          <div>
            <label className="font-display text-[10px] uppercase tracking-[0.96px] font-bold text-ink-muted-80 mb-2 block">CONFIRM PASSWORD *</label>
            <input required type="password" value={form.confirmPassword} onChange={set('confirmPassword')}
              className="w-full bg-surface-pearl border border-divider-soft text-ink px-4 py-3 text-[14px] focus:outline-none focus:border-on-primary transition-colors" placeholder="SAME PASSWORD AGAIN" />
          </div>

          {error && <p className="font-display text-[12px] uppercase tracking-[0.96px] font-bold text-red-500">{error}</p>}

          <button type="submit" disabled={loading}
            className="button-ghost-on-dark mt-2 w-full text-center">
            {loading ? 'REGISTERING...' : 'REGISTER'}
          </button>
        </form>

        <p className="font-display text-[12px] uppercase tracking-[0.96px] font-bold text-ink-muted-80 mt-8 text-center">
          ALREADY HAVE AN ACCOUNT?{' '}
          <Link to="/login" className="text-ink hover:text-ink-muted-80 transition-colors underline">LOG IN</Link>
        </p>
      </div>
    </div>
  )
}
