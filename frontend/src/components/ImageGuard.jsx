import { useAuth } from '../context/AuthContext'

export default function ImageGuard({ children, className = '' }) {
  const { user, loading } = useAuth()

  if (loading || !user) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <div className="absolute inset-0 backdrop-blur-md bg-soft-stone/60 z-10 flex items-center justify-center">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
              <svg className="w-6 h-6 text-body-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="font-sans text-[13px] font-semibold text-ink mb-1">Login to view images</p>
            <a href="/login" className="inline-block mt-2 text-[12px] font-bold text-primary hover:underline">
              Sign in with Student ID →
            </a>
          </div>
        </div>
        <div className="blur-sm select-none pointer-events-none">
          {children}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
