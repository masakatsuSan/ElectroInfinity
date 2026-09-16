import { useAuth } from '../context/AuthContext'

export default function ImageGuard({ children, className = '' }) {
  const { user, loading } = useAuth()

  if (loading || !user) {
    return (
      <div className={`relative overflow-hidden rounded-lg ${className}`}>
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface-soft/95">
          <div className="text-center p-4">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-muted">
              <svg className="w-6 h-6 text-body-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="font-sans text-[13px] font-medium text-ink mb-1">Login to view images</p>
            <a href="/login" className="inline-block mt-2 text-[12px] font-medium text-link hover:text-link-active">
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

  return <div className={`overflow-hidden ${className}`}>{children}</div>
}
