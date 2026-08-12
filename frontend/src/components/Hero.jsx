import React from 'react';
import PropTypes from 'prop-types';
import { Button } from './Button';

export const Hero = ({ headline, imageSrc, ctaText, onCtaClick }) => {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-canvas-night">
      {/* Background Image/Video */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${imageSrc})` }}
      />
      
      {/* No overlay gradient according to Spasex design - the photo is graded instead */}
      
      {/* Content Container */}
      <div className="relative z-10 w-full h-full flex flex-col justify-end items-center pb-24 px-6 md:px-12 text-center">
        {headline && (
          <h1 className="text-display-xxl md:text-[80px] text-[40px] font-display text-on-primary tracking-hero leading-hero mb-8 max-w-5xl uppercase">
            {headline}
          </h1>
        )}
        
        {ctaText && (
          <Button variant="dark" onClick={onCtaClick}>
            {ctaText}
          </Button>
        )}
      </div>
    </div>
  );
};

Hero.propTypes = {
  headline: PropTypes.string,
  imageSrc: PropTypes.string.isRequired,
  ctaText: PropTypes.string,
  onCtaClick: PropTypes.func,
};

export default Hero;
