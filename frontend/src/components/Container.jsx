// Reusable inner width cap. Sections/bars keep a full-bleed background while
// only their textual content is capped here. Replaces the ad-hoc
// `mx-auto max-w-[1100px] px-4 md:px-6` that was inlined in App.jsx's <main>.
export default function Container({ className = '', children, ...props }) {
  return (
    <div
      className={[
        'mx-auto',
        'w-full',
        'max-w-[1100px]',
        'px-4',
        'md:px-6',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}
