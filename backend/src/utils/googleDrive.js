const axios = require('axios')

// ── Google Drive URL handling ─────────────────────────────────────────────
// These helpers used to be duplicated inline in routes/resources.js,
// routes/folders.js and the frontend API module, and the copies drifted apart
// (the backend allowlist was missing drive.userdata.googleusercontent.com, so
// links copied from Drive's own download button were treated as generic
// external links). One implementation now, imported everywhere.

// Hosts that serve Drive *files*. Mirrored in frontend/src/utils/googleDrive.js.
// "drive.userdata.google.com" was previously listed here but has no DNS
// record — it was never a real Google host.
const DRIVE_FILE_HOSTS = [
  'drive.google.com',
  'drive.userdata.googleusercontent.com',
  'drive.googleusercontent.com',
  'docs.google.com',
  'sheets.google.com',
  'slides.google.com',
]

function isGoogleDriveUrl(url) {
  if (!url || typeof url !== 'string') return false
  try {
    return DRIVE_FILE_HOSTS.includes(new URL(url).hostname.toLowerCase())
  } catch {
    return false
  }
}

// A /folders/ or /drive/u/…/folders/ link points at a folder, not a file.
function isGoogleFolderUrl(url) {
  if (!isGoogleDriveUrl(url)) return false
  return /\/folders?\//i.test(url) || /\/drive\/[fu]\//i.test(url)
}

// Pull the file ID out of every shape Drive hands out:
//   /file/d/<id>/view?usp=sharing
//   /open?id=<id>
//   /uc?export=download&id=<id>
//   /d/<id>            (optional #fragment, which must be stripped)
function extractGoogleDriveFileId(url) {
  if (!url || typeof url !== 'string') return null

  // Strip the fragment first — "/d/ABC#page=2" would otherwise yield
  // "ABC#page=2" and produce a bogus id that 404s.
  const clean = url.split('#')[0]

  const idMatch = clean.match(/[?&]id=([^&#]+)/)
  if (idMatch && idMatch[1]) return decodeURIComponent(idMatch[1])

  const dMatch = clean.match(/\/d\/([^/?#]+)/)
  if (dMatch && dMatch[1]) return decodeURIComponent(dMatch[1])

  return null
}

// Canonical direct-download URL for a file ID.
//
// Host notes, all verified by DNS/TLS check while fixing this:
//   drive.userdata.google.com          — no DNS record at all (it was in the old
//                                       allowlist here; it is not a real host)
//   drive.userdata.googleusercontent.com — resolves, but the TLS cert only
//                                       covers single-label *.googleusercontent.com,
//                                       so it fails the cert check
//   drive.google.com/uc                — resolves, valid cert, canonical endpoint
function buildDriveDownloadUrl(fileId, extraParams = {}) {
  return `https://drive.google.com/uc?${new URLSearchParams({
    export: 'download',
    ...extraParams,
    id: fileId,
  }).toString()}`
}

function normalizeGoogleDriveUrl(url) {
  const fileId = extractGoogleDriveFileId(url)
  return fileId ? buildDriveDownloadUrl(fileId) : url
}

// ── Classifying what Drive actually sent back ─────────────────────────────
// Drive serves several *different* pages, all as HTML (and private files as a
// bare 404). Telling them apart is the only way to give the user an accurate
// message instead of the old blanket "file not found".
function classifyDriveHtml(html) {
  if (!html) return 'unknown'
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').toLowerCase()

  if (text.includes('virus scan') || text.includes('scan in progress')) return 'confirm_required'

  if (
    text.includes("can't access this file") ||
    text.includes('request access') ||
    text.includes('you need access') ||
    text.includes('not authorized') ||
    text.includes('you do not have permission')
  ) {
    return 'forbidden'
  }
  if (
    text.includes('does not exist') ||
    text.includes('no longer exists') ||
    text.includes('file not found')
  ) {
    return 'missing'
  }
  return 'unknown'
}

function looksLikeHtml(contentType, buffer) {
  if (contentType && String(contentType).toLowerCase().includes('text/html')) return true
  if (!buffer || !buffer.length) return false
  const head = buffer.subarray(0, 512).toString('utf8').trimStart().toLowerCase()
  return head.startsWith('<!doctype html') || head.startsWith('<html')
}

// Drive's interstitial for large / virus-scanned files: a 200 HTML page whose
// hidden form must be replayed to obtain the real bytes.
function extractDriveConfirmForm(html) {
  if (!html || typeof html !== 'string') return null

  const formMatch = html.match(/<form[^>]*action="([^"]+)"[^>]*>([\s\S]*?)<\/form>/i)
  if (!formMatch) return null

  const fields = {}
  const inputRe = /<input[^>]*>/gi
  let match
  while ((match = inputRe.exec(formMatch[2])) !== null) {
    const input = match[0]
    const name = input.match(/name="([^"]*)"/i)
    const value = input.match(/value="([^"]*)"/i)
    if (name && name[1]) fields[name[1]] = value && value[1] ? value[1] : ''
  }
  if (!fields.id) return null

  return { action: formMatch[1].replace(/&amp;/g, '&'), fields }
}

async function readCapped(stream, cap) {
  const chunks = []
  let total = 0
  for await (const chunk of stream) {
    chunks.push(chunk)
    total += chunk.length
    if (total >= cap) break
  }
  return Buffer.concat(chunks).toString('utf8')
}

function driveError(reason) {
  const messages = {
    missing: 'Google Drive file not found — the link is wrong or the file was deleted',
    forbidden: 'Google Drive denied access — set the file sharing to "Anyone with the link" (Viewer)',
    // Drive refuses server-side downloads from datacenter IP ranges with a bare
    // 500, which is why the app sends the user's browser to Drive directly
    // instead of proxying the bytes. This message says so rather than guessing.
    unavailable: 'Google Drive could not be reached from the server — download the file directly from Drive instead',
  }
  const err = new Error(messages[reason] || messages.unavailable)
  err.driveReason = reason
  return err
}

/**
 * Fetch a Drive file as a stream, transparently following the
 * "confirm this large file" interstitial.
 *
 * Resolves to { response, contentType } with the real file bytes, or throws an
 * Error carrying `.driveReason` of 'missing' | 'forbidden' | 'unavailable'.
 */
async function fetchDriveStream(fileId, { timeout = 30000 } = {}) {
  const config = {
    responseType: 'stream',
    timeout,
    maxRedirects: 5,
    validateStatus: () => true,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ElectroInfinity/1.0)' },
  }

  const first = await axios.get(buildDriveDownloadUrl(fileId), config)
  const firstType = String(first.headers['content-type'] || '').toLowerCase()

  // A 4xx from Drive is ambiguous: 404 means "missing" *or* "private". Read
  // the body to find out which before reporting anything to the user.
  if (first.status === 404 || first.status === 403 || first.status === 401) {
    const body = await readCapped(first.data, 256 * 1024)
    const reason = classifyDriveHtml(body)
    if (first.status === 404 && reason === 'missing') throw driveError('missing')
    throw driveError('forbidden')
  }

  if (first.status < 200 || first.status >= 300) {
    first.data.resume()
    throw driveError('unavailable')
  }

  // Straight 2xx with non-HTML — we already have the file.
  if (!firstType.includes('html')) {
    return { response: first, contentType: firstType }
  }

  // HTML: either the confirm interstitial or an access error page.
  const html = await readCapped(first.data, 512 * 1024)
  const form = extractDriveConfirmForm(html)
  if (!form) {
    const reason = classifyDriveHtml(html)
    throw driveError(reason === 'missing' ? 'missing' : 'forbidden')
  }

  const params = new URLSearchParams({ ...form.fields, confirm: form.fields.confirm || 't' })
  const separator = form.action.includes('?') ? '&' : '?'
  const retryUrl = `${form.action}${separator}${params.toString()}`

  const second = await axios.get(retryUrl, {
    ...config,
    headers: { ...config.headers, Referer: 'https://drive.google.com/' },
  })

  const secondType = String(second.headers['content-type'] || '').toLowerCase()
  if (second.status < 200 || second.status >= 300 || secondType.includes('html')) {
    second.data.resume()
    throw driveError(second.status === 404 ? 'missing' : 'forbidden')
  }

  return { response: second, contentType: secondType }
}

/** Download a Drive file fully into memory (used by the folder import). */
async function fetchDriveBuffer(fileId, { timeout = 25000, maxBytes = 20 * 1024 * 1024 } = {}) {
  const { response, contentType } = await fetchDriveStream(fileId, { timeout })

  const chunks = []
  let total = 0
  for await (const chunk of response.data) {
    total += chunk.length
    if (total > maxBytes) {
      response.data.destroy()
      throw new Error(`File is larger than the ${Math.round(maxBytes / 1024 / 1024)}MB import limit`)
    }
    chunks.push(chunk)
  }

  return { buffer: Buffer.concat(chunks), contentType }
}

module.exports = {
  DRIVE_FILE_HOSTS,
  isGoogleDriveUrl,
  isGoogleFolderUrl,
  extractGoogleDriveFileId,
  buildDriveDownloadUrl,
  normalizeGoogleDriveUrl,
  extractDriveConfirmForm,
  classifyDriveHtml,
  looksLikeHtml,
  fetchDriveStream,
  fetchDriveBuffer,
  driveError,
}
