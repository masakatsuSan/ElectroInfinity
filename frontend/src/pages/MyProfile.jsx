import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function MyProfile() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user?._id) {
      navigate(`/profile/${user._id}`, { replace: true })
    } else {
      navigate('/login', { replace: true })
    }
  }, [user, navigate])

  return null
}