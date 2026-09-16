import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import ForumFlipContext from '../context/ForumFlipContext'

export default function BackButton({ fallback = '/', className = '' }) {
  const navigate = useNavigate()
  const forumFlip = useContext(ForumFlipContext)

  const goBack = () => {
    // When inside the Forum FLIP overlay, trigger the reverse animation
    // instead of standard navigation.
    if (forumFlip?.isFlipped) {
      forumFlip.onBack()
      return
    }
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
