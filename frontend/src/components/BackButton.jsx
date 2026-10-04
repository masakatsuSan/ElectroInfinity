import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export default function BackButton({ fallback = '/', className = '' }) {
  const navigate = useNavigate()

  const goBack = () => {
    if (window.history.length > 2) {
      navigate(-1)
    } else {
      navigate(fallback)
    }
  }

  return (
    <button
      onClick={goBack}
      className={`button-icon-circular ${className}`}
      aria-label="Go back"
      type="button"
    >
      <ChevronLeft size={22} />
    </button>
  )
}
