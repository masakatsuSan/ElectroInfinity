import { Link } from 'react-router-dom'
import { BRAND_NAME, BRAND_ATTRIBUTION, LOGO_MARK } from '../config/brand'

const MARK_SRC_SET = `${LOGO_MARK} 1x, ${LOGO_MARK} 2x`

const variantClasses = {
  mark: 'h-10 w-10',
  full: 'h-10 w-10',
  large: 'h-12 w-12',
}

const textSizeClasses = {
  full: 'text-[20px]',
  large: 'text-[24px]',
}

const attributionSizeClasses = {
  full: 'text-[11px]',
  large: 'text-xs',
}

export default function BrandLogo({ variant = 'full', expanded = true, className, onClick }) {
  const showText = variant !== 'mark' && expanded
  const rootClassName = ['inline-flex items-center shrink-0 no-underline', className].filter(Boolean).join(' ')
  const ariaLabel = `${BRAND_NAME}, ${BRAND_ATTRIBUTION}`

  const linkProps = { to: '/', 'aria-label': ariaLabel, className: rootClassName }
  if (onClick) linkProps.onClick = onClick

  if (variant === 'mark') {
    return (
      <Link {...linkProps}>
        <img
          src={LOGO_MARK}
          alt=""
          width={753}
          height={484}
          srcSet={MARK_SRC_SET}
          className={`${variantClasses.mark} shrink-0 object-contain`}
        />
      </Link>
    )
  }

  return (
    <Link {...linkProps}>
      <img
        src={LOGO_MARK}
        alt=""
        width={753}
        height={484}
        srcSet={MARK_SRC_SET}
        className={`${variantClasses[variant]} shrink-0 object-contain`}
      />
      <span
        className="inline-flex flex-col justify-center leading-none whitespace-nowrap transition-[opacity,max-width,margin-left] duration-150"
        style={{
          opacity: showText ? 1 : 0,
          maxWidth: showText ? 200 : 0,
          marginLeft: showText ? 10 : 0,
        }}
      >
        <span
          className={`font-brand font-semibold tracking-tight ${textSizeClasses[variant]}`}
        >
          <span className="text-brand-navy">College</span>{' '}
          <span className="text-brand-teal">Connect</span>
        </span>
        <span
          className={`font-brand leading-none mt-1 text-muted ${attributionSizeClasses[variant]}`}
        >
          {BRAND_ATTRIBUTION}
        </span>
      </span>
    </Link>
  )
}
