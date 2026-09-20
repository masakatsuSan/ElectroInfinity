import React from 'react'
import PropTypes from 'prop-types'
import { motion } from 'framer-motion'
import { useReducedMotion } from '../utils/motion'

export const Button = ({ children, variant = 'dark', onClick, className = '', ...props }) => {
  const baseClass = variant === 'dark' ? 'button-primary' : 'button-secondary'
  const reduced = useReducedMotion()

  const motionProps = reduced
    ? {}
    : {
        whileTap: { scale: 0.97 },
        transition: { type: 'spring', stiffness: 400, damping: 25 },
      }

  return (
    <motion.button
      className={`${baseClass} ${className}`}
      onClick={onClick}
      {...motionProps}
      {...props}
    >
      {children}
    </motion.button>
  )
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['dark', 'light']),
  onClick: PropTypes.func,
  className: PropTypes.string,
}

export default Button
