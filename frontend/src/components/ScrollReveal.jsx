import { motion } from 'framer-motion'
import { useReducedMotion, SCROLL_REVEAL_VARIANTS } from '../utils/motion'

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
      viewport={{ once: true, margin: '-80px' }}
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
