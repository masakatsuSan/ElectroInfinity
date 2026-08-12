import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Usage:
// <ProtectedRoute>                    → any logged-in user
// <ProtectedRoute role="super_admin"> → admin only

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()

  // Still loading from localStorage — show nothing yet
  if (loading) return null

  // Not logged in → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Role check: super_admin can always pass any role check
  if (role && user.role !== 'super_admin') {
    const allowedRoles = role.split(',').map(r => r.trim())
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/" replace />
    }
  }

  return children
}
