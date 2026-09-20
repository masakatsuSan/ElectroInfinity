/**
 * Last-resort error screen.
 *
 * Rendered by the OUTERMOST <ErrorBoundary> in main.jsx, which sits above
 * BrowserRouter / AuthProvider. That means it must not depend on any context,
 * router or animation library — importing `Link` or a framer-motion hook here
 * would throw a second time and produce the very white screen we are trying to
 * avoid.
 */
export default function FatalError() {
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-soft-stone flex items-center justify-center">
        <svg
          width="28"
          height="28"
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

      <div className="max-w-md space-y-2">
        <h1 className="font-display text-[24px] font-bold text-ink">
          Something went wrong loading the app
        </h1>
        <p className="font-sans text-[15px] text-body-muted">
          This is usually a temporary problem after an update. Reloading normally fixes it.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={() => window.location.reload()} className="button-primary">
          Reload
        </button>
        <a href="/" className="button-secondary">
          Go to Home
        </a>
      </div>
    </div>
  )
}