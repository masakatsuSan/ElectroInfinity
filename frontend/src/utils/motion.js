export const EASE = {
  ios: [0.25, 0.1, 0.25, 1],
  mac: [0.4, 0, 0.2, 1],
  out: [0.16, 1, 0.3, 1],
  inOut: [0.4, 0, 0.2, 1],
  spring: { type: 'spring', stiffness: 400, damping: 32, mass: 0.9 },
  springSoft: { type: 'spring', stiffness: 320, damping: 30, mass: 1.0 },
  springBounce: { type: 'spring', stiffness: 420, damping: 28, mass: 0.85 },
}

export const DURATION = {
  fast: 0.15,
  base: 0.22,
  slow: 0.35,
  slower: 0.5,
  page: 0.4,
  modal: 0.35,
  dropdown: 0.25,
  overlay: 0.3,
}

export const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 10 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -10 },
}

export const PAGE_TRANSITION = {
  type: 'spring',
  stiffness: 340,
  damping: 30,
  mass: 0.95,
}

export const MODAL_VARIANTS = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exiting: { opacity: 0, scale: 0.98, y: 4 },
}

export const MODAL_TRANSITION = {
  type: 'spring',
  stiffness: 400,
  damping: 32,
  mass: 0.9,
}

export const DROPDOWN_VARIANTS = {
  hidden: { opacity: 0, y: -4, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exiting: { opacity: 0, y: -2, scale: 0.99 },
}

export const DROPDOWN_TRANSITION = {
  type: 'spring',
  stiffness: 500,
  damping: 35,
  mass: 0.9,
}

export const OVERLAY_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exiting: { opacity: 0 },
}

export const OVERLAY_TRANSITION = {
  duration: DURATION.overlay,
  ease: EASE.mac,
}
