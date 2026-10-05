import { createContext, useContext, useState, useEffect } from 'react'
import { login as loginApi, getMe, logout as logoutApi } from '../api/auth'

const AuthContext = createContext(null)

// Wrap your whole app with this provider (done in main.jsx)
export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null)
  const [loading, setLoading] = useState(true)

  // On app load — the session lives in an httpOnly cookie, so the
  // server is the source of truth. A cached user in localStorage is
  // used for an instant first paint, then re-validated with
  // /auth/me; a dead session clears the cache.
  useEffect(() => {
    let cancelled = false
    const saved = localStorage.getItem('ei_user')
    if (saved) {
      try {
        setUser(JSON.parse(saved))
      } catch {
        localStorage.removeItem('ei_user')
      }
    }
    getMe()
      .then((res) => {
        if (cancelled) return
        const userData = res.data?.user || res.data?.data?.user || null
        if (userData) {
          localStorage.setItem('ei_user', JSON.stringify(userData))
          setUser(userData)
        } else {
          localStorage.removeItem('ei_user')
          setUser(null)
        }
      })
      .catch(() => {
        if (cancelled) return
        localStorage.removeItem('ei_user')
        setUser(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  // Login — call the API. The server sets the httpOnly session
  // cookies; no token is ever stored in JS-accessible storage.
  // data can be { rollNumber, password } for students
  // or { email, password } for admin
  const login = async (data) => {
    const res = await loginApi(data)
    const userData = res.data?.user || res.data?.data?.user
    if (userData) {
      localStorage.setItem('ei_user', JSON.stringify(userData))
      setUser(userData)
      return userData
    }
    // Some login responses (e.g. activation flows) carry the user
    // under a different key — fall back to a /auth/me round-trip.
    const me = await getMe()
    const fresh = me.data?.user || me.data?.data?.user
    if (fresh) {
      localStorage.setItem('ei_user', JSON.stringify(fresh))
      setUser(fresh)
      return fresh
    }
    return null
  }

  // Logout — revoke the session server-side (clears the cookies),
  // then drop the cached user.
  const logout = async () => {
    try {
      await logoutApi()
    } catch {
      // Even if the revocation request fails, clear local state.
    }
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
