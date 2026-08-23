import { createContext, useContext } from 'react'

/**
 * ForumFlipContext
 *
 * When a Forum dropdown item is clicked, the FLIP overlay mounts and provides
 * this context to everything inside it — most importantly the <BackButton />
 * inside the Forum page.  By checking the context, BackButton knows to call
 * onBack (the reverse FLIP animation) instead of navigate(-1), so the user
 * stays on their current page.
 *
 * Outside the overlay the context value is `null`, which means BackButton
 * falls through to its original behaviour unchanged.
 */
const ForumFlipContext = createContext(null)

export function useForumFlip() {
  return useContext(ForumFlipContext)
}

export default ForumFlipContext
