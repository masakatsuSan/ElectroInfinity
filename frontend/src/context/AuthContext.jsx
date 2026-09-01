import { createContext, useContext, useState, useEffect } from 'react'
import { login as loginApi } from '../api/auth'

const AuthContext = createContext(null)

// Wrap your whole app with this provider (done in main.jsx)
export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null)
  const [loading, setLoading] = useState(true)

  // On app load — restore user from localStorage so they stay logged in
  useEffect(() => {
    const saved = localStorage.getItem('ei_user')
    if (saved) {
      try {
        setUser(JSON.parse(saved))
      } catch {
        localStorage.removeItem('ei_user')
      }
    }
    setLoading(false)
  }, [])

  // Login — call the API, save token + user to localStorage
  // data can be { rollNumber, password } for students
  // or { email, password } for admin
  const login = async (data) => {
    const res = await loginApi(data)
    const { token, user: userData } = res.data

    localStorage.setItem('ei_token', token)
    localStorage.setItem('ei_user', JSON.stringify(userData))
    setUser(userData)

    return userData
  }

  // Logout — clear everything
  const logout = () => {
    localStorage.removeItem('ei_token')
    localStorage.removeItem('ei_user')
    setUser(null)
  }

  // Helpers for checking roles in components
  const isAdmin   = user?.role === 'super_admin' || user?.role === 'admin'
  const isFaculty = user?.role === 'faculty'
  const isStudent = !!user
  const isModerator = user?.role === 'cr' || user?.role === 'faculty'
  const canManageRooms = isModerator || isAdmin

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser, isAdmin, isFaculty, isStudent, isModerator, canManageRooms }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook — use this instead of useContext(AuthContext) everywhere
// e.g.  const { user, login, logout } = useAuth()
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
