import React from 'react';
import PropTypes from 'prop-types';

export const Button = ({ children, variant = 'dark', onClick, className = '', ...props }) => {
  const baseClass = variant === 'dark' ? 'button-primary' : 'button-secondary';
  
  return (
    <button 
      className={`${baseClass} ${className}`} 
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['dark', 'light']),
  onClick: PropTypes.func,
  className: PropTypes.string,
};

export default Button;
