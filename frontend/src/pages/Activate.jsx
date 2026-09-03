import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { checkRoll, activateAccount } from '../api/auth'

export default function Activate() {
  const navigate  = useNavigate()

  const [step,     setStep]     = useState(1)
  const [rollNo,   setRollNo]   = useState('')
  const [name,     setName]     = useState('')
  const [batch,    setBatch]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleCheckRoll = async (e) => {
    e.preventDefault()
    if (!rollNo.trim()) return setError('Enter your roll number')
    setError('')
    setLoading(true)

    try {
      const res = await checkRoll(rollNo.trim())
      setName(res.data.name)
      setBatch(res.data.batch)
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleActivate = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) return setError('Password must be at least 6 characters')
    if (password !== confirm) return setError('Passwords do not match')

    setLoading(true)
    try {
      const res = await activateAccount({ rollNumber: rollNo.trim(), password })
      const { token, user } = res.data
      localStorage.setItem('ei_token', token)
      localStorage.setItem('ei_user', JSON.stringify(user))
      navigate('/students')
    } catch (err) {
      setError(err.response?.data?.error || 'Activation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-canvas text-ink py-28">
      <div className="w-full max-w-md bg-white border border-hairline rounded-2xl p-8 sm:p-10 shadow-card">

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-[12px] font-bold transition-colors ${
            step >= 1 ? 'bg-primary text-white' : 'border border-hairline text-slate'
          }`}>1</div>
          <div className={`h-px w-10 transition-colors ${step >= 2 ? 'bg-primary' : 'bg-hairline'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-[12px] font-bold transition-colors ${
            step >= 2 ? 'bg-primary text-white' : 'border border-hairline text-slate'
          }`}>2</div>
        </div>

        {step === 1 ? (
          <>
            <div className="text-center mb-8">
              <span className="font-mono text-[12px] uppercase tracking-wider text-coral font-semibold block mb-2">
                New Student Activation
              </span>
              <h1 className="font-display font-bold text-[30px] tracking-tight text-ink mb-2">
                Activate Account
              </h1>
              <p className="font-sans text-[14px] text-body-muted">
                Enter your university roll number to verify your pre-registered account.
              </p>
            </div>

            <form onSubmit={handleCheckRoll} className="flex flex-col gap-5">
              <div>
                <label className="font-mono text-[12px] uppercase tracking-wider font-semibold text-slate mb-1.5 block">
                  Roll Number
                </label>
                <input
                  required
                  value={rollNo}
                  onChange={e => setRollNo(e.target.value.toUpperCase())}
                  className="input uppercase font-mono"
                  placeholder="e.g. EE24001"
                  autoFocus
                />
              </div>

              {error && <p className="text-[13px] font-medium text-error bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">{error}</p>}

              <button type="submit" disabled={loading} className="button-primary w-full py-3.5 mt-2">
                {loading ? 'Verifying Roll Number…' : 'Continue →'}
              </button>
            </form>
          </>
        ) : (
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
                {rollNo} · Batch {batch}
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
                ← Back (change roll number)
              </button>
            </form>
          </>
        )}

        <div className="mt-8 pt-4 border-t border-hairline text-center text-[13px] font-sans">
          <Link to="/login" className="text-action-blue hover:underline font-semibold">
            Already activated? Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
