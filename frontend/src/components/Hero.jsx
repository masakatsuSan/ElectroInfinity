import React from 'react';
import PropTypes from 'prop-types';
import { Button } from './Button';

export const Hero = ({ headline, imageSrc, ctaText, onCtaClick }) => {
  return (
    <section className="relative min-h-screen bg-white text-ink">
      <div className="grid min-h-screen md:grid-cols-2">
        <div className="order-2 md:order-1 flex flex-col justify-center bg-white px-6 py-section md:px-12">
          {headline && (
            <h1 className="font-display text-display-lg md:text-display-xl font-normal leading-tight mb-8 max-w-2xl">
              {headline}
            </h1>
          )}

          {ctaText && (
            <Button variant="dark" onClick={onCtaClick}>
              {ctaText}
            </Button>
          )}
        </div>
        <div className="order-1 md:order-2 h-[45vh] md:h-full overflow-hidden bg-surface-strong">
          <div
            className="h-full w-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${imageSrc})` }}
          />
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
