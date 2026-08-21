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
      className={`flex items-center justify-center w-9 h-9 rounded-full hover:bg-soft-stone text-body-muted hover:text-ink transition-colors -ml-2 ${className}`}
      aria-label="Go back"
      type="button"
    >
      <ChevronLeft size={22} />
    </button>
  )
}
