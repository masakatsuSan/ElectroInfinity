// Only these schemes may ever reach an href/src.
// Everything else (javascript:, data:, vbscript: …) is
// stripped so user-controlled links cannot execute script.
const SAFE_SCHEMES = /^(https?:|mailto:|tel:)/i

/**
 * Sanitize a URL before it is rendered into an href or src.
 * Returns the URL when it uses an allowed scheme, otherwise
 * null so the caller can skip rendering the link entirely.
 */
export function safeUrl(url) {
  if (typeof url !== 'string') return null
  const trimmed = url.trim()
  if (!trimmed) return null
  // Block control characters and whitespace that browsers
  // ignore inside schemes (e.g. "java\tscript:").
  if (/[\s<>]/.test(trimmed)) return null
  if (!SAFE_SCHEMES.test(trimmed)) return null
  return trimmed
}

/**
 * Sanitize a URL, falling back to '#' when it is unsafe so
 * the link simply goes nowhere instead of executing script.
 */
export function safeUrlOrHash(url) {
  return safeUrl(url) || '#'
}
