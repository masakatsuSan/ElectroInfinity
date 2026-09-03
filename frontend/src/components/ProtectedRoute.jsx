import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SkeletonDashboard } from '../components/Skeleton'

export default function ProtectedRoute({ children, role, loginPath = '/login' }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas text-ink">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 pt-28 pb-24">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-hairline border-t-primary rounded-full animate-spin mb-6" />
            <p className="font-sans text-[16px] text-body-muted mb-2">Checking authentication...</p>
            <p className="font-sans text-[14px] text-slate">Please wait while we verify your session</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-canvas text-ink">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 pt-28 pb-24">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-soft-stone rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-body-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="font-display text-[24px] font-bold text-ink mb-3">Please Login to View This Section</h2>
            <p className="font-sans text-[16px] text-body-muted text-center max-w-md mb-6">
              You need to be logged in with your student ID to access this page. Please sign in to continue.
            </p>
            <div className="flex gap-3">
              <a href={loginPath} className="button-primary">
                Sign In with Student ID
              </a>
              <a href="/" className="button-secondary">
                Go to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const userRole = String(user.role ?? '').trim().toLowerCase()

  if (role && userRole !== 'super_admin') {
    const allowedRoles = role.split(',').map(r => r.trim().toLowerCase())
    if (!allowedRoles.includes(userRole)) {
      return (
        <div className="min-h-screen bg-canvas text-ink">
          <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 pt-28 pb-24">
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 bg-soft-stone rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-body-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="font-display text-[24px] font-bold text-ink mb-3">Access Restricted</h2>
              <p className="font-sans text-[16px] text-body-muted text-center max-w-md mb-6">
                You don't have permission to access this section. Please contact your administrator if you believe this is an error.
              </p>
              <a href="/" className="button-secondary">
                Go to Home
              </a>
            </div>
          </div>
        </div>
      )
    }
  }

  return children
}
