import { motion } from 'framer-motion'
import { useReducedMotion, SCROLL_REVEAL_VARIANTS } from '../utils/motion'
import { useMainPanel } from '../context/LayoutContext'

const DEFAULT_VARIANT = 'fadeUp'
const DEFAULT_DELAY = 0
const DEFAULT_DURATION = 0.5

export default function ScrollReveal({
  children,
  variant = DEFAULT_VARIANT,
  delay = DEFAULT_DELAY,
  duration = DEFAULT_DURATION,
  className = '',
  as: Component = 'div',
  ...rest
}) {
  const reduced = useReducedMotion()
  /* Above 1024px the reveal must trigger against the Main panel's scrollport,
     not the window — otherwise the -80px lead-in is measured from the viewport
     edge and elements reveal at the wrong scroll depth. Null below 1024px
     keeps framer-motion's default (viewport root), i.e. mobile is unchanged. */
  const root = useMainPanel()
  const variants = SCROLL_REVEAL_VARIANTS[variant] || SCROLL_REVEAL_VARIANTS.fadeUp

  if (reduced) {
    return (
      <Component className={className} {...rest}>
        {children}
      </Component>
    )
  }

  const MotionComponent = typeof Component === 'string' ? motion[Component] : motion(Component)

  return (
    <MotionComponent
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px', root }}
      exit="exiting"
      variants={variants}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      {...rest}
    >
      {children}
    </MotionComponent>
  )
}
