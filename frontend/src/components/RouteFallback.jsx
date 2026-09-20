/**
 * Shown while a lazily-loaded route chunk is being fetched.
 *
 * It replaces only the page area (Navbar/Footer stay put), and it is a skeleton
 * rather than a spinner because chunk fetches are usually fast — this is the
 * difference between "the app is loading" and "the app is broken".
 */
export default function RouteFallback() {
  return (
    <div
      className="w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 pt-28 pb-24"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="skeleton-shimmer space-y-4">
        <div className="h-8 w-2/3 max-w-md rounded bg-transparent" />
        <div className="h-4 w-1/2 max-w-sm rounded bg-transparent" />
        <div className="h-4 w-1/3 max-w-xs rounded bg-transparent" />
      </div>
    </div>
  )
}