// ── Where a resource's file actually lives ─────────────────────────────────
//
// Pure helpers shared by the resources routes. Kept out of routes/resources.js
// so they can be unit-tested without booting Express or MongoDB.
//
// The rule: the API server never fetches or streams the bytes. It resolves the
// stored fileUrl to a URL the browser can download from directly and redirects
// there. The previous implementation piped the upstream response through the
// process, which is what produced the "0.5 KB x.pdf that will not open"
// downloads — Google Drive answers an unrecognised or non-public share link
// with a small HTML page (login / permission / virus-scan notice), and that page
// was handed to the user labelled `Content-Type: application/pdf`, filename
// `*.pdf`.

const {
  isGoogleDriveUrl,
  isGoogleFolderUrl,
  isGoogleNonFileUrl,
  extractGoogleDriveFileId,
  buildDriveDownloadUrl,
} = require('./googleDrive')
const { isCloudinaryUrl, buildCloudinaryDownloadUrl } = require('./cloudinaryUrl')

/**
 * Resolve a stored fileUrl to a URL the browser can download from directly.
 *
 *  - Google Drive share links  -> https://drive.google.com/uc?export=download&id=<FILE_ID>
 *  - Cloudinary uploads       -> the stored secure_url + the fl_attachment flag
 *  - any other http(s) URL    -> unchanged
 *
 * Returns `{ url }`, or `{ status, error }` when there is nothing to redirect to.
 */
function resolveDirectDownloadUrl(resource) {
  const stored = resource?.fileUrl

  if (!stored || typeof stored !== 'string' || !stored.trim()) {
    return { status: 404, error: 'This resource has no file attached' }
  }
  const url = stored.trim()

  if (isGoogleDriveUrl(url)) {
    if (isGoogleFolderUrl(url)) {
      return { status: 400, error: 'This link points to a Google Drive folder, not a file' }
    }
    if (isGoogleNonFileUrl(url)) {
      return { status: 400, error: 'That is a Google Form or Drawing — publish or export it as a file first' }
    }
    const fileId = extractGoogleDriveFileId(url)
    if (!fileId) {
      return { status: 400, error: 'Invalid Google Drive link — the file ID could not be read' }
    }
    // confirm=t skips Drive's large-file interstitial for the sizes where
    // Drive allows it.
    return { url: buildDriveDownloadUrl(fileId, { confirm: 't' }) }
  }

  // fl_attachment makes Cloudinary answer with Content-Disposition: attachment
  // so the browser saves the file instead of rendering it in a tab.
  if (isCloudinaryUrl(url)) {
    return { url: buildCloudinaryDownloadUrl(url) }
  }

  if (/^https?:\/\//i.test(url)) {
    return { url }
  }

  return { status: 500, error: 'The stored file location is not a valid URL' }
}

/**
 * Validate (and canonicalise) a link an admin pasted instead of uploading a
 * file, so a resource that can never download correctly is never stored.
 *
 * Returns `{ ok: true, url, isGoogleDrive }` or `{ ok: false, error }`.
 * A Drive link is normalised to its direct-download URL rather than stored as
 * the `/view?usp=sharing` share page.
 */
function resolveExternalLink(rawLink) {
  const link = String(rawLink || '').trim()

  if (!link) return { ok: false, error: 'Link is required' }
  if (!/^https?:\/\//i.test(link)) {
    return { ok: false, error: 'Link must start with http:// or https://' }
  }
  if (isGoogleFolderUrl(link)) {
    return { ok: false, error: 'That is a Google Drive folder link — copy the link to a single file' }
  }
  if (isGoogleNonFileUrl(link)) {
    return { ok: false, error: 'That is a Google Form or Drawing — publish or export it as a file first' }
  }
  if (isGoogleDriveUrl(link)) {
    const fileId = extractGoogleDriveFileId(link)
    if (!fileId) {
      return {
        ok: false,
        error: 'Could not read a Google Drive file ID from that link — copy the "Share" link from Drive',
      }
    }
    return { ok: true, url: buildDriveDownloadUrl(fileId), isGoogleDrive: true }
  }

  return { ok: true, url: link, isGoogleDrive: false }
}

/**
 * Filename to store alongside a link. A Drive share link ends in "/view" or
 * "/preview", which would otherwise become the download filename, so a Drive
 * resource is named after its title instead.
 */
function deriveLinkFileName(link, { isGoogleDrive, title }) {
  if (isGoogleDrive) return `${title || 'document'}.pdf`
  return link.split('/').pop() || 'external-link'
}

module.exports = {
  resolveDirectDownloadUrl,
  resolveExternalLink,
  deriveLinkFileName,
}