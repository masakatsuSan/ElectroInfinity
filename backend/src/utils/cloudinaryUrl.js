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
 * Build a direct-download URL for a Cloudinary asset.
 *
 * Inserts `fl_attachment` as its own transformation component directly after
 * the delivery type (`/raw/upload/`) and before the `v<version>` component —
 * that is the only position where Cloudinary parses it.
 *
 * Returns the input unchanged for a non-Cloudinary URL or a URL shape that does
 * not match the anatomy above, so a redirect can never be built from a guess.
 */
function buildCloudinaryDownloadUrl(url, _fileName) {
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
  if (!['raw', 'image', 'video'].includes(segments[1]?.toLowerCase())) return url
  if (segments.some((s) => s.startsWith('fl_attachment'))) return parsed.toString()

  // Everything from the `v<version>` component onwards is the public id and
  // must stay after the transformation.
  const versionIndex = segments.findIndex((s, i) => i >= 3 && /^v\d+$/.test(s))
  const insertAt = versionIndex === -1 ? 3 : versionIndex

  segments.splice(insertAt, 0, 'fl_attachment')
  parsed.pathname = `/${segments.join('/')}`

  return parsed.toString()
}

module.exports = {
  isCloudinaryUrl,
  cloudinaryAssetType,
  buildCloudinaryDownloadUrl,
}