// ── Google Drive URL handling ─────────────────────────────────────────────
// Mirrors backend/src/utils/googleDrive.js. These helpers were duplicated in
// api/resources.js, ResourcePreviewDrawer.jsx and ResourceSplitView.jsx and
// the copies drifted (different host allowlists), so links copied from Drive's
// own download button were sometimes not recognised at all.

// Hosts that serve Drive *files*. Keep in sync with backend/src/utils/googleDrive.js.
// "drive.userdata.google.com" was previously listed here but has no DNS record.
const DRIVE_FILE_HOSTS = [
  'drive.google.com',
  'drive.userdata.googleusercontent.com',
  'drive.googleusercontent.com',
  'docs.google.com',
  'sheets.google.com',
  'slides.google.com',
]

export function isGoogleDriveUrl(url) {
  if (!url || typeof url !== 'string') return false
  try {
    return DRIVE_FILE_HOSTS.includes(new URL(url).hostname.toLowerCase())
  } catch {
    return false
  }
}

// A /folders/ or /drive/u/…/folders/ link points at a folder, not a file.
export function isGoogleFolderUrl(url) {
  if (!isGoogleDriveUrl(url)) return false
  return /\/folders?\//i.test(url) || /\/drive\/[fu]\//i.test(url)
}

// Pull the file ID out of every shape Drive hands out. The fragment is stripped
// first — "/d/ABC#page=2" would otherwise yield "ABC#page=2".
export function extractGoogleDriveFileId(url) {
  if (!url || typeof url !== 'string') return null

  const clean = url.split('#')[0]

  const idMatch = clean.match(/[?&]id=([^&#]+)/)
  if (idMatch && idMatch[1]) return decodeURIComponent(idMatch[1])

  const dMatch = clean.match(/\/d\/([^/?#]+)/)
  if (dMatch && dMatch[1]) return decodeURIComponent(dMatch[1])

  return null
}

// Drive's own viewer. Used in an <iframe> rather than handing the URL to
// react-pdf: drive.google.com/…/preview serves an HTML page, which pdf.js
// cannot parse (it reported "Failed to load PDF document" for every Drive
// resource). Drive renders the PDF itself, and using their viewer also keeps
// the bytes off this server — Google rejects Drive downloads from datacenter
// IP ranges, so proxying them is unreliable in production.
export function getGoogleDriveEmbedUrl(url) {
  const fileId = extractGoogleDriveFileId(url)
  return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : null
}

// Direct download. confirm=t skips Drive's large-file interstitial for the
// sizes that allow it; Drive still shows its own page for bigger files.
export function getGoogleDriveDownloadUrl(url) {
  const fileId = extractGoogleDriveFileId(url)
  return fileId
    ? `https://drive.google.com/uc?export=download&confirm=t&id=${encodeURIComponent(fileId)}`
    : null
}

export function normalizeGoogleDriveUrl(url) {
  return getGoogleDriveDownloadUrl(url) || url
}
