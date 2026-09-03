import { useState, useEffect, useCallback } from 'react'

export default function Carousel({ slides, interval = 4000 }) {
  const [index, setIndex] = useState(0)

  const next = useCallback(() => {
    setIndex(i => (i + 1) % slides.length)
  }, [slides.length])

  const prev = () => {
    setIndex(i => (i - 1 + slides.length) % slides.length)
  }

  useEffect(() => {
    const timer = setInterval(next, interval)
    return () => clearInterval(timer)
  }, [next, interval])

  if (!slides.length) return null

  return (
    <div className="relative w-full h-full overflow-hidden rounded-none md:rounded-3xl">
      {/* Slides */}
      <div
        className="flex transition-transform duration-700 ease-in-out h-full"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            className="w-full h-full flex-shrink-0 relative"
            style={{ backgroundImage: `url(${slide.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          >
            {/* Bottom fade for text readability */}
            <div className="absolute inset-x-0 bottom-0 h-32 md:h-48 bg-gradient-to-t from-white/90 via-white/40 to-transparent" />

            {/* Border frame */}
            <div className="absolute inset-4 md:inset-8 border border-black/30 rounded-2xl md:rounded-3xl pointer-events-none" />

            {/* Slide content */}
            <div className="absolute bottom-8 md:bottom-12 left-6 md:left-10 right-6 md:right-10 text-ink">
              <p className="font-mono text-[11px] uppercase tracking-wider text-ink/70 mb-2">
                {slide.tag}
              </p>
              <h3 className="font-display text-[20px] md:text-[28px] font-bold leading-tight mb-2">
                {slide.title}
              </h3>
              <p className="font-sans text-[13px] md:text-[15px] text-ink/80 leading-relaxed">
                {slide.subtitle}
              </p>
            </div>
          </div>
        ))}
       
      </div>

      {/* Navigation arrows */}
      <button
        type="button"
        onClick={prev}
        className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={next}
        className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
      >
        ›
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
