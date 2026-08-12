import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { checkRoll, activateAccount } from '../api/auth'
import { useAuth } from '../context/AuthContext'

// Two steps:
// Step 1 — enter roll number → API checks if it exists and is unactivated
// Step 2 — set password → account activated → auto login

export default function Activate() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [step,     setStep]     = useState(1)      // 1 = enter roll, 2 = set password
  const [rollNo,   setRollNo]   = useState('')
  const [name,     setName]     = useState('')      // returned by check-roll
  const [batch,    setBatch]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  // Step 1 — check roll number
  const handleCheckRoll = async (e) => {
    e.preventDefault()
    if (!rollNo.trim()) return setError('Enter your roll number')
    setError('')
    setLoading(true)

    try {
      const res = await checkRoll(rollNo.trim())
      // API returns { name, batch } — show it so student confirms it's them
      setName(res.data.name)
      setBatch(res.data.batch)
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // Step 2 — set password and activate
  const handleActivate = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) return setError('Password must be at least 6 characters')
    if (password !== confirm) return setError('Passwords do not match')

    setLoading(true)
    try {
      const res = await activateAccount({ rollNumber: rollNo.trim(), password })

      // Auto-login after activation — save token + user
      const { token, user } = res.data
      localStorage.setItem('ei_token', token)
      localStorage.setItem('ei_user', JSON.stringify(user))

      // Navigate to student dashboard
      navigate('/students')
    } catch (err) {
      setError(err.response?.data?.error || 'Activation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-canvas text-ink pt-[44px]">
      <div className="w-full max-w-[400px]">

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-sans text-[12px] font-semibold transition-colors ${
            step >= 1 ? 'bg-primary text-white' : 'border border-divider-soft text-ink-muted-48'
          }`}>1</div>
          <div className={`h-px w-8 transition-colors ${step >= 2 ? 'bg-primary' : 'bg-divider-soft'}`} />
          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-sans text-[12px] font-semibold transition-colors ${
            step >= 2 ? 'bg-primary text-white' : 'border border-divider-soft text-ink-muted-48'
          }`}>2</div>
        </div>

        {step === 1 ? (
          <>
            <h1 className="font-display font-semibold text-[32px] leading-tight tracking-normal mb-2 text-center text-ink">
              Activate Account
            </h1>
            <p className="font-sans text-[17px] font-normal text-ink-muted-80 mb-8 text-center px-4">
              Enter your roll number. Your HOD has already added you — you just need to set a password.
            </p>

            <form onSubmit={handleCheckRoll} className="flex flex-col gap-5">
              <div>
                <label className="sr-only">Roll Number</label>
                <input
                  required
                  value={rollNo}
                  onChange={e => setRollNo(e.target.value.toUpperCase())}
                  className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-3 text-[17px] font-sans text-ink placeholder:text-ink-muted-48 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all uppercase"
                  placeholder="Roll Number (e.g. EE24001)"
                  autoFocus
                />
              </div>

              {error && <p className="font-sans text-[14px] font-medium text-red-500 text-center">{error}</p>}

              <button type="submit" disabled={loading}
                className="button-primary w-full mt-2">
                {loading ? 'Checking...' : 'Check Roll Number'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="font-display font-semibold text-[32px] leading-tight tracking-normal mb-2 text-center text-ink">
              Set Your Password
            </h1>

            {/* Confirm identity */}
            <div className="bg-surface-pearl border border-divider-soft rounded-lg p-5 mb-8 mt-6 text-center">
              <p className="font-sans text-[17px] font-semibold text-ink">{name}</p>
              <p className="font-sans text-[14px] text-ink-muted-80 mt-1 uppercase tracking-widest">
                {rollNo} <span className="opacity-50">·</span> {batch}
              </p>
              <p className="font-sans text-[12px] text-ink-muted-48 mt-3">Is this you? If not, go back and re-enter your roll number.</p>
            </div>

            <form onSubmit={handleActivate} className="flex flex-col gap-5">
              <div>
                <label className="sr-only">New Password</label>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-3 text-[17px] font-sans text-ink placeholder:text-ink-muted-48 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="New Password (min. 6 chars)"
                  autoFocus
                />
              </div>

              <div>
                <label className="sr-only">Confirm Password</label>
                <input
                  required
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="w-full bg-canvas border border-divider-soft rounded-lg px-4 py-3 text-[17px] font-sans text-ink placeholder:text-ink-muted-48 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="Confirm Password"
                />
              </div>

              {error && <p className="font-sans text-[14px] font-medium text-red-500 text-center">{error}</p>}

              <button type="submit" disabled={loading}
                className="button-primary w-full mt-2">
                {loading ? 'Activating...' : 'Activate Account'}
              </button>

              <button type="button" onClick={() => { setStep(1); setError('') }}
                className="text-link text-center mt-2 font-sans text-[14px]">
                Back (wrong roll number?)
              </button>
            </form>
          </>
        )}

        <div className="mt-8 flex justify-center text-[14px]">
          <Link to="/login" className="text-link">
            Already activated? Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
