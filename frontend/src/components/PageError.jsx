/**
 * Page-level error screen, shown inside the route area (Navbar/Footer stay
 * visible) when a single page crashes. Deliberately free of router/context
 * dependencies so it can never throw while reporting an error.
 */
export default function PageError({ resetKey }) {
  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 pt-28 pb-24">
      <div className="max-w-lg mx-auto flex flex-col items-center text-center py-16">
        <div className="w-16 h-16 bg-soft-stone rounded-full flex items-center justify-center mb-6">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-signature-coral"
            aria-hidden="true"
          >
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
        </div>

        <h2 className="font-display text-[24px] font-bold text-ink mb-3">This page hit a problem</h2>
        <p className="font-sans text-[16px] text-body-muted text-center max-w-md mb-6">
          Something went wrong while rendering this section. You can retry it, or head back home —
          the rest of the site is unaffected.
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          <button type="button" onClick={() => window.location.reload()} className="button-primary">
            Retry
          </button>
          <a href="/" className="button-secondary">
            Go to Home
          </a>
        </div>
        {resetKey ? (
          <p className="mt-4 font-mono text-[11px] text-body-muted">Section: {resetKey}</p>
        ) : null}
      </div>
    </div>
  )
}