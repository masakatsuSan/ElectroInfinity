// ── Cloudinary delivery-URL helpers ────────────────────────────────────────
//
// Nothing is stored on the Render dyno's disk: uploads go straight to
// Cloudinary (memoryStorage -> uploadToCloudinary) and MongoDB keeps the
// returned secure_url. This module turns that stored URL into a URL that the
// browser treats as a *download*.
//
// Delivery URL anatomy:
//   https://res.cloudinary.com/<cloud>/<asset_type>/<delivery_type>/
//              [<transformations>/]<version>/<public_id>.<ext>
//
// The `fl_attachment` flag makes Cloudinary answer with
// `Content-Disposition: attachment` instead of embedding the file in a page,
// which is what the "Download" button needs when we redirect the browser at the
// stored URL instead of proxying the bytes through this server.
//
// On a raw asset the flag may carry a name — but only with its dots encoded
// twice, because Cloudinary's parser rejects a literal "." in a path component.
// See buildCloudinaryDownloadUrl for the measurements.

function isCloudinaryUrl(url) {
  if (!url || typeof url !== 'string') return false
  try {
    const { hostname } = new URL(url)
    return hostname === 'cloudinary.com' || hostname.endsWith('.cloudinary.com')
  } catch {
    return false
  }
}

// Which Cloudinary asset type a stored URL points at ('raw' | 'image' | 'video').
// Used to pick the right resource_type when deleting the asset again.
function cloudinaryAssetType(url) {
  if (!isCloudinaryUrl(url)) return null
  try {
    const segments = new URL(url).pathname.split('/').filter(Boolean)
    const assetType = segments[1]?.toLowerCase()
    return ['raw', 'image', 'video'].includes(assetType) ? assetType : null
  } catch {
    return null
  }
}

/**
 * Build the filename a browser should save a download as.
 *
 * Raw Cloudinary URLs have no extension — the public_id is built from the
 * original name with the extension stripped and a timestamp appended
 * (`DSA_Master_Roadmap-1791087492991`), so an `fl_attachment` with no value
 * makes the browser save the file as "file". Passing an explicit name here is
 * what fixes that.
 *
 * Falls back fileName -> title -> "document", so resources stored before this
 * was introduced (and any with a blank name) still download as something
 * recognisable. Always returns a `.pdf` name: the resources vault is PDFs only,
 * and a PDF served without an extension is what prompted this.
 *
 *   "Network Theory.pdf"        -> "Network_Theory.pdf"
 *   "my notes (1).pdf"          -> "my_notes_1_.pdf"
 *   "Study%20Material"          -> "Study_Material.pdf"   (decoded first)
 */
function buildPdfDownloadName(fileName, title) {
  // Stored names can arrive percent-encoded ("my%20notes%20%281%29") when the
  // public_id went through a URL round trip. Decode before sanitising, or the
  // saved name comes out as "my_20notes_20_281_29.pdf".
  let raw = String(fileName || '').trim()
  if (!raw) raw = String(title || '').trim()
  if (!raw) raw = 'document'

  if (/%[0-9A-Fa-f]{2}/.test(raw)) {
    try {
      raw = decodeURIComponent(raw)
    } catch {
      // Malformed percent-encoding — fall through and sanitize as-is.
    }
  }

  // Strip an existing extension so we never produce "notes.pdf.pdf".
  const base = raw.replace(/\.[A-Za-z0-9]{1,10}$/, '')

  const safe = base
    .replace(/[^\w\s-]/g, ' ')   // drop anything that is not letter/number/space/dash
    .replace(/\s+/g, '_')       // spaces (incl. runs) -> underscores
    .replace(/_+/g, '_')        // collapse repeats created above
    .replace(/^_+|_+$/g, '')    // no leading/trailing underscores
    .slice(0, 80)

  return `${safe || 'document'}.pdf`
}

/**
 * Build a direct-download URL for a Cloudinary asset.
 *
 * IMPORTANT — every line below was measured against the live account
 * (raw asset "electro-infinity/notes/Unit-1-Notes-final-1790359756175"):
 *
 *   /raw/upload/v123/x                              -> 200, attachment, filename="x"
 *   /raw/upload/fl_attachment/v123/x                -> 200, attachment, filename="file"
 *   /raw/upload/fl_attachment:Notes/v123/x          -> 200, attachment, filename="Notes"
 *   /raw/upload/fl_attachment:Notes.pdf/v123/x      -> 400  <-- dot is rejected
 *   /raw/upload/fl_attachment:Notes%252Epdf/v123/x  -> 200, attachment, filename="Notes.pdf"
 *
 * Two findings drive the implementation:
 *
 *  1. A bare `fl_attachment` is actively harmful for raw assets: Cloudinary does
 *     not derive a name from the public_id, it sends the literal `filename="file"`.
 *     That is the original "downloads as file" bug.
 *  2. `fl_attachment:<value>` is rejected with HTTP 400 whenever the value
 *     contains a "." — Cloudinary's transformation parser reads the dot as the
 *     start of a component extension. It is NOT the whole named form that is
 *     rejected; dot-free values work fine. Encoding the dot as `%2E` is not
 *     enough either, because the request line is decoded once before parsing and
 *     the dot reappears. Encoding it twice (`%252E`) survives that decode, and
 *     Cloudinary decodes it back to "." when it writes the header.
 *
 * So a raw asset gets `fl_attachment:<name>` with every dot double-encoded, which
 * both downloads and lands the right name. Image/video keep a bare
 * `fl_attachment`: naming them would require a non-PDF extension, and this vault
 * is PDFs only.
 *
 * Returns the input unchanged for a non-Cloudinary URL or a URL shape that does
 * not match the anatomy above, so a redirect can never be built from a guess.
 */
function buildCloudinaryDownloadUrl(url, fileName, title) {
  if (!isCloudinaryUrl(url)) return url

  let parsed
  try {
    parsed = new URL(url)
  } catch {
    return url
  }

  const segments = parsed.pathname.split('/').filter(Boolean)

  // Need at least <cloud>/<asset_type>/<delivery_type>/<public_id>.
  if (segments.length < 4) return url
  const assetType = segments[1]?.toLowerCase()
  if (!['raw', 'image', 'video'].includes(assetType)) return url

  // Strip any flag this builder (or an older deploy) previously left behind so
  // the URL cannot accumulate transformation components.
  const existing = segments.findIndex((s, i) => i >= 3 && s.startsWith('fl_attachment'))
  if (existing !== -1) segments.splice(existing, 1)

  // Everything from the `v<version>` component onwards is the public id and
  // must stay after the transformation.
  const versionIndex = segments.findIndex((s, i) => i >= 3 && /^v\d+$/.test(s))
  const insertAt = versionIndex === -1 ? 3 : versionIndex

  const component =
    assetType === 'raw'
      ? // "." -> "%2E" first, then percent-encode the whole name so that "%"
        // itself becomes "%25" and Cloudinary's parser never sees a literal dot.
        `fl_attachment:${encodeURIComponent(buildPdfDownloadName(fileName, title).replace(/\./g, '%2E')).replace(/%3A/gi, ':')}`
      : 'fl_attachment'

  segments.splice(insertAt, 0, component)

  parsed.pathname = `/${segments.join('/')}`
  return parsed.toString()
}

/**
 * Build the Cloudinary public_id for a directly-uploaded PDF.
 *
 * Raw assets keep their extension in the URL only when it is part of the
 * public_id, so `.pdf` is included here — that is what makes the delivery URL
 * end in `.pdf` instead of the bare, timestamp-suffixed name produced by the
 * older toSafePublicId() flow.
 *
 * The short random suffix means two uploads of "Network Theory.pdf" cannot
 * collide (a duplicate public_id with overwrite:false is a 500).
 *
 *   "Network Theory.pdf"  -> "Network_Theory-a1b2c3.pdf"
 *
 * Cloudinary rejects public_ids containing spaces or most punctuation, so the
 * name is reduced to the same safe character set used for download names.
 */
function buildPublicPdfId(fileName, folder = 'resources') {
  let raw = String(fileName || '').trim()
  if (/%[0-9A-Fa-f]{2}/.test(raw)) {
    try {
      raw = decodeURIComponent(raw)
    } catch {
      // Malformed percent-encoding — sanitize as-is.
    }
  }

  // Strip an existing extension; we append exactly one canonical ".pdf".
  const base = raw.replace(/\.[A-Za-z0-9]{1,10}$/, '')

  const safe = base
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60)

  const suffix = Math.random().toString(36).slice(2, 8)
  const prefix = folder ? `${folder}/` : ''

  return `${prefix}${safe || 'document'}-${suffix}.pdf`
}

module.exports = {
  isCloudinaryUrl,
  cloudinaryAssetType,
  buildPdfDownloadName,
  buildPublicPdfId,
  buildCloudinaryDownloadUrl,
}